import { getRandomEvent, SECTOR_FLAVOR, ROOM_DESCRIPTIONS } from './public/events.js';

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
        this.shipCounter = 1;
        this.pendingRequests = {};
        
        // Temporary sessions (clients currently connected)
        this.sessions = [];
        
        // Load state from storage
        this.state.blockConcurrencyWhile(async () => {
            let stored = await this.state.storage.get(["ships", "players", "galaxy", "shipCounter", "pendingRequests"]);
            this.ships = stored.get("ships") || {};
            this.players = stored.get("players") || {};
            this.galaxy = stored.get("galaxy") || {};
            this.shipCounter = stored.get("shipCounter") || 1;
            this.pendingRequests = stored.get("pendingRequests") || {};
            
            if (Object.keys(this.galaxy).length === 0) {
                this.generateGalaxy();
                await this.state.storage.put("galaxy", this.galaxy);
            }
        });
    }

    generateGalaxy() {
        for (let i = 1; i <= NUM_SECTORS; i++) {
            this.galaxy[i] = { id: i, links: [] };
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
        }
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

        const id = crypto.randomUUID();
        const session = { id, ws, playerId: null };
        this.sessions.push(session);

        // Initial connection logic
        const newPlayer = {
            id: id,
            name: `Guest-${Math.floor(Math.random() * 1000)}`,
            state: 'LOBBY',
            room: 'Bridge',
            shipId: null
        };
        this.players[id] = newPlayer;
        session.playerId = id;

        this.send(ws, 'log', { message: `CONNECTION ESTABLISHED. WELCOME TO SPIRAL NEBULA LOBBY.`, color: '#00FF00' });
        this.send(ws, 'log', { message: `Type 'help' to see all available commands.`, color: '#AAAAAA' });
        this.send(ws, 'update_ui', { state: 'LOBBY' });

        ws.addEventListener("message", async (msg) => {
            try {
                const data = JSON.parse(msg.data);
                if (data.type === 'command') {
                    await this.handleCommand(session, data.cmd);
                }
            } catch (err) {
                console.error("WS Message Error:", err);
            }
        });

        ws.addEventListener("close", async () => {
            this.sessions = this.sessions.filter(s => s.id !== id);
            const p = this.players[id];
            if (p && p.shipId) {
                const ship = this.ships[p.shipId];
                if (ship) {
                    ship.crew = ship.crew.filter(cid => cid !== id);
                    this.broadcastToShip(ship.id, { 
                        type: 'log', 
                        data: { message: `[SYS] ${p.name} disconnected.`, color: '#FF0000' } 
                    });
                    if (ship.crew.length === 0) {
                        delete this.ships[ship.id];
                        delete this.pendingRequests[ship.id];
                    }
                }
            }
            delete this.players[id];
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
                crew: [player.id]
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
                this.send(ws, 'log', { message: "ERROR: Provide a ship ID (e.g., 'join TGB-1001').", color: '#FF0000' });
                return;
            }
            const targetId = args[1].toUpperCase();
            const targetShip = this.ships[targetId];
            
            if (!targetShip) {
                this.send(ws, 'log', { message: `ERROR: No ship found with registration ${targetId}.`, color: '#FF0000' });
                return;
            }
            if (targetShip.crew.length >= 4) {
                this.send(ws, 'log', { message: `ERROR: ${targetShip.name} is at maximum crew capacity.`, color: '#FF0000' });
                return;
            }
            
            if (!this.pendingRequests[targetId]) this.pendingRequests[targetId] = [];
            if (!this.pendingRequests[targetId].includes(player.id)) {
                this.pendingRequests[targetId].push(player.id);
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
            const targetId = args[1];
            if (this.pendingRequests[ship.id] && this.pendingRequests[ship.id].includes(targetId)) {
                this.pendingRequests[ship.id] = this.pendingRequests[ship.id].filter(id => id !== targetId);
                const targetPlayer = this.players[targetId];
                if (mainCmd === 'approve' && targetPlayer && ship.crew.length < 4) {
                    targetPlayer.state = 'IN_GAME';
                    targetPlayer.shipId = ship.id;
                    targetPlayer.room = ROOMS['cargo'];
                    ship.crew.push(targetId);
                    const ts = this.sessions.find(s => s.playerId === targetId);
                    if (ts) {
                        this.send(ts.ws, 'update_ui', { state: 'IN_GAME', location: targetPlayer.room, sector: ship.sector });
                        this.send(ts.ws, 'log', { message: `[SYS] Boarding request APPROVED. Welcome to the ${ship.name}.`, color: '#00FF00' });
                        this.send(ts.ws, 'log', { message: ROOM_DESCRIPTIONS[targetPlayer.room], color: '#AAAAAA' });
                    }
                    broadcast(`[SYS] ${targetPlayer.name} has joined the crew.`, '#FFFF00');
                } else if (targetPlayer) {
                    const ts = this.sessions.find(s => s.playerId === targetId);
                    if (ts) this.send(ts.ws, 'log', { message: `[SYS] Boarding request DENIED by ${ship.name}.`, color: '#FF0000' });
                }
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
            const sectorData = this.galaxy[ship.sector];
            this.send(ws, 'log', { message: `--- LONG RANGE SCANNERS ---`, color: '#FFFF00' });
            this.send(ws, 'log', { message: `Current Sector: ${ship.sector}`, color: '#FFFFFF' });
            this.send(ws, 'log', { message: `Linked Jump Points: ${sectorData.links.join(', ')}`, color: '#00FFFF' });
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
                        this.generateEncounter(ship, broadcast);
                        await this.saveState();
                    }
                }, 2000);
            } else {
                this.send(ws, 'log', { message: "ERROR: Invalid jump path or no fuel.", color: '#FF0000' });
            }
        } else if (mainCmd === 'attack') {
            if (player.room !== ROOMS['weapons']) {
                this.send(ws, 'log', { message: "ERROR: WEAPONS MUST BE EXECUTED FROM WEAPONS CNTRL.", color: '#FF0000' });
                return;
            }
            if (ship.cooldowns['Weapons Cntrl'] > 0 || ship.energy < 5) {
                this.send(ws, 'log', { message: "ERROR: Weapons cooling down or low energy.", color: '#FF0000' });
                return;
            }
            if (ship.currentEncounter && (ship.currentEncounter.type === 'ship' || ship.currentEncounter.type === 'asteroid')) {
                ship.energy -= 5;
                ship.cooldowns['Weapons Cntrl'] = 3;
                const dmg = Math.floor(Math.random() * 20) + 10;
                ship.currentEncounter.hp -= dmg;
                broadcast(`[WEAPONS] Hit ${ship.currentEncounter.name || 'Asteroid'} for ${dmg} DMG.`, '#FF00FF');
                if (ship.currentEncounter.hp <= 0) {
                    broadcast(`** TARGET DESTROYED **`, '#00FF00');
                    if (ship.currentEncounter.type === 'ship') {
                        const scrap = Math.floor(Math.random() * 30) + 10;
                        ship.scrap += scrap;
                        broadcast(`Salvaged ${scrap} Scrap.`, '#00FF00');
                    }
                    ship.currentEncounter = null;
                }
            } else {
                this.send(ws, 'log', { message: "ERROR: NO TARGETS.", color: '#FF0000' });
            }
        } else if (mainCmd === 'repair') {
            if (player.room !== ROOMS['engineering']) {
                this.send(ws, 'log', { message: "ERROR: REPAIR MUST BE EXECUTED FROM ENGINEERING.", color: '#FF0000' });
                return;
            }
            if (ship.cooldowns['Engineering'] > 0 || ship.scrap < 5 || ship.hull >= 100) {
                this.send(ws, 'log', { message: "ERROR: Cannot repair now.", color: '#FF0000' });
                return;
            }
            ship.scrap -= 5;
            ship.hull = Math.min(100, ship.hull + 10);
            ship.cooldowns['Engineering'] = 5;
            broadcast(`[ENGINEERING] Hull repaired by ${player.name}.`, '#00FF00');
        } else if (mainCmd === 'mine') {
            if (player.room !== ROOMS['cargo']) {
                this.send(ws, 'log', { message: "ERROR: MINE MUST BE EXECUTED FROM CARGO BAY.", color: '#FF0000' });
                return;
            }
            if (ship.cooldowns['Cargo Bay'] > 0 || ship.energy < 2) {
                this.send(ws, 'log', { message: "ERROR: Mining lasers cooling or low energy.", color: '#FF0000' });
                return;
            }
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
            this.send(ws, 'log', { message: `> 'move <room>', 'jump <sector>', 'scan', 'comm <msg>', 'mine', 'attack', 'repair'`, color: '#FFFFFF' });
            this.send(ws, 'log', { message: `> 'rename <name>', 'rename ship <name>', 'who', 'help'`, color: '#FFFFFF' });
        }
 else {
            this.send(ws, 'log', { message: `Action '${mainCmd}' not recognized.`, color: '#AAAAAA' });
        }
    }

    generateEncounter(ship, broadcast) {
        const roll = Math.random();
        if (roll < 0.3) {
            const ev = getRandomEvent();
            ship.currentEncounter = { ...ev };
            broadcast(`\n--- SENSORS DETECT AN OBJECT ---`, '#FFFF00');
            broadcast(`${ev.title.toUpperCase()} [${ev.type.toUpperCase()}]`, '#00FFFF');
            broadcast(ev.text, '#FFFFFF');
            broadcast("ACTIONS: " + ev.options.map(o => `'${o.command}'`).join(', '), '#AAAAAA');
        } else if (roll < 0.5) {
            ship.currentEncounter = { type: 'asteroid', hp: 30, name: 'Asteroid' };
            broadcast(`--- SENSORS DETECT AN ASTEROID ---`, '#FFFF00');
        } else if (roll < 0.6) {
            ship.currentEncounter = { type: 'ship', hp: 50, name: 'Scrap Pirate' };
            broadcast(`--- PROXIMITY ALERT! ---`, '#FF0000');
        } else {
            ship.currentEncounter = null;
        }
    }

    startTick() {
        if (this.tickInterval) return;
        this.tickInterval = setInterval(async () => {
            let stateChanged = false;
            for (const shipId in this.ships) {
                const ship = this.ships[shipId];
                
                // Regenerate energy
                if (ship.energy < ship.maxEnergy) {
                    ship.energy = Math.min(ship.maxEnergy, ship.energy + 0.2); // Slower regen
                    stateChanged = true;
                }

                // Tick cooldowns
                for (const room in ship.cooldowns) {
                    if (ship.cooldowns[room] > 0) {
                        ship.cooldowns[room] = Math.max(0, ship.cooldowns[room] - 1);
                        stateChanged = true;
                    }
                }

                // Enemy combat tick
                if (ship.currentEncounter && ship.currentEncounter.type === 'ship') {
                    if (Math.random() < 0.1) {
                        const dmg = Math.floor(Math.random() * 10) + 5;
                        ship.hull -= dmg;
                        ship.crew.forEach(mid => {
                            const ses = this.sessions.find(s => s.playerId === mid);
                            if (ses) this.send(ses.ws, 'log', { message: `[!] ${ship.currentEncounter.name.toUpperCase()} FIRED! Took ${dmg} DMG!`, color: '#FF0000' });
                        });
                        stateChanged = true;
                    }
                }

                // Sync Ship
                ship.crew.forEach(mid => {
                    const ses = this.sessions.find(s => s.playerId === mid);
                    if (ses) this.send(ses.ws, 'ship_sync', { hull: ship.hull, fuel: ship.fuel, energy: Math.floor(ship.energy), scrap: ship.scrap, cooldowns: ship.cooldowns });
                });
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
