import { GAME_EVENTS, getRandomEvent, SECTOR_FLAVOR, ROOM_DESCRIPTIONS } from './public/events.js';

// --- GAME CONSTANTS ---
const NUM_SECTORS = 200;
const ROOMS = {
    'bridge': 'Bridge',
    'weapons': 'Weapons Cntrl',
    'cargo': 'Cargo Bay',
    'engineering': 'Engineering'
};

const COLORS = {
    GREEN: '#00FF00',
    RED: '#FF0000',
    YELLOW: '#FFFF00',
    CYAN: '#00FFFF',
    GRAY: '#AAAAAA',
    WHITE: '#FFFFFF',
    MAGENTA: '#FF00FF'
};

export class GameServer {
    constructor(state, env) {
        this.state = state;
        this.env = env;
        
        // State variables to be persisted
        this.ships = {};
        this.players = {};
        this.galaxy = {};
        this.npcs = {}; // ID -> NPC Object
        this.shipCounter = 1;
        this.npcCounter = 1;
        this.pendingRequests = {};
        
        // Temporary sessions (clients currently connected)
        this.sessions = [];
        
        // Load state from storage
        this.state.blockConcurrencyWhile(async () => {
            let stored = await this.state.storage.get(["ships", "players", "galaxy", "npcs", "shipCounter", "npcCounter", "pendingRequests"]);
            this.ships = stored.get("ships") || {};
            this.players = stored.get("players") || {};
            this.galaxy = stored.get("galaxy") || {};
            this.npcs = stored.get("npcs") || {};
            this.shipCounter = stored.get("shipCounter") || 1;
            this.npcCounter = stored.get("npcCounter") || 1;
            this.pendingRequests = stored.get("pendingRequests") || {};
            
            if (Object.keys(this.galaxy).length === 0) {
                this.generateGalaxy();
                await this.state.storage.put("galaxy", this.galaxy);
            }
            if (Object.keys(this.npcs).length === 0) {
                this.setupNPCs();
                await this.state.storage.put("npcs", this.npcs);
                await this.state.storage.put("npcCounter", this.npcCounter);
            }
            
            this.startTick();
        });
    }

    generateGalaxy() {
        for (let i = 1; i <= NUM_SECTORS; i++) {
            this.galaxy[i] = { id: i, links: [], encounterType: null, encounterData: null };
        }
        for (let i = 1; i <= NUM_SECTORS; i++) {
            const numLinks = Math.floor(Math.random() * 3) + 2;
            while (this.galaxy[i].links.length < numLinks) {
                const target = Math.floor(Math.random() * NUM_SECTORS) + 1;
                if (target !== i && !this.galaxy[i].links.includes(target)) {
                    this.galaxy[i].links.push(target);
                    if (!this.galaxy[target].links.includes(i)) {
                        this.galaxy[target].links.push(i);
                    }
                }
            }
            
            // Phase 17: Pre-seed encounters (Data only, no functions to survive DO serialization)
            const encounterRoll = Math.random();
            if (encounterRoll < 0.25) { // 25% chance for a narrative event
                const evTemplate = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
                this.galaxy[i].encounterType = evTemplate.type; 
                this.galaxy[i].encounterData = { id: evTemplate.id }; 
            } else if (encounterRoll < 0.40) { // 15% chance for an asteroid
                this.galaxy[i].encounterType = 'asteroid';
                this.galaxy[i].encounterData = { hp: 30, name: 'Asteroid' };
            } else if (encounterRoll < 0.45) { // 5% chance for a pirate ambush
                this.galaxy[i].encounterType = 'ship';
                this.galaxy[i].encounterData = { hp: 50, name: 'Scrap Pirate' };
            }
        }
    }

    clearGlobalEncounter(sector) {
        if (this.galaxy[sector]) {
            this.galaxy[sector].encounterType = null;
            this.galaxy[sector].encounterData = null;
            
            // Sync the removal to all ships in the sector so they don't interact with ghosts
            Object.values(this.ships).forEach(s => {
                if (s.sector === sector && s.currentEncounter && !s.currentEncounter.isGlobalNPC) {
                    s.currentEncounter = null;
                    s.crew.forEach(mid => {
                        const ses = this.sessions.find(ses => ses.playerId === mid);
                        if (ses) this.send(ses.ws, 'log', { message: `[SENSORS] Local encounter signature dissipated.`, color: '#AAAAAA' });
                    });
                }
            });
        }
    }

    setupNPCs() {
        const spawnNPC = (type, baseName, count, hp, behavior) => {
            for (let i = 0; i < count; i++) {
                const id = `N-${this.npcCounter.toString().padStart(3, '0')}`;
                this.npcCounter++;
                const sector = Math.floor(Math.random() * NUM_SECTORS) + 1;
                this.npcs[id] = {
                    id: id,
                    type: type,
                    name: `${baseName} ${Math.floor(Math.random() * 1000)}`,
                    sector: sector,
                    hp: hp,
                    maxHp: hp,
                    behavior: behavior, // 'aggressive', 'flee', 'neutral'
                    cooldown: 0
                };
            }
        };

        spawnNPC('pirate', 'Pirate Dreadnaught', 10, 150, 'aggressive');
        spawnNPC('merchant', 'Nomad Merchant', 5, 50, 'flee');
        spawnNPC('leviathan', 'Void Leviathan', 5, 300, 'neutral');
        spawnNPC('scavenger', 'Scrap Scavenger', 5, 50, 'neutral');
    }

    async fetch(request) {
        const upgradeHeader = request.headers.get("Upgrade");
        if (!upgradeHeader || upgradeHeader !== "websocket") {
            return new Response("Expected Upgrade: websocket", { status: 426 });
        }

        const [client, server] = new WebSocketPair();
        await this.handleSession(server);

        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }

    async handleSession(ws) {
        ws.accept();

        const session = { id: crypto.randomUUID(), ws, playerId: null };
        this.sessions.push(session);

        ws.addEventListener("message", async (msg) => {
            try {
                const data = JSON.parse(msg.data);
                
                // --- PERSISTENCE: Initial Handshake ---
                if (data.type === 'init') {
                    let playerId = data.playerId;
                    let player = null;

                    if (playerId && this.players[playerId]) {
                        player = this.players[playerId];
                        this.send(ws, 'log', { message: `RECONSECUTIVE UPLINK RESTORED. WELCOME BACK, ${player.name}.`, color: '#00FF00' });
                    } else {
                        playerId = crypto.randomUUID();
                        player = {
                            id: playerId,
                            name: `Guest-${Math.floor(Math.random() * 1000)}`,
                            state: 'LOBBY',
                            room: 'Bridge',
                            shipId: null
                        };
                        this.players[playerId] = player;
                        this.send(ws, 'log', { message: `NEW UPLINK ESTABLISHED. WELCOME TO SPIRAL NEBULA LOBBY.`, color: '#00FF00' });
                    }

                    session.playerId = playerId;
                    this.send(ws, 'identity', { id: playerId });
                    
                    if (player.state === 'IN_GAME' && player.shipId && this.ships[player.shipId]) {
                        const ship = this.ships[player.shipId];
                        if (!ship.crew.includes(playerId)) ship.crew.push(playerId);
                        this.send(ws, 'update_ui', { state: 'IN_GAME', location: player.room, sector: ship.sector });
                        this.send(ws, 'ship_sync', {
                            hull: { current: ship.hull, max: 100 },
                            fuel: { current: ship.fuel, max: 100 },
                            energy: { current: ship.energy, max: ship.maxEnergy },
                            scrap: ship.scrap,
                            cooldowns: ship.cooldowns
                        });
                        this.broadcastToShip(ship.id, { 
                            type: 'log', 
                            data: { message: `[SYS] ${player.name} reconnected.`, color: '#00FF00' } 
                        });
                    } else {
                        this.send(ws, 'update_ui', { state: 'LOBBY' });
                    }
                    
                    this.send(ws, 'log', { message: `Type 'help' to see all available commands.`, color: '#AAAAAA' });
                    await this.saveState();
                    return;
                }

                if (!session.playerId) return; // Ignore commands until init

                if (data.type === 'command') {
                    await this.handleCommand(session, data.cmd);
                }
            } catch (err) {
                console.error("WS Message Error:", err);
            }
        });

        ws.addEventListener("close", async () => {
            this.sessions = this.sessions.filter(s => s.id !== session.id);
            if (session.playerId) {
                const p = this.players[session.playerId];
                if (p && p.shipId) {
                    const ship = this.ships[p.shipId];
                    if (ship) {
                        this.broadcastToShip(ship.id, { 
                            type: 'log', 
                            data: { message: `[SYS] ${p.name} disconnected.`, color: '#FF0000' } 
                        });
                        // Do NOT delete player or ship here to maintain persistence
                    }
                }
            }
            await this.saveState();
        });
    }

    send(ws, type, data) {
        ws.send(JSON.stringify({ type, data }));
    }

    broadcastToShip(shipId, message) {
        const ship = this.ships[shipId];
        if (!ship) return;
        ship.crew.forEach(memberId => {
            const session = this.sessions.find(s => s.playerId === memberId);
            if (session) {
                this.send(session.ws, message.type, message.data);
            }
        });
    }

    async saveState() {
        await this.state.storage.put({
            ships: this.ships,
            players: this.players,
            shipCounter: this.shipCounter,
            pendingRequests: this.pendingRequests
        });
    }

    async destroyShip(shipId) {
        const ship = this.ships[shipId];
        if (!ship) return;

        // Notify and eject crew
        ship.crew.forEach(playerId => {
            const player = this.players[playerId];
            if (player) {
                player.state = 'LOBBY';
                player.shipId = null;
                player.room = 'Bridge';
            }
            
            const session = this.sessions.find(s => s.playerId === playerId);
            if (session) {
                this.send(session.ws, 'log', { message: `\n[!!!] CRITICAL FAILURE: THE ${ship.name} HAS BEEN DESTROYED.`, color: '#FF0000' });
                this.send(session.ws, 'log', { message: `EJECTING TO LOBBY...`, color: '#FFFF00' });
                this.send(session.ws, 'update_ui', { state: 'LOBBY' });
            }
        });

        // Cleanup storage
        delete this.ships[shipId];
        delete this.pendingRequests[shipId];
        
        await this.saveState();
    }

    async handleCommand(session, cmd) {
        const player = this.players[session.playerId];
        if (!player) return;

        const args = cmd.trim().split(' ');
        const mainCmd = args[0].toLowerCase();
        const ws = session.ws;

        if (player.state === 'LOBBY') {
            await this.handleLobbyCommand(session, player, mainCmd, args);
        } else {
            await this.handleGameCommand(session, player, mainCmd, args);
        }
        await this.saveState();
    }

    async handleLobbyCommand(session, player, mainCmd, args) {
        const ws = session.ws;
        if (mainCmd === 'create') {
            if (args.length < 2) {
                this.send(ws, 'log', { message: "ERROR: Provide a ship name (e.g., 'create Vanguard').", color: '#FF0000' });
                return;
            }
            const shipName = args.slice(1).join(' ').toUpperCase();
            const newShipId = `TGB-${1000 + this.shipCounter++}`;
            
            this.ships[newShipId] = {
                id: newShipId,
                name: shipName,
                sector: 1,
                fuel: 80,
                energy: 50,
                maxEnergy: 50,
                hull: 100,
                scrap: 15,
                currentEncounter: null,
                cooldowns: { 'Bridge': 0, 'Weapons Cntrl': 0, 'Cargo Bay': 0, 'Engineering': 0 },
                crew: [player.id],
                // Phase 15 state variables
                shieldsActive: false,
                evadeActive: false,
                jammedCooldown: 0,
                chaffActive: false,
                overchargeActive: false,
                droneActive: false,
                hideActive: false,
                overclockActive: false,
                fires: 0,
                enemyModifiers: {
                    weaponsDisabled: 0,
                    enginesDisabled: 0,
                    emped: 0
                }
            };
            
            player.state = 'IN_GAME';
            player.shipId = newShipId;
            player.room = ROOMS['bridge'];
            
            this.send(ws, 'log', { message: `[SYS] Commissioned ${shipName} (${newShipId}). You are the Captain.`, color: '#00FF00' });
            this.send(ws, 'update_ui', { state: 'IN_GAME', location: player.room, sector: this.ships[newShipId].sector });
            this.send(ws, 'log', { message: ROOM_DESCRIPTIONS[player.room], color: '#AAAAAA' });
        } else if (mainCmd === 'ships') {
            const activeShips = Object.values(this.ships);
            if (activeShips.length === 0) {
                this.send(ws, 'log', { message: `No active ships in the sector.`, color: '#AAAAAA' });
            } else {
                this.send(ws, 'log', { message: `--- ACTIVE VESSELS ---`, color: '#FFFF00' });
                activeShips.forEach(s => {
                    this.send(ws, 'log', { message: `[${s.id}] ${s.name} - Crew: ${s.crew.length}/4`, color: '#FFFFFF' });
                });
            }
        } else if (mainCmd === 'join') {
            if (args.length < 2) {
                this.send(ws, 'log', { message: "ERROR: Provide a ship ID or name (e.g., 'join TGB-1001' or 'join Vanguard').", color: '#FF0000' });
                return;
            }
            const targetInput = args.slice(1).join(' ').toUpperCase();
            let targetShip = this.ships[targetInput] || Object.values(this.ships).find(s => s.name.toUpperCase() === targetInput);
            
            if (!targetShip) {
                this.send(ws, 'log', { message: `ERROR: No ship found with name or registration '${targetInput}'.`, color: '#FF0000' });
                return;
            }
            if (targetShip.crew.length >= 4) {
                this.send(ws, 'log', { message: `ERROR: ${targetShip.name} is at maximum crew capacity.`, color: '#FF0000' });
                return;
            }
            if (!this.pendingRequests[targetShip.id]) this.pendingRequests[targetShip.id] = [];
            if (!this.pendingRequests[targetShip.id].includes(player.id)) {
                this.pendingRequests[targetShip.id].push(player.id);
            }
            
            this.send(ws, 'log', { message: `[SYS] Boarding request sent to ${targetShip.name}. Awaiting approval...`, color: '#FFFF00' });
            
            targetShip.crew.forEach(memberId => {
                const session = this.sessions.find(s => s.playerId === memberId);
                if (session) {
                    this.send(session.ws, 'log', { message: `[!] BOARDING REQUEST FROM ${player.name} (${player.id.slice(0, 4)}). Type 'approve ${player.id}' or 'deny ${player.id}'.`, color: '#FF00FF' });
                }
            });
        } else if (mainCmd === 'who') {
            const totalPlayers = Object.values(this.players).length;
            this.send(ws, 'log', { message: `--- CONNECTED PILOTS [${totalPlayers}] ---`, color: '#FFFF00' });
            Object.values(this.players).forEach(p => {
                const status = p.state === 'LOBBY' ? 'LOBBY' : `STEWARDING ${p.shipId}`;
                this.send(ws, 'log', { message: `[${p.id.slice(0, 4)}] ${p.name} - STATUS: ${status}`, color: '#FFFFFF' });
            });
        } else if (mainCmd === 'rename') {
            if (args.length < 2) {
                this.send(ws, 'log', { message: "ERROR: Provide a new name (e.g., 'rename StarPilot').", color: '#FF0000' });
                return;
            }
            const newName = args.slice(1).join(' ');
            if (newName.toLowerCase() === 'ship') {
                this.send(ws, 'log', { message: "ERROR: Player name cannot be 'ship'.", color: '#FF0000' });
                return;
            }
            const nameExists = Object.values(this.players).some(p => p.name.toLowerCase() === newName.toLowerCase());
            if (nameExists) {
                this.send(ws, 'log', { message: `ERROR: The name '${newName}' is already taken.`, color: '#FF0000' });
                return;
            }
            const oldName = player.name;
            player.name = newName;
            this.send(ws, 'log', { message: `[SYS] Name changed to ${newName}.`, color: '#00FF00' });
            // In lobby, no broadcast needed unless we want a global chat, but for now just local confirmation
        } else if (mainCmd === 'help') {
            this.send(ws, 'log', { message: `--- LOBBY COMMANDS ---`, color: '#FFFF00' });
            this.send(ws, 'log', { message: `> 'ships': List all active vessels in the nebula.`, color: '#FFFFFF' });
            this.send(ws, 'log', { message: `> 'create <name>': Commission a new ship and become its Captain.`, color: '#FFFFFF' });
            this.send(ws, 'log', { message: `> 'join <id>': Request to join the crew of an existing ship.`, color: '#FFFFFF' });
            this.send(ws, 'log', { message: `> 'rename <name>': Change your pilot callsign.`, color: '#FFFFFF' });
            this.send(ws, 'log', { message: `> 'who': See a list of all connected players.`, color: '#FFFFFF' });
            this.send(ws, 'log', { message: `> 'help': Show this message.`, color: '#FFFFFF' });
        } else {
            this.send(ws, 'log', { message: `ERROR: Invalid lobby command.`, color: '#FF0000' });
        }
    }

    async handleGameCommand(session, player, mainCmd, args) {
        const ws = session.ws;
        const ship = this.ships[player.shipId];
        if (!ship) {
            player.state = 'LOBBY';
            this.send(ws, 'update_ui', { state: 'LOBBY' });
            return;
        }

        const broadcast = (text, color = '#FFFFFF') => {
            ship.crew.forEach(memberId => {
                const s = this.sessions.find(ses => ses.playerId === memberId);
                if (s) this.send(s.ws, 'log', { message: text, color: color });
            });
        };

        // --- Encounter Resolution ---
        if (ship.currentEncounter && ['anomaly', 'derelict', 'hazard', 'distress', 'faction'].includes(ship.currentEncounter.type)) {
            const ev = ship.currentEncounter;
            const eventOpt = ev.options.find(o => o.command === mainCmd);
            if (!['move', 'comm', 'ships', 'help', 'who'].includes(mainCmd)) {
                if (eventOpt) {
                    if (eventOpt.requiredRoom && !player.room.toLowerCase().includes(eventOpt.requiredRoom.toLowerCase())) {
                        this.send(ws, 'log', { message: `ERROR: '${mainCmd}' MUST BE EXECUTED FROM ${ROOMS[eventOpt.requiredRoom] || eventOpt.requiredRoom.toUpperCase()}.`, color: '#FF0000' });
                        return;
                    }
                    eventOpt.execute(ship, player, broadcast);
                    
                    if (!ship.currentEncounter) {
                        this.clearGlobalEncounter(ship.sector);
                    }
                    
                    return;
                } else {
                    this.send(ws, 'log', { message: `ERROR: Invalid action during event.`, color: '#FF0000' });
                    return;
                }
            }
        }

        if (mainCmd === 'comm') {
            const msgText = args.slice(1).join(' ').replace(/^['"](.*)['"]$/, '$1');
            if (msgText) {
                Object.values(this.players).forEach(p => {
                    const targetShip = this.ships[p.shipId];
                    if (targetShip && targetShip.sector === ship.sector) {
                        const s = this.sessions.find(ses => ses.playerId === p.id);
                        if (s) s.ws.send(JSON.stringify({ type: 'chat', data: { sender: player.name, ship: ship.id, text: msgText, color: '#00FFFF' } }));
                    }
                });
            }
        } else if (mainCmd === 'approve' || mainCmd === 'deny') {
            const targetIdInput = args[1];
            if (!this.pendingRequests[ship.id]) {
                this.send(ws, 'log', { message: "ERROR: No pending requests for this ship.", color: '#FF0000' });
                return;
            }

            // Find the actual playerId from the input (could be short ID or full UUID)
            const actualPlayerId = this.pendingRequests[ship.id].find(id => id === targetIdInput || id.startsWith(targetIdInput));
            
            if (actualPlayerId) {
                this.pendingRequests[ship.id] = this.pendingRequests[ship.id].filter(id => id !== actualPlayerId);
                const targetPlayer = this.players[actualPlayerId];
                if (mainCmd === 'approve' && targetPlayer && ship.crew.length < 4) {
                    targetPlayer.state = 'IN_GAME';
                    targetPlayer.shipId = ship.id;
                    targetPlayer.room = ROOMS['cargo'];
                    ship.crew.push(actualPlayerId);
                    const ts = this.sessions.find(s => s.playerId === actualPlayerId);
                    if (ts) {
                        this.send(ts.ws, 'update_ui', { state: 'IN_GAME', location: targetPlayer.room, sector: ship.sector });
                        this.send(ts.ws, 'log', { message: `[SYS] Boarding request APPROVED. Welcome to the ${ship.name}.`, color: '#00FF00' });
                        this.send(ts.ws, 'log', { message: ROOM_DESCRIPTIONS[targetPlayer.room], color: '#AAAAAA' });
                    }
                    broadcast(`[SYS] ${targetPlayer.name} has joined the crew.`, '#FFFF00');
                } else if (targetPlayer) {
                    const ts = this.sessions.find(s => s.playerId === actualPlayerId);
                    if (ts) this.send(ts.ws, 'log', { message: `[SYS] Boarding request DENIED by ${ship.name}.`, color: '#FF0000' });
                }
            } else {
                this.send(ws, 'log', { message: `ERROR: No pending request matching '${targetIdInput}'.`, color: '#FF0000' });
            }
        } else if (mainCmd === 'move') {
            const dest = args[1]?.toLowerCase();
            if (ROOMS[dest]) {
                player.room = ROOMS[dest];
                this.send(ws, 'update_ui', { location: player.room });
                this.send(ws, 'log', { message: `Moved to ${player.room}.`, color: '#00FFFF' });
                this.send(ws, 'log', { message: ROOM_DESCRIPTIONS[player.room], color: '#AAAAAA' });
                ship.crew.forEach(mid => {
                    if (mid !== player.id) {
                        const s = this.sessions.find(ses => ses.playerId === mid);
                        if (s) this.send(s.ws, 'log', { message: `[CREW] ${player.name} moved to ${player.room}.`, color: '#AAAAAA' });
                    }
                });
            } else {
                this.send(ws, 'log', { message: `ERROR: Unknown room.`, color: '#FF0000' });
            }
        } else if (mainCmd === 'scan') {
            if (player.room !== ROOMS['bridge']) {
                this.send(ws, 'log', { message: "ERROR: SCANNERS ACCESSED FROM BRIDGE ONLY.", color: '#FF0000' });
                return;
            }
            if (args[1] === 'deep') {
                if (ship.energy < 5) {
                    this.send(ws, 'log', { message: "ERROR: INSUFFICIENT ENERGY FOR DEEP SCAN.", color: '#FF0000' });
                    return;
                }
                ship.energy -= 5;
                const sectorData = this.galaxy[ship.sector];
                this.send(ws, 'log', { message: `--- DEEP SPACE SCAN ---`, color: '#00FFFF' });
                this.send(ws, 'log', { message: `Adjacent Sectors analyzed.`, color: '#FFFFFF' });
                
                let npcsFound = false;
                sectorData.links.forEach(linkedSector => {
                    const npcsInAdj = Object.values(this.npcs).filter(n => n.sector === linkedSector && n.hp > 0);
                    npcsInAdj.forEach(n => {
                        this.send(ws, 'log', { message: `[SECTOR ${linkedSector}] Detected ${n.name}`, color: '#FFFF00' });
                        npcsFound = true;
                    });
                });
                if (!npcsFound) this.send(ws, 'log', { message: `No significant entities detected in adjacent sectors.`, color: '#AAAAAA' });

                broadcast(`[BRIDGE] ${player.name} initiated a Deep Space Scan. (-5 Energy)`, '#00FFFF');
            } else {
                const sectorData = this.galaxy[ship.sector];
                this.send(ws, 'log', { message: `--- LONG RANGE SCANNERS ---`, color: '#FFFF00' });
                this.send(ws, 'log', { message: `Current Sector: ${ship.sector}`, color: '#FFFFFF' });
                this.send(ws, 'log', { message: `Linked Jump Points: ${sectorData.links.join(', ')}`, color: '#00FFFF' });
                
                const localNpcs = Object.values(this.npcs).filter(n => n.sector === ship.sector && n.hp > 0);
                if (localNpcs.length > 0) {
                    this.send(ws, 'log', { message: `--- LOCAL ENTITIES DETECTED ---`, color: '#FF00FF' });
                    localNpcs.forEach(n => {
                        this.send(ws, 'log', { message: `- ${n.name} [${n.type.toUpperCase()}]`, color: '#FFFFFF' });
                    });
                }
            }
        } else if (mainCmd === 'hail') {
            if (player.room !== ROOMS['bridge']) {
                this.send(ws, 'log', { message: "ERROR: COMMS ACCESSED FROM BRIDGE ONLY.", color: '#FF0000' });
                return;
            }
            if (ship.currentEncounter && ship.currentEncounter.type === 'ship') {
                if (ship.currentEncounter.isGlobalNPC) {
                    const globalNpc = this.npcs[ship.currentEncounter.id];
                    if (globalNpc && globalNpc.type === 'merchant') {
                        if (ship.scrap >= 20) {
                            ship.scrap -= 20;
                            ship.fuel += 50;
                            ship.energy += 50;
                            broadcast(`[COMM] ${globalNpc.name}: "A pleasure doing business." (Traded 20 Scrap for 50 Fuel & Energy)`, '#00FF00');
                            globalNpc.cooldown = 0; // flee immediately essentially
                        } else {
                            broadcast(`[COMM] ${globalNpc.name}: "Come back when you have 20 units of scrap."`, '#AAAAAA');
                        }
                    } else if (globalNpc && globalNpc.type === 'pirate') {
                        broadcast(`[COMM] ${globalNpc.name}: "We only deal in laser blasts."`, '#FF0000');
                    } else {
                        broadcast(`[COMM] Hailing the entity... No response.`, '#00FFFF');
                    }
                } else {
                     broadcast(`[BRIDGE] Hailing ${ship.currentEncounter.name}... No response.`, '#00FFFF');
                }
            } else {
                const localMerchant = Object.values(this.npcs).find(n => n.sector === ship.sector && n.type === 'merchant' && n.hp > 0);
                if (localMerchant) {
                     if (ship.scrap >= 20) {
                            ship.scrap -= 20;
                            ship.fuel += 50;
                            ship.energy += 50;
                            broadcast(`[COMM] ${localMerchant.name}: "A pleasure doing business." (Traded 20 Scrap for 50 Fuel & Energy)`, '#00FF00');
                        } else {
                            broadcast(`[COMM] ${localMerchant.name}: "Come back when you have 20 units of scrap."`, '#AAAAAA');
                        }
                } else {
                    this.send(ws, 'log', { message: "ERROR: NO VALID TARGET TO HAIL.", color: '#FF0000' });
                }
            }
        } else if (mainCmd === 'shields') {
            if (player.room !== ROOMS['bridge']) {
                this.send(ws, 'log', { message: "ERROR: SHIELDS ACCESSED FROM BRIDGE ONLY.", color: '#FF0000' });
                return;
            }
            if (ship.energy < 5) {
                this.send(ws, 'log', { message: "ERROR: INSUFFICIENT ENERGY.", color: '#FF0000' });
                return;
            }
            ship.energy -= 5;
            ship.shieldsActive = true;
            broadcast(`[BRIDGE] INCOMING DAMAGE MITIGATION ACTIVE. (-5 Energy)`, '#00FFFF');
        } else if (mainCmd === 'evade') {
            if (player.room !== ROOMS['bridge']) {
                this.send(ws, 'log', { message: "ERROR: HELM ACCESSED FROM BRIDGE ONLY.", color: '#FF0000' });
                return;
            }
            if (ship.cooldowns['Bridge'] > 0) {
                this.send(ws, 'log', { message: "ERROR: BRIDGE CONTROLS ON COOLDOWN.", color: '#FF0000' });
                return;
            }
            ship.evadeActive = true;
            ship.cooldowns['Bridge'] = 3; // Delay jump
            broadcast(`[BRIDGE] EVASIVE MANEUVERS INITIATED. BRACING FOR IMPACT.`, '#00FFFF');
        } else if (mainCmd === 'jam') {
            if (player.room !== ROOMS['bridge']) {
                this.send(ws, 'log', { message: "ERROR: COMMS ACCESSED FROM BRIDGE ONLY.", color: '#FF0000' });
                return;
            }
            if (!ship.currentEncounter || ship.currentEncounter.type !== 'ship') {
                this.send(ws, 'log', { message: "ERROR: NO COMBAT TARGET TO JAM.", color: '#FF0000' });
                return;
            }
            if (ship.energy < 8) {
                this.send(ws, 'log', { message: "ERROR: INSUFFICIENT ENERGY (8 REQ).", color: '#FF0000' });
                return;
            }
            ship.energy -= 8;
            ship.jammedCooldown = 3;
            broadcast(`[BRIDGE] ELECTRONIC COUNTERMEASURES DEPLOYED. ENEMY SENSORS JAMMED.`, '#00FFFF');
        } else if (mainCmd === 'jump') {
            if (player.room !== ROOMS['bridge']) {
                this.send(ws, 'log', { message: "ERROR: JUMP MUST BE EXECUTED FROM THE BRIDGE.", color: '#FF0000' });
                return;
            }
            const destSector = parseInt(args[1]);
            const currentSectorData = this.galaxy[ship.sector];
            if (ship.cooldowns['Bridge'] > 0) {
                this.send(ws, 'log', { message: `ERROR: BRIDGE ON COOLDOWN.`, color: '#FF0000' });
                return;
            }
            if (currentSectorData.links.includes(destSector) && ship.fuel >= 10) {
                ship.fuel -= 10;
                ship.cooldowns['Bridge'] = 5;
                broadcast(`SPOOLING FSD DRIVE...`, '#00FFFF');
                setTimeout(async () => {
                    if (this.ships[ship.id]) {
                        ship.sector = destSector;
                        ship.crew.forEach(mid => {
                            const s = this.sessions.find(ses => ses.playerId === mid);
                            if (s) {
                                this.send(s.ws, 'update_ui', { sector: ship.sector });
                                this.send(s.ws, 'log', { message: `JUMP SUCCESSFUL. Sector ${destSector}.`, color: '#00FF00' });
                                this.send(s.ws, 'log', { message: SECTOR_FLAVOR[Math.floor(Math.random() * SECTOR_FLAVOR.length)], color: '#AAAAAA' });
                            }
                        });
                        
                        const encType = this.galaxy[destSector].encounterType;
                        const encData = this.galaxy[destSector].encounterData;
                        
                        if (encType && encData) {
                            if (encType === 'asteroid') {
                                ship.currentEncounter = { type: 'asteroid', hp: encData.hp, name: encData.name };
                                broadcast(`--- SENSORS DETECT AN ASTEROID ---`, '#FFFF00');
                            } else if (encType === 'ship') {
                                ship.currentEncounter = { type: 'ship', hp: encData.hp, name: encData.name };
                                broadcast(`--- PROXIMITY ALERT! ---`, '#FF0000');
                                broadcast(`[!] ${encData.name.toUpperCase()} LIES IN AMBUSH!`, '#FF0000');
                            } else {
                                const template = GAME_EVENTS.find(e => e.id === encData.id);
                                if (template) {
                                    ship.currentEncounter = Object.assign({}, template);
                                    broadcast(`\n--- SENSORS DETECT AN OBJECT ---`, '#FFFF00');
                                    broadcast(`${template.title.toUpperCase()} [${template.type.toUpperCase()}]`, '#00FFFF');
                                    broadcast(template.text, '#FFFFFF');
                                    if (template.options) {
                                        broadcast("ACTIONS: " + template.options.map(o => `'${o.command}'`).join(', '), '#AAAAAA');
                                    }
                                } else {
                                    ship.currentEncounter = null;
                                }
                            }
                        } else {
                            ship.currentEncounter = null;
                        }
                        
                        await this.saveState();
                    }
                }, 2000);
            } else {
                this.send(ws, 'log', { message: "ERROR: Invalid jump path or no fuel.", color: '#FF0000' });
            }
        } else if (mainCmd === 'attack' || mainCmd === 'target' || mainCmd === 'emp' || mainCmd === 'chaff' || mainCmd === 'overcharge' || mainCmd === 'flak') {
            if (player.room !== ROOMS['weapons']) {
                this.send(ws, 'log', { message: "ERROR: WEAPONS MUST BE EXECUTED FROM WEAPONS CNTRL.", color: '#FF0000' });
                return;
            }
            
            if (ship.cooldowns['Weapons Cntrl'] > 0) {
                this.send(ws, 'log', { message: "ERROR: Weapons cooling down.", color: '#FF0000' });
                return;
            }

            const noTargetErr = () => this.send(ws, 'log', { message: "ERROR: NO TARGETS.", color: '#FF0000' });
            const noEnergyErr = (cost) => this.send(ws, 'log', { message: `ERROR: LOW ENERGY. (${cost} REQ)`, color: '#FF0000' });

            if (!ship.currentEncounter || (ship.currentEncounter.type !== 'ship' && ship.currentEncounter.type !== 'asteroid')) {
                const targetableNpc = Object.values(this.npcs).find(n => n.sector === ship.sector && n.hp > 0 && n.type !== 'merchant');
                if (targetableNpc && (mainCmd === 'attack' || mainCmd === 'target' || mainCmd === 'emp' || mainCmd === 'chaff' || mainCmd === 'overcharge' || mainCmd === 'flak')) {
                     ship.currentEncounter = {
                        id: targetableNpc.id,
                        type: 'ship',
                        name: targetableNpc.name,
                        hp: targetableNpc.hp,
                        maxHp: targetableNpc.maxHp,
                        isGlobalNPC: true
                    };
                    broadcast(`[WEAPONS] TARGET LOCKED: ${targetableNpc.name.toUpperCase()}`, '#FF0000');
                } else {
                    noTargetErr(); return;
                }
            }

            if (mainCmd === 'attack') {
                if (ship.energy < 5) return noEnergyErr(5);
                ship.energy -= 5;
                ship.cooldowns['Weapons Cntrl'] = 3;
                let dmg = Math.floor(Math.random() * 20) + 10;
                if (ship.overchargeActive) {
                    dmg *= 2;
                    ship.overchargeActive = false;
                    broadcast(`[WEAPONS] OVERCHARGED BEAM FIRED! DEVASTATING DAMAGE!`, '#FF0000');
                }
                ship.currentEncounter.hp -= dmg;
                broadcast(`[WEAPONS] Hit ${ship.currentEncounter.name || 'Asteroid'} for ${dmg} DMG.`, '#FF00FF');

            } else if (mainCmd === 'target') {
                if (ship.energy < 8) return noEnergyErr(8);
                const sysTarget = args[1]?.toLowerCase();
                if (sysTarget === 'weapons') {
                    ship.enemyModifiers.weaponsDisabled = 3;
                    broadcast(`[WEAPONS] TARGETED FIRE ON ENEMY WEAPONS. DAMAGE OUTPUT REUDCED.`, '#FF00FF');
                } else if (sysTarget === 'engines') {
                    ship.enemyModifiers.enginesDisabled = 3;
                    broadcast(`[WEAPONS] TARGETED FIRE ON ENEMY ENGINES. THEY CANNOT FLEE.`, '#FF00FF');
                } else {
                    this.send(ws, 'log', { message: "ERROR: Valid targets: 'weapons', 'engines'.", color: '#FF0000' });
                    return;
                }
                ship.energy -= 8;
                ship.cooldowns['Weapons Cntrl'] = 4;

            } else if (mainCmd === 'emp') {
                if (ship.scrap < 10) {
                    this.send(ws, 'log', { message: "ERROR: REQUIRES 10 SCRAP TO BUILD EMP TORPEDO.", color: '#FF0000' });
                    return;
                }
                if (ship.currentEncounter.type !== 'ship') {
                    this.send(ws, 'log', { message: "ERROR: EMP ONLY AFFECTS SHIPS.", color: '#FF0000' });
                    return;
                }
                ship.scrap -= 10;
                ship.enemyModifiers.emped = 4; // 4 ticks of silence
                ship.cooldowns['Weapons Cntrl'] = 5;
                broadcast(`[WEAPONS] EMP TORPEDO DEPLOYED! ENEMY SYSTEMS OFFLINE!`, '#00FFFF');

            } else if (mainCmd === 'chaff') {
                if (ship.energy < 5) return noEnergyErr(5);
                ship.energy -= 5;
                ship.chaffActive = true;
                ship.cooldowns['Weapons Cntrl'] = 2;
                broadcast(`[WEAPONS] COUNTERMEASURES DEPLOYED. NEXT ATTACK WILL BE DEFLECTED.`, '#FF00FF');

            } else if (mainCmd === 'overcharge') {
                if (ship.energy < 15) return noEnergyErr(15);
                ship.energy -= 15;
                ship.hull -= 5; // self damage
                ship.overchargeActive = true;
                ship.cooldowns['Weapons Cntrl'] = 2;
                broadcast(`[WEAPONS] WARNING: WEAPONS OVERCHARGED. HULL TOOK 5 DMG FROM HEAT.`, '#FF0000');
                
                if (ship.hull <= 0) {
                    await this.destroyShip(ship.id);
                    return;
                }

            } else if (mainCmd === 'flak') {
                if (ship.scrap < 5) {
                    this.send(ws, 'log', { message: "ERROR: REQUIRES 5 SCRAP AMMO.", color: '#FF0000' });
                    return;
                }
                ship.scrap -= 5;
                ship.cooldowns['Weapons Cntrl'] = 2;
                const dmg = Math.floor(Math.random() * 15) + 5;
                ship.currentEncounter.hp -= dmg;
                broadcast(`[WEAPONS] FLAK CANNON FIRED! Hit for ${dmg} DMG.`, '#FF00FF');
            }

            // Check Destroyed
            if (ship.currentEncounter && ship.currentEncounter.hp <= 0) {
                broadcast(`** TARGET DESTROYED **`, '#00FF00');
                if (ship.currentEncounter.type === 'ship') {
                    const scrap = Math.floor(Math.random() * 30) + 10;
                    ship.scrap += scrap;
                    broadcast(`Salvaged ${scrap} Scrap.`, '#00FF00');
                }
                
                if (ship.currentEncounter.isGlobalNPC && this.npcs[ship.currentEncounter.id]) {
                    this.npcs[ship.currentEncounter.id].hp = 0;
                } else if (!ship.currentEncounter.isGlobalNPC) {
                    this.clearGlobalEncounter(ship.sector);
                }
                
                ship.currentEncounter = null;
            } else if (ship.currentEncounter && ship.currentEncounter.isGlobalNPC && this.npcs[ship.currentEncounter.id]) {
                this.npcs[ship.currentEncounter.id].hp = ship.currentEncounter.hp;
            }
            // Cleaned up duplicate attack logic
        } else if (mainCmd === 'repair' || mainCmd === 'reroute' || mainCmd === 'patch' || mainCmd === 'overclock' || mainCmd === 'siphon' || mainCmd === 'vent') {
            if (player.room !== ROOMS['engineering']) {
                this.send(ws, 'log', { message: "ERROR: MUST BE EXECUTED FROM ENGINEERING.", color: '#FF0000' });
                return;
            }
            if (ship.cooldowns['Engineering'] > 0) {
                this.send(ws, 'log', { message: "ERROR: ENGINEERING SYSTEMS ON COOLDOWN.", color: '#FF0000' });
                return;
            }
            
            if (mainCmd === 'repair') {
                if (ship.scrap < 5 || ship.hull >= 100) {
                    this.send(ws, 'log', { message: "ERROR: Requires 5 Scrap or Hull is already full.", color: '#FF0000' });
                    return;
                }
                ship.scrap -= 5;
                ship.hull = Math.min(100, ship.hull + 10);
                ship.cooldowns['Engineering'] = 5;
                broadcast(`[ENGINEERING] Heavy hull repair complete. (+10 Hull)`, '#00FF00');
            } else if (mainCmd === 'reroute') {
                const targetRoomStr = args[1]?.toLowerCase();
                let targetRoomMap = { 'bridge': 'Bridge', 'weapons': 'Weapons Cntrl', 'cargo': 'Cargo Bay' };
                let mapped = targetRoomMap[targetRoomStr];
                if (!mapped) {
                    this.send(ws, 'log', { message: "ERROR: reroute <bridge|weapons|cargo>", color: '#FF0000' });
                    return;
                }
                if (ship.energy < 15) { this.send(ws, 'log', { message: "ERROR: REQUIRES 15 ENERGY.", color: '#FF0000' }); return; }
                ship.energy -= 15;
                ship.cooldowns[mapped] = 0;
                ship.cooldowns['Engineering'] = 4;
                broadcast(`[ENGINEERING] Power rerouted to ${mapped}! Cooldowns cleared.`, '#00FFFF');
            } else if (mainCmd === 'patch') {
                ship.hull = Math.min(100, ship.hull + 2);
                ship.cooldowns['Engineering'] = 2; // Short cooldown
                broadcast(`[ENGINEERING] Emergency micro-patch applied. (+2 Hull)`, '#00FF00');
            } else if (mainCmd === 'overclock') {
                if (ship.overclockActive) {
                    ship.overclockActive = false;
                    broadcast(`[ENGINEERING] REACTOR OVERCLOCK DISABLED.`, '#00FFFF');
                } else {
                    ship.overclockActive = true;
                    broadcast(`[ENGINEERING] WARNING: REACTOR OVERCLOCKED. ENERGY REGEN INCREASED. FIRE RISK HIGH.`, '#FF0000');
                }
                ship.cooldowns['Engineering'] = 3;
            } else if (mainCmd === 'siphon') {
                if (ship.energy < 40) { this.send(ws, 'log', { message: "ERROR: REQUIRES 40 ENERGY TO SYNTHESIZE FUEL.", color: '#FF0000' }); return; }
                ship.energy -= 40;
                ship.fuel += 1;
                ship.cooldowns['Engineering'] = 5;
                broadcast(`[ENGINEERING] Emergency siphon complete. Synthesized 1 Jump Fuel.`, '#00FF00');
            } else if (mainCmd === 'vent') {
                if (ship.fires > 0) {
                    broadcast(`[ENGINEERING] Plasma vents opened. ${ship.fires} fires extinguished!`, '#00FFFF');
                    ship.fires = 0;
                } else {
                    broadcast(`[ENGINEERING] Vents cycled. No hazards detected.`, '#AAAAAA');
                }
                ship.cooldowns['Engineering'] = 4;
            }
        } else if (mainCmd === 'mine' || mainCmd === 'refine' || mainCmd === 'airlock' || mainCmd === 'probe' || mainCmd === 'drone' || mainCmd === 'hide') {
            if (player.room !== ROOMS['cargo']) {
                this.send(ws, 'log', { message: "ERROR: MUST BE EXECUTED FROM CARGO BAY.", color: '#FF0000' });
                return;
            }
            if (ship.cooldowns['Cargo Bay'] > 0) {
                this.send(ws, 'log', { message: "ERROR: CARGO SYSTEMS ON COOLDOWN.", color: '#FF0000' });
                return;
            }

            if (mainCmd === 'mine') {
                if (ship.energy < 2) { this.send(ws, 'log', { message: "ERROR: Low energy.", color: '#FF0000' }); return; }
                if (ship.currentEncounter && ship.currentEncounter.type === 'asteroid') {
                    ship.energy -= 2;
                    ship.cooldowns['Cargo Bay'] = 3;
                    const yieldAmt = Math.floor(Math.random() * 5) + 2;
                    ship.scrap += yieldAmt;
                    ship.currentEncounter.hp -= 10;
                    broadcast(`[CARGO] ${player.name} mined ${yieldAmt} Scrap.`, '#00FF00');
                    if (ship.currentEncounter.hp <= 0) {
                        broadcast(`ASTEROID DEPLETED.`, '#AAAAAA');
                        ship.currentEncounter = null;
                    }
                } else {
                    this.send(ws, 'log', { message: "ERROR: NO ASTEROID.", color: '#FF0000' });
                }
            } else if (mainCmd === 'refine') {
                if (ship.scrap < 10) { this.send(ws, 'log', { message: "ERROR: REQUIRES 10 SCRAP.", color: '#FF0000' }); return; }
                const targetRes = args[1]?.toLowerCase();
                if (targetRes === 'fuel') {
                    ship.scrap -= 10;
                    ship.fuel += 5;
                    broadcast(`[CARGO] 10 Scrap refined into 5 Jump Fuel.`, '#00FF00');
                } else if (targetRes === 'energy') {
                    ship.scrap -= 10;
                    ship.energy = Math.min(ship.maxEnergy, ship.energy + 20);
                    broadcast(`[CARGO] 10 Scrap refined into 20 Energy cells.`, '#00FF00');
                } else {
                    this.send(ws, 'log', { message: "ERROR: refine <fuel|energy>", color: '#FF0000' });
                    return;
                }
                ship.cooldowns['Cargo Bay'] = 4;
            } else if (mainCmd === 'airlock') {
                ship.cooldowns['Cargo Bay'] = 5;
                if (ship.currentEncounter && ship.currentEncounter.hp <= 0 && ship.currentEncounter.type === 'ship') {
                    const bonus = Math.floor(Math.random() * 20);
                    ship.scrap += bonus;
                    broadcast(`[CARGO] Airlock boarding successful. Recovered ${bonus} extra scrap from derelict.`, '#00FF00');
                } else {
                    if (ship.scrap < 15) { this.send(ws, 'log', { message: "ERROR: REQUIRES 15 SCRAP TO JETTISON.", color: '#FF0000' }); return; }
                    ship.scrap -= 15;
                    broadcast(`[CARGO] 15 Scrap jettisoned! Environmental hazards temporarily distracted.`, '#00FFFF');
                }
            } else if (mainCmd === 'probe') {
                if (ship.scrap < 20) { this.send(ws, 'log', { message: "ERROR: REQUIRES 20 SCRAP TO BUILD PROBE.", color: '#FF0000' }); return; }
                ship.scrap -= 20;
                ship.cooldowns['Cargo Bay'] = 5;
                broadcast(`[CARGO] PROBE LAUNCHED. Gathering deep sector telemetry...`, '#00FFFF');
            } else if (mainCmd === 'drone') {
                if (ship.scrap < 10) { this.send(ws, 'log', { message: "ERROR: REQUIRES 10 SCRAP TO ASSEMBLE DRONE.", color: '#FF0000' }); return; }
                ship.scrap -= 10;
                ship.droneActive = true;
                ship.cooldowns['Cargo Bay'] = 5;
                broadcast(`[CARGO] AUTOMATED SALVAGE DRONE DEPLOYED. Passive scrap collection active.`, '#00FF00');
            } else if (mainCmd === 'hide') {
                ship.hideActive = true;
                ship.cooldowns['Cargo Bay'] = 3;
                broadcast(`[CARGO] VALUABLE CONTRABAND CONCEALED IN BULKHEADS.`, '#00FFFF');
            }
        } else if (mainCmd === 'comm') {
            if (args[1]?.toLowerCase() === 'server') {
                if (ship.energy < 5) {
                    this.send(ws, 'log', { message: "ERROR: REQUIRES 5 ENERGY TO BROADCAST.", color: '#FF0000' });
                    return;
                }
                if (player.room !== ROOMS['bridge']) {
                    this.send(ws, 'log', { message: "ERROR: SERVER COMMS MUST BE SENT FROM THE BRIDGE.", color: '#FF0000' });
                    return;
                }
                const msg = args.slice(2).join(' ');
                if (!msg) {
                    this.send(ws, 'log', { message: "ERROR: Provide a message (e.g. 'comm server Hello Sector').", color: '#FF0000' });
                    return;
                }
                ship.energy -= 5;
                const globalMessage = `[BROADCAST] ${ship.name} (${player.name}): ${msg}`;
                Object.values(this.ships).forEach(s => {
                    s.crew.forEach(memberId => {
                        const ses = this.sessions.find(session => session.playerId === memberId);
                        if (ses) this.send(ses.ws, 'log', { message: globalMessage, color: '#FF00FF' });
                    });
                });
            } else {
                this.send(ws, 'log', { message: "ERROR: Usage: 'comm server <message>'", color: '#FF0000' });
            }
        } else if (mainCmd === 'who') {
            const totalPlayers = Object.values(this.players).length;
            this.send(ws, 'log', { message: `--- CONNECTED PILOTS [${totalPlayers}] ---`, color: '#FFFF00' });
            Object.values(this.players).forEach(p => {
                const status = (p.shipId === ship.id) ? 'CREWMATE' : (p.state === 'LOBBY' ? 'LOBBY' : `ABOARD ${p.shipId}`);
                this.send(ws, 'log', { message: `[${p.id.slice(0, 4)}] ${p.name} - STATUS: ${status}`, color: '#FFFFFF' });
            });
        } else if (mainCmd === 'rename') {
            if (args.length < 2) {
                this.send(ws, 'log', { message: "ERROR: Provide a name or 'ship <newname>'.", color: '#FF0000' });
                return;
            }
            if (args[1].toLowerCase() === 'ship') {
                if (args.length < 3) {
                    this.send(ws, 'log', { message: "ERROR: Provide a new name for the ship.", color: '#FF0000' });
                    return;
                }
                const newShipName = args.slice(2).join(' ').toUpperCase();
                const oldShipName = ship.name;
                ship.name = newShipName;
                broadcast(`[SYS] ${player.name} has renamed the ship to ${newShipName}.`, '#00FF00');
            } else {
                const newName = args.slice(1).join(' ');
                const nameExists = Object.values(this.players).some(p => p.name.toLowerCase() === newName.toLowerCase());
                if (nameExists) {
                    this.send(ws, 'log', { message: `ERROR: The name '${newName}' is already taken.`, color: '#FF0000' });
                    return;
                }
                const oldName = player.name;
                player.name = newName;
                broadcast(`[SYS] ${oldName} is now known as ${newName}.`, '#00FF00');
            }
        } else if (mainCmd === 'help') {
            this.send(ws, 'log', { message: `--- COMMAND PROTOCOLS ---`, color: '#FFFF00' });
            this.send(ws, 'log', { message: `> GLOBAL: move <room>, who, rename <name>, rename ship <name>, help`, color: '#FFFFFF' });
            if (player.room === ROOMS['bridge']) {
                this.send(ws, 'log', { message: `> BRIDGE: jump <sector>, scan [deep], hail, shields, evade, jam, comm server <msg>`, color: '#00FFFF' });
            } else if (player.room === ROOMS['weapons']) {
                this.send(ws, 'log', { message: `> WEAPONS: attack, target <sys>, emp, chaff, overcharge, flak`, color: '#FF00FF' });
            } else if (player.room === ROOMS['cargo']) {
                this.send(ws, 'log', { message: `> CARGO BAY: mine, refine <sys>, airlock, probe, drone, hide`, color: '#00FF00' });
            } else if (player.room === ROOMS['engineering']) {
                this.send(ws, 'log', { message: `> ENGINEERING: repair, reroute <room>, patch, overclock, siphon, vent`, color: '#FFA500' });
            }
        }
 else {
            this.send(ws, 'log', { message: `Action '${mainCmd}' not recognized.`, color: '#AAAAAA' });
        }
    }



    startTick() {
        if (this.tickInterval) return;
        this.tickInterval = setInterval(async () => {
            let stateChanged = false;
            for (const shipId in this.ships) {
                const ship = this.ships[shipId];
                
                // Legacy support for older ships
                if (ship.maxEnergy === undefined) ship.maxEnergy = 50;
                if (ship.shieldsActive === undefined) ship.shieldsActive = false;
                if (ship.evadeActive === undefined) ship.evadeActive = false;
                if (ship.jammedCooldown === undefined) ship.jammedCooldown = 0;
                if (ship.chaffActive === undefined) ship.chaffActive = false;
                if (ship.overchargeActive === undefined) ship.overchargeActive = false;
                if (ship.droneActive === undefined) ship.droneActive = false;
                if (ship.hideActive === undefined) ship.hideActive = false;
                if (ship.overclockActive === undefined) ship.overclockActive = false;
                if (ship.fires === undefined) ship.fires = 0;
                if (ship.enemyModifiers === undefined) ship.enemyModifiers = { weaponsDisabled: 0, enginesDisabled: 0, emped: 0 };

                const broadcast = (text, color = '#FFFFFF') => {
                    ship.crew.forEach(memberId => {
                        const ses = this.sessions.find(s => s.playerId === memberId);
                        if (ses) this.send(ses.ws, 'log', { message: text, color: color });
                    });
                };
                
                // Regenerate energy
                if (ship.energy < ship.maxEnergy) {
                    let regen = ship.overclockActive ? 0.6 : 0.2;
                    ship.energy = Math.min(ship.maxEnergy, ship.energy + regen);
                    stateChanged = true;
                }

                // Passive Scrap (Drone)
                if (ship.droneActive && Math.random() < 0.1) {
                    ship.scrap += 1;
                    broadcast(`[DRONE] Recovered 1 unit of scrap.`, '#00FF00');
                    stateChanged = true;
                }

                // Overclocking Risk & Fires
                if (ship.overclockActive && Math.random() < 0.05) {
                    ship.fires += 1;
                    broadcast(`WARNING: OVERCLOCKING HAS STARTED A SECONARY FIRE. (${ship.fires} total)`, '#FF0000');
                    stateChanged = true;
                }
                
                if (ship.fires > 0) {
                    let fireDmg = ship.fires * 2;
                    ship.hull -= fireDmg;
                    if (Math.random() < 0.3) {
                        broadcast(`[FIRE] Passive hull damage taken: ${fireDmg}`, '#FF0000');
                    }
                    stateChanged = true;
                }

                // Tick cooldowns
                for (const room in ship.cooldowns) {
                    if (ship.cooldowns[room] > 0) {
                        ship.cooldowns[room] = Math.max(0, ship.cooldowns[room] - 1);
                        stateChanged = true;
                    }
                }
                
                // Tick enemy modifiers
                if (ship.enemyModifiers.weaponsDisabled > 0) ship.enemyModifiers.weaponsDisabled--;
                if (ship.enemyModifiers.enginesDisabled > 0) ship.enemyModifiers.enginesDisabled--;
                if (ship.enemyModifiers.emped > 0) {
                    ship.enemyModifiers.emped--;
                    if (ship.enemyModifiers.emped === 0) broadcast(`[!] Enemy ship is rebooting...`, '#00FFFF');
                }
                if (ship.jammedCooldown > 0) ship.jammedCooldown--;

                // Enemy combat tick
                if (ship.currentEncounter && ship.currentEncounter.type === 'ship') {
                    // Only attack if not EMPed or Jammed
                    if (ship.enemyModifiers.emped === 0 && ship.jammedCooldown === 0) {
                        if (Math.random() < 0.1) {
                            if (ship.evadeActive && Math.random() < 0.7) {
                                broadcast(`[BRIDGE] EVASIVE MANEUVERS SUCCESSFUL! Incoming fire missed!`, '#00FF00');
                                ship.evadeActive = false; // consume evade
                            } else if (ship.chaffActive) {
                                broadcast(`[WEAPONS] CHAFF DEPLOYED! Incoming missiles deflected!`, '#00FF00');
                                ship.chaffActive = false; // consume chaff
                            } else {
                                let dmg = Math.floor(Math.random() * 10) + 5;
                                if (ship.enemyModifiers.weaponsDisabled > 0) dmg = Math.floor(dmg / 2); // Reduced damage
                                if (ship.shieldsActive) {
                                    dmg = Math.max(0, dmg - 5);
                                    broadcast(`[SHIELDS] Absorbed 5 damage.`, '#00FFFF');
                                    ship.shieldsActive = false; // consume shield
                                }
                                ship.hull -= dmg;
                                broadcast(`[!] ${ship.currentEncounter.name.toUpperCase()} FIRED! Took ${dmg} DMG!`, '#FF0000');
                                
                                // Reset evade if it failed to proc to prevent permanent evade state
                                ship.evadeActive = false;
                            }
                            stateChanged = true;
                        }
                    } else if (ship.jammedCooldown > 0 && Math.random() < 0.1) { // 10% chance per tick to print jammed message if they would've attacked
                         broadcast(`[!] Enemy attempted to fire but targeting systems are JAMMED.`, '#00FFFF');
                    }
                }

                if (ship.hull <= 0) {
                    await this.destroyShip(ship.id);
                    stateChanged = true;
                    continue; // Skip further processing for this destroyed ship
                }

                // Sync Ship
                ship.crew.forEach(mid => {
                    const ses = this.sessions.find(s => s.playerId === mid);
                    if (ses) this.send(ses.ws, 'ship_sync', { hull: ship.hull, fuel: ship.fuel, energy: Math.floor(ship.energy), scrap: ship.scrap, cooldowns: ship.cooldowns });
                });
            }

            // --- GLOBAL NPC TICK LOGIC ---
            if (!this.npcTickCounter) this.npcTickCounter = 0;
            this.npcTickCounter++;
            if (this.npcTickCounter >= 5) { // Process NPCs every 5 seconds so they don't zoom around constantly
                this.npcTickCounter = 0;
                for (const npcId in this.npcs) {
                    const npc = this.npcs[npcId];
                    if (npc.hp <= 0) continue; // Dead NPCs don't do things (will be cleaned up in combat logic)
                    
                    let playersInSector = Object.values(this.ships).filter(s => s.sector === npc.sector);
                    if (npc.cooldown > 0) npc.cooldown--;

                    if (playersInSector.length > 0) {
                        if (npc.behavior === 'aggressive' && npc.cooldown === 0) {
                            // Aggressive NPCs auto-engage a random player ship in the same sector
                            const targetShip = playersInSector[Math.floor(Math.random() * playersInSector.length)];
                            if (!targetShip.currentEncounter || targetShip.currentEncounter.id !== npc.id) {
                                targetShip.currentEncounter = {
                                    id: npc.id,
                                    type: 'ship',
                                    name: npc.name,
                                    hp: npc.hp,
                                    maxHp: npc.maxHp,
                                    isGlobalNPC: true
                                };
                                const broadcast = (text, color = '#FFFFFF') => {
                                    targetShip.crew.forEach(memberId => {
                                        const ses = this.sessions.find(s => s.playerId === memberId);
                                        if (ses) this.send(ses.ws, 'log', { message: text, color: color });
                                    });
                                };
                                broadcast(`\n--- WARNING: PROXIMITY ALERT! ---`, '#FF0000');
                                broadcast(`[!] ${npc.name.toUpperCase()} HAS ENGAGED YOU!`, '#FF0000');
                                npc.cooldown = 1;
                                stateChanged = true;
                            }
                        } else if (npc.behavior === 'flee' && npc.cooldown === 0) {
                            // Fleeing NPCs leave the sector if players are present
                            const links = this.galaxy[npc.sector].links;
                            npc.sector = links[Math.floor(Math.random() * links.length)];
                            npc.cooldown = 2; // Cooldown before moving again
                            stateChanged = true;
                            playersInSector.forEach(ship => {
                                const broadcast = (text, color = '#FFFFFF') => {
                                    ship.crew.forEach(memberId => {
                                        const ses = this.sessions.find(s => s.playerId === memberId);
                                        if (ses) this.send(ses.ws, 'log', { message: text, color: color });
                                    });
                                };
                                broadcast(`[SENSORS] ${npc.name} has fled the sector.`, '#AAAAAA');
                                if (ship.currentEncounter && ship.currentEncounter.id === npc.id) {
                                    ship.currentEncounter = null;
                                }
                            });
                        }
                    } else {
                        // Roaming when no players are around
                        if (Math.random() < 0.2 && npc.cooldown === 0) { // 20% chance to move when alone every 5 seconds
                            const links = this.galaxy[npc.sector].links;
                            npc.sector = links[Math.floor(Math.random() * links.length)];
                            npc.cooldown = 2;
                            stateChanged = true;
                        }
                    }
                }
            }
            
            // --- ENCOUNTER RESPAWN LOOP ---
            if (!this.respawnTickCounter) this.respawnTickCounter = 0;
            this.respawnTickCounter++;
            if (this.respawnTickCounter >= 30) { // Every 30 seconds
                this.respawnTickCounter = 0;
                // Find empty sectors
                const emptySectors = Object.values(this.galaxy).filter(s => !s.encounterType);
                if (emptySectors.length > 0) {
                    // Pick 1 random empty sector to repopulate
                    const targetSector = emptySectors[Math.floor(Math.random() * emptySectors.length)];
                    const encounterRoll = Math.random();
                    if (encounterRoll < 0.25) { 
                        const evTemplate = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
                        targetSector.encounterType = evTemplate.type; 
                        targetSector.encounterData = { id: evTemplate.id }; 
                    } else if (encounterRoll < 0.40) { 
                        targetSector.encounterType = 'asteroid';
                        targetSector.encounterData = { hp: 30, name: 'Asteroid' };
                    } else if (encounterRoll < 0.45) { 
                        targetSector.encounterType = 'ship';
                        targetSector.encounterData = { hp: 50, name: 'Scrap Pirate' };
                    }
                    if (targetSector.encounterType) stateChanged = true;
                }
            }

            if (stateChanged) await this.saveState();
        }, 1000);
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname === "/ws") {
            const id = env.GAME_SERVER.idFromName("global");
            const obj = env.GAME_SERVER.get(id);
            return obj.fetch(request);
        }
        
        // This worker is used with 'assets' in wrangler.toml, so we shouldn't 
        // need to handle static assets here unless we want to.
        return new Response("Not found", { status: 404 });
    }
}
