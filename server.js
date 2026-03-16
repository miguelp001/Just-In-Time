const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const { getRandomEvent, SECTOR_FLAVOR, ROOM_DESCRIPTIONS } = require('./public/events.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Generate Procedural Galaxy
const NUM_SECTORS = 200;
const galaxy = {}; // Holds { id, links: [] }

function generateGalaxy() {
    for (let i = 1; i <= NUM_SECTORS; i++) {
        galaxy[i] = { id: i, links: [] };
    }
    
    // Create random links
    for (let i = 1; i <= NUM_SECTORS; i++) {
        const numLinks = Math.floor(Math.random() * 3) + 2; // 2 to 4 links
        while (galaxy[i].links.length < numLinks) {
            const target = Math.floor(Math.random() * NUM_SECTORS) + 1;
            if (target !== i && !galaxy[i].links.includes(target)) {
                galaxy[i].links.push(target);
                // Ensure bidirectional links
                if (!galaxy[target].links.includes(i)) {
                    galaxy[target].links.push(i);
                }
            }
        }
    }
    console.log(`[+] Generated Procedural Galaxy with ${NUM_SECTORS} sectors.`);
}

generateGalaxy();

// Game State
const players = {};
const ships = {};
const pendingRequests = {}; // Keyed by ship ID, array of player IDs requesting to join
let connectionCount = 0;
let shipCounter = 1;

const ROOMS = {
    'bridge': 'Bridge',
    'weapons': 'Weapons Cntrl',
    'cargo': 'Cargo Bay',
    'engineering': 'Engineering'
};

io.on('connection', (socket) => {
    connectionCount++;
    console.log(`[+] User connected: ${socket.id} (Total: ${connectionCount})`);
    
    // Assign a temporary unique ID
    const newPlayer = {
        id: socket.id,
        name: `Guest-${Math.floor(Math.random() * 1000)}`,
        state: 'LOBBY',
        room: 'Bridge',
        shipId: null
    };
    players[socket.id] = newPlayer;

    // Welcome message to the new client in the lobby
    socket.emit('log', { message: `CONNECTION ESTABLISHED. WELCOME TO SPIRAL NEBULA LOBBY.`, color: '#00FF00' });
    socket.emit('log', { message: `Type 'help' to see all available commands.`, color: '#AAAAAA' });
    socket.emit('update_ui', { state: 'LOBBY' });
    
    // Listen for commands
    socket.on('command', (cmd) => {
        const player = players[socket.id];
        console.log(`Command from ${player.name}: ${cmd}`);
        
        const args = cmd.trim().split(' ');
        const mainCmd = args[0].toLowerCase();

        // --- LOBBY COMMANDS ---
        if (player.state === 'LOBBY') {
            if (mainCmd === 'create') {
                if (args.length < 2) {
                    socket.emit('log', { message: "ERROR: Provide a ship name (e.g., 'create Vanguard').", color: '#FF0000' });
                    return;
                }
                const shipName = args.slice(1).join(' ').toUpperCase();
                const newShipId = `TGB-${1000 + shipCounter++}`;
                
                ships[newShipId] = {
                    id: newShipId,
                    name: shipName,
                    sector: 1,
                    fuel: 80,
                    energy: 50,
                    maxEnergy: 50,
                    hull: 100,
                    scrap: 15,
                    currentEncounter: null,
                    cooldowns: {
                        'Bridge': 0,
                        'Weapons Cntrl': 0,
                        'Cargo Bay': 0,
                        'Engineering': 0
                    },
                    crew: [socket.id]
                };
                
                player.state = 'IN_GAME';
                player.shipId = newShipId;
                player.room = ROOMS['bridge'];
                
                socket.emit('log', { message: `[SYS] Commissioned ${shipName} (${newShipId}). You are the Captain.`, color: '#00FF00' });
                socket.emit('update_ui', { state: 'IN_GAME', location: player.room, sector: ships[newShipId].sector });
                socket.emit('log', { message: ROOM_DESCRIPTIONS[player.room], color: '#AAAAAA' });
            }
            else if (mainCmd === 'ships') {
                const activeShips = Object.values(ships);
                if (activeShips.length === 0) {
                    socket.emit('log', { message: `No active ships in the sector.`, color: '#AAAAAA' });
                } else {
                    socket.emit('log', { message: `--- ACTIVE VESSELS ---`, color: '#FFFF00' });
                    activeShips.forEach(s => {
                        socket.emit('log', { message: `[${s.id}] ${s.name} - Crew: ${s.crew.length}/4`, color: '#FFFFFF' });
                    });
                }
            }
            else if (mainCmd === 'join') {
                if (args.length < 2) {
                    socket.emit('log', { message: "ERROR: Provide a ship ID (e.g., 'join TGB-1001').", color: '#FF0000' });
                    return;
                }
                const targetId = args[1].toUpperCase();
                const targetShip = ships[targetId];
                
                if (!targetShip) {
                    socket.emit('log', { message: `ERROR: No ship found with registration ${targetId}.`, color: '#FF0000' });
                    return;
                }
                if (targetShip.crew.length >= 4) {
                    socket.emit('log', { message: `ERROR: ${targetShip.name} is at maximum crew capacity.`, color: '#FF0000' });
                    return;
                }
                
                // Add to pending requests
                if (!pendingRequests[targetId]) pendingRequests[targetId] = [];
                if (!pendingRequests[targetId].includes(socket.id)) {
                    pendingRequests[targetId].push(socket.id);
                }
                
                socket.emit('log', { message: `[SYS] Boarding request sent to ${targetShip.name}. Awaiting approval...`, color: '#FFFF00' });
                
                // Notify the crew
                targetShip.crew.forEach(memberId => {
                    io.to(memberId).emit('log', { message: `[!] BOARDING REQUEST FROM ${player.name} (${socket.id}). Type 'approve ${socket.id}' or 'deny ${socket.id}'.`, color: '#FF00FF' });
                });
            }
            else if (mainCmd === 'who') {
                const totalPlayers = Object.values(players).length;
                socket.emit('log', { message: `--- CONNECTED PILOTS [${totalPlayers}] ---`, color: '#FFFF00' });
                Object.values(players).forEach(p => {
                    const status = p.state === 'LOBBY' ? 'LOBBY' : `STEWARDING ${p.shipId}`;
                    socket.emit('log', { message: `[${p.id.slice(0, 4)}] ${p.name} - STATUS: ${status}`, color: '#FFFFFF' });
                });
            }
            else if (mainCmd === 'help') {
                socket.emit('log', { message: `--- LOBBY COMMANDS ---`, color: '#FFFF00' });
                socket.emit('log', { message: `> 'ships': List all active vessels in the nebula.`, color: '#FFFFFF' });
                socket.emit('log', { message: `> 'create <name>': Commission a new ship and become its Captain.`, color: '#FFFFFF' });
                socket.emit('log', { message: `> 'join <id>': Request to join the crew of an existing ship.`, color: '#FFFFFF' });
                socket.emit('log', { message: `> 'who': See a list of all connected players.`, color: '#FFFFFF' });
                socket.emit('log', { message: `> 'say <msg>': Broadcast a message to everyone in the lobby.`, color: '#FFFFFF' });
                socket.emit('log', { message: `> 'help': Show this message.`, color: '#FFFFFF' });
            }
            else if (mainCmd === 'say') {
                const msgText = args.slice(1).join(' ').replace(/^['"](.*)['"]$/, '$1');
                if (!msgText) {
                    socket.emit('log', { message: "ERROR: say requires a message.", color: '#FF0000' });
                    return;
                }
                // Broadcast to everyone in LOBBY state
                Object.values(players).forEach(p => {
                    if (p.state === 'LOBBY') {
                        io.to(p.id).emit('chat', { 
                            sender: player.name, 
                            ship: 'LOBBY',
                            text: msgText,
                            color: '#00FFFF'
                        });
                    }
                });
            }
            else {
                socket.emit('log', { message: `ERROR: Invalid lobby command. Try 'ships', 'create <name>', 'join <id>', 'who', or 'help'.`, color: '#FF0000' });
            }
            return; // Stop processing if in lobby
        }

        // --- IN-GAME COMMANDS ---
        
        // Helper to broadcast to my ship's crew
        const broadcast = (text, color = '#FFFFFF') => {
            const ship = ships[player.shipId];
            if (ship) {
                ship.crew.forEach(memberId => {
                    io.to(memberId).emit('log', { message: text, color: color });
                });
            }
        };

        const currentShip = ships[player.shipId];

        // Intercept Event Option Commands
        if (currentShip && currentShip.currentEncounter && ['anomaly', 'derelict', 'hazard', 'distress', 'faction'].includes(currentShip.currentEncounter.type)) {
            const ev = currentShip.currentEncounter;
            const eventOpt = ev.options.find(o => o.command === mainCmd);
            
            // Allow talking and moving during an event
            if (mainCmd !== 'move' && mainCmd !== 'comm' && mainCmd !== 'ships' && mainCmd !== 'help') {
                if (eventOpt) {
                    if (eventOpt.requiredRoom && !player.room.toLowerCase().includes(eventOpt.requiredRoom.toLowerCase())) {
                        socket.emit('log', { message: `ERROR: '${mainCmd}' MUST BE EXECUTED FROM ${ROOMS[eventOpt.requiredRoom] || eventOpt.requiredRoom.toUpperCase()}.`, color: '#FF0000' });
                        return;
                    }
                    eventOpt.execute(currentShip, player, broadcast);
                    return;
                } else {
                    socket.emit('log', { message: `ERROR: Invalid action during event. Choose a valid option, 'move', or 'comm'.`, color: '#FF0000' });
                    return;
                }
            }
        }

        if (mainCmd === 'say') {
            let isLobbyShout = args[1]?.toLowerCase() === 'lobby';
            let msgText = isLobbyShout ? args.slice(2).join(' ') : args.slice(1).join(' ');
            msgText = msgText.replace(/^['"](.*)['"]$/, '$1');

            if (!msgText) {
                socket.emit('log', { message: 'ERROR: say requires a message.', color: '#FF0000' });
                return;
            }

            if (isLobbyShout) {
                // Broadcast to everyone in LOBBY state
                Object.values(players).forEach(p => {
                    if (p.state === 'LOBBY') {
                        io.to(p.id).emit('chat', { 
                            sender: player.name, 
                            ship: currentShip.id,
                            text: `[LOBBY SHOUT] ${msgText}`,
                            color: '#FF00FF'
                        });
                    }
                });
                socket.emit('log', { message: `[SYS] Message broadcast to lobby.`, color: '#AAAAAA' });
            } else {
                // Broadcast to ship crew
                currentShip.crew.forEach(memberId => {
                    io.to(memberId).emit('chat', { 
                        sender: player.name, 
                        ship: currentShip.id,
                        text: msgText,
                        color: '#00FFFF'
                    });
                });
            }
        }
        else if (mainCmd === 'comm') {
            // Build the message by joining arguments
            const baseStr = args.slice(1).join(' ');
            
            // Allow quoting for multi-word comms: comm "hello there"
            let msgText = baseStr;
            const quoteMatch = baseStr.match(/^['"](.*)['"]$/);
            if (quoteMatch) {
                msgText = quoteMatch[1];
            }

            if (!msgText || msgText.trim() === '') {
                socket.emit('log', { message: 'ERROR: comm requires a message.', color: '#FF0000' });
                return;
            }

            // Broadcast to EVERYONE in the same sector
            const myShip = ships[player.shipId];
            if (myShip) {
                // Find all players whose ship is in the same sector
                Object.values(players).forEach(p => {
                    const targetShip = ships[p.shipId];
                    if (targetShip && targetShip.sector === myShip.sector) {
                        io.to(p.id).emit('chat', { 
                            sender: player.name, 
                            ship: myShip.id,
                            text: msgText,
                            color: '#00FFFF'
                        });
                    }
                });
            }
        }
        else if (mainCmd === 'approve' || mainCmd === 'deny') {
            if (args.length < 2) {
                socket.emit('log', { message: `ERROR: Provide the player ID.`, color: '#FF0000' });
                return;
            }
            const targetSocketId = args[1];
            const myShip = ships[player.shipId];
            
            if (pendingRequests[myShip.id] && pendingRequests[myShip.id].includes(targetSocketId)) {
                // Remove from pending
                pendingRequests[myShip.id] = pendingRequests[myShip.id].filter(id => id !== targetSocketId);
                
                const targetPlayer = players[targetSocketId];
                if (!targetPlayer) return; // Player disconnected before approval

                if (mainCmd === 'approve') {
                    if (myShip.crew.length >= 4) {
                        socket.emit('log', { message: `ERROR: Crew capacity full.`, color: '#FF0000' });
                        return;
                    }
                    
                    targetPlayer.state = 'IN_GAME';
                    targetPlayer.shipId = myShip.id;
                    targetPlayer.room = ROOMS['cargo']; // Spawn new players in the cargo bay
                    myShip.crew.push(targetSocketId);
                    
                    io.to(targetSocketId).emit('update_ui', { state: 'IN_GAME', location: targetPlayer.room, sector: myShip.sector });
                    io.to(targetSocketId).emit('log', { message: `[SYS] Boarding request APPROVED. Welcome aboard the ${myShip.name}.`, color: '#00FF00' });
                    io.to(targetSocketId).emit('log', { message: ROOM_DESCRIPTIONS[targetPlayer.room], color: '#AAAAAA' });
                    
                    myShip.crew.forEach(memberId => {
                        io.to(memberId).emit('log', { message: `[SYS] ${targetPlayer.name} has joined the crew.`, color: '#FFFF00' });
                    });
                } else {
                    // Deny
                    io.to(targetSocketId).emit('log', { message: `[SYS] Boarding request DENIED by ${myShip.name}.`, color: '#FF0000' });
                    myShip.crew.forEach(memberId => {
                        io.to(memberId).emit('log', { message: `[SYS] Boarding request from ${targetPlayer.name} denied.`, color: '#AAAAAA' });
                    });
                }
            } else {
                socket.emit('log', { message: `ERROR: No pending request from ${targetSocketId}.`, color: '#FF0000' });
            }
        }
        else if (mainCmd === 'move') {
            if (args.length < 2) {
                socket.emit('log', { message: "ERROR: Provide a destination (e.g., 'move weapons').", color: '#FF0000' });
                return;
            }
            const dest = args[1].toLowerCase();
            if (ROOMS[dest]) {
                player.room = ROOMS[dest];
                socket.emit('update_ui', { location: player.room });
                socket.emit('log', { message: `Moved to ${player.room}.`, color: '#00FFFF' });
                socket.emit('log', { message: ROOM_DESCRIPTIONS[player.room], color: '#AAAAAA' });
                
                // Notify rest of crew
                const myShip = ships[player.shipId];
                myShip.crew.forEach(memberId => {
                    if (memberId !== socket.id) {
                        io.to(memberId).emit('log', { message: `[CREW] ${player.name} moved to ${player.room}.`, color: '#AAAAAA' });
                    }
                });

            } else {
                socket.emit('log', { message: `ERROR: Unknown room '${dest}'. Valid rooms: bridge, weapons, cargo, engineering.`, color: '#FF0000' });
            }
        }
        else if (mainCmd === 'scan') {
            const ship = ships[player.shipId];
            if (ship) {
                const sectorData = galaxy[ship.sector];
                socket.emit('log', { message: `--- LONG RANGE SCANNERS ---`, color: '#FFFF00' });
                socket.emit('log', { message: `Current Sector: ${ship.sector}`, color: '#FFFFFF' });
                socket.emit('log', { message: `Linked Jump Points: ${sectorData.links.join(', ')}`, color: '#00FFFF' });
            }
        }
        else if (mainCmd === 'jump') {
            if (player.room !== ROOMS['bridge']) {
                socket.emit('log', { message: "ERROR: JUMP COMMAND MUST BE EXECUTED FROM THE BRIDGE.", color: '#FF0000' });
                return;
            }
            if (args.length < 2) {
                socket.emit('log', { message: "ERROR: Provide a destination sector (e.g., 'jump 14').", color: '#FF0000' });
                return;
            }
            const destSector = parseInt(args[1]);
            const ship = ships[player.shipId];
            
            if (ship) {
                if (ship.cooldowns['Bridge'] > 0) {
                    socket.emit('log', { message: `ERROR: BRIDGE CONTROLS ON COOLDOWN (${ship.cooldowns['Bridge']}s).`, color: '#FF0000' });
                    return;
                }
                const currentSectorData = galaxy[ship.sector];
                if (!currentSectorData.links.includes(destSector)) {
                    socket.emit('log', { message: `ERROR: Sector ${destSector} is not linked to current position.`, color: '#FF0000' });
                    return;
                }
                
                if (ship.fuel < 10) {
                    socket.emit('log', { message: `ERROR: INSUFFICIENT FUEL FOR JUMP.`, color: '#FF0000' });
                    return;
                }
                
                // Execute Jump
                ship.fuel -= 10;
                ship.cooldowns['Bridge'] = 5; // 5 second jump cooldown
                
                // Notify crew they are jumping
                ship.crew.forEach(memberId => {
                    io.to(memberId).emit('log', { message: `SPOOLING FSD DRIVE...`, color: '#00FFFF' });
                });
                
                setTimeout(() => {
                    if (ships[ship.id]) { // Ensure ship still exists
                        ship.sector = destSector;
                        ship.crew.forEach(memberId => {
                            io.to(memberId).emit('update_ui', { sector: ship.sector });
                            io.to(memberId).emit('log', { message: `JUMP SUCCESSFUL. Arrived in Sector ${destSector}.`, color: '#00FF00' });
                            const flavor = SECTOR_FLAVOR[Math.floor(Math.random() * SECTOR_FLAVOR.length)];
                            io.to(memberId).emit('log', { message: flavor, color: '#AAAAAA' });
                        });
                        
                        // Generate Encounter
                        generateEncounter(ship, broadcast);
                    }
                }, 2000); // 2 second spool up
            }
        }
        else if (mainCmd === 'attack') {
            if (player.room !== ROOMS['weapons']) {
                socket.emit('log', { message: "ERROR: WEAPONS COMMAND MUST BE EXECUTED FROM WEAPONS CNTRL.", color: '#FF0000' });
                return;
            }
            const ship = ships[player.shipId];
            if (ship) {
                if (ship.cooldowns['Weapons Cntrl'] > 0) {
                    socket.emit('log', { message: `ERROR: WEAPONS ON COOLDOWN (${ship.cooldowns['Weapons Cntrl']}s).`, color: '#FF0000' });
                    return;
                }
                if (ship.energy < 5) {
                    socket.emit('log', { message: `ERROR: INSUFFICIENT ENERGY FOR WEAPONS.`, color: '#FF0000' });
                    return;
                }
                
                if (ship.currentEncounter && ship.currentEncounter.type === 'ship') {
                    ship.energy -= 5;
                    ship.cooldowns['Weapons Cntrl'] = 3;
                    
                    const dmg = Math.floor(Math.random() * 20) + 10;
                    ship.currentEncounter.hp -= dmg;
                    broadcast(`[WEAPONS] Lasers fired by ${player.name}! Hit ${ship.currentEncounter.name} for ${dmg} DMG.`, '#FF00FF');
                    
                    if (ship.currentEncounter.hp <= 0) {
                        broadcast(`[WEAPONS] ** TARGET DESTROYED **`, '#00FF00');
                        ship.currentEncounter = null;
                        
                        const scrapGained = Math.floor(Math.random() * 30) + 10;
                        ship.scrap += scrapGained;
                        broadcast(`[SYS] Salvaged ${scrapGained} Scrap from the wreckage.`, '#00FF00');
                    }
                } else if (ship.currentEncounter && ship.currentEncounter.type === 'asteroid') {
                    broadcast(`[WEAPONS] Fired upon the asteroid. It shatters uselessly into dust.`, '#AAAAAA');
                    ship.energy -= 5;
                    ship.cooldowns['Weapons Cntrl'] = 3;
                    ship.currentEncounter = null;
                } else {
                     socket.emit('log', { message: `ERROR: NO VALID TARGETS IN RANGE.`, color: '#FF0000' });
                }
            }
        }
        else if (mainCmd === 'repair') {
            if (player.room !== ROOMS['engineering']) {
                socket.emit('log', { message: "ERROR: REPAIR COMMAND MUST BE EXECUTED FROM ENGINEERING.", color: '#FF0000' });
                return;
            }
            const ship = ships[player.shipId];
            if (ship) {
                if (ship.cooldowns['Engineering'] > 0) {
                    socket.emit('log', { message: `ERROR: ENGINEERING TOOLS ON COOLDOWN (${ship.cooldowns['Engineering']}s).`, color: '#FF0000' });
                    return;
                }
                if (ship.scrap < 5) {
                    socket.emit('log', { message: `ERROR: INSUFFICIENT SCRAP (Requires 5).`, color: '#FF0000' });
                    return;
                }
                if (ship.hull >= 100) {
                    socket.emit('log', { message: `ERROR: HULL IS ALREADY AT MAXIMUM.`, color: '#FF0000' });
                    return;
                }
                
                ship.scrap -= 5;
                ship.hull = Math.min(100, ship.hull + 10);
                ship.cooldowns['Engineering'] = 5; // 5 second real-time cooldown

                ship.crew.forEach(memberId => {
                    io.to(memberId).emit('log', { message: `[ENGINEERING] Hull repaired by ${player.name}.`, color: '#00FF00' });
                });
            }
        }
        else if (mainCmd === 'mine') {
            if (player.room !== ROOMS['cargo']) {
                socket.emit('log', { message: "ERROR: MINE COMMAND MUST BE EXECUTED FROM CARGO BAY.", color: '#FF0000' });
                return;
            }
            const ship = ships[player.shipId];
            if (ship) {
                if (ship.cooldowns['Cargo Bay'] > 0) {
                    socket.emit('log', { message: `ERROR: MINING LASERS ON COOLDOWN (${ship.cooldowns['Cargo Bay']}s).`, color: '#FF0000' });
                    return;
                }
                if (ship.energy < 2) {
                    socket.emit('log', { message: `ERROR: INSUFFICIENT ENERGY FOR MINING LASERS.`, color: '#FF0000' });
                    return;
                }
                
                if (ship.currentEncounter && ship.currentEncounter.type === 'asteroid') {
                    ship.energy -= 2;
                    ship.cooldowns['Cargo Bay'] = 3;
                    const yieldAmt = Math.floor(Math.random() * 5) + 2;
                    ship.scrap += yieldAmt;
                    ship.currentEncounter.hp -= 10;
                    
                    broadcast(`[CARGO] ${player.name} activated mining lasers. Extracted ${yieldAmt} Scrap.`, '#00FF00');
                    
                    if (ship.currentEncounter.hp <= 0) {
                        broadcast(`[SYS] ASTEROID DEPLETED.`, '#AAAAAA');
                        ship.currentEncounter = null;
                    }
                } else {
                    socket.emit('log', { message: `ERROR: NO MINEABLE ASTEROID IN RANGE.`, color: '#FF0000' });
                }
            }
        }
        else if (mainCmd === 'who') {
            const totalPlayers = Object.values(players).length;
            socket.emit('log', { message: `--- CONNECTED PILOTS [${totalPlayers}] ---`, color: '#FFFF00' });
            Object.values(players).forEach(p => {
                const status = (p.shipId === player.shipId) ? 'CREWMATE' : (p.state === 'LOBBY' ? 'LOBBY' : `ABOARD ${p.shipId}`);
                socket.emit('log', { message: `[${p.id.slice(0, 4)}] ${p.name} - STATUS: ${status}`, color: '#FFFFFF' });
            });
        }
        else if (mainCmd === 'help') {
            socket.emit('log', { message: `--- COMMAND PROTOCOLS ---`, color: '#FFFF00' });
            socket.emit('log', { message: `> 'move <room>': Transfer to Bridge, Weapons, Cargo, or Engineering.`, color: '#FFFFFF' });
            socket.emit('log', { message: `> 'jump <sector>': Plot a FSD jump to a linked sector. [BRIDGE ONLY]`, color: '#FFFFFF' });
            socket.emit('log', { message: `> 'scan': View local sector map and connected jump points.`, color: '#FFFFFF' });
            socket.emit('log', { message: `> 'comm <msg>': Broadcast a message to all ships in the current sector.`, color: '#FFFFFF' });
            socket.emit('log', { message: `> 'say <msg>': Send a message to your entire crew.`, color: '#FFFFFF' });
            socket.emit('log', { message: `> 'say lobby <msg>': Shout a message to the central nebula lobby.`, color: '#FFFFFF' });
            socket.emit('log', { message: `> 'mine': Harvest resources from local asteroids. [CARGO BAY ONLY]`, color: '#FFFFFF' });
            socket.emit('log', { message: `> 'attack': Engage targets with ship weapon systems. [WEAPONS ONLY]`, color: '#FFFFFF' });
            socket.emit('log', { message: `> 'repair': Use 5 Scrap to restore 10 Hull integrity. [ENGINEERING ONLY]`, color: '#FFFFFF' });
            socket.emit('log', { message: `> 'who': Display manifest of all active pilots.`, color: '#FFFFFF' });
            socket.emit('log', { message: `> 'help': Display this operational guide.`, color: '#FFFFFF' });
        }
        else {
            // Unrecognized/Unimplemented Server Command
            socket.emit('log', { message: `[SERVER] Action '${mainCmd}' not recognized. Type 'help' for available commands.`, color: '#AAAAAA' });
        }
    });

    socket.on('disconnect', () => {
        connectionCount--;
        console.log(`[-] User disconnected: ${socket.id} (Total: ${connectionCount})`);
        
        // Remove from ship if in game
        const p = players[socket.id];
        if (p && p.shipId) {
            const ship = ships[p.shipId];
            if (ship) {
                ship.crew = ship.crew.filter(id => id !== socket.id);
                // Notify remaining crew
                ship.crew.forEach(memberId => {
                    io.to(memberId).emit('log', { message: `[SYS] ${p.name} disconnected.`, color: '#FF0000' });
                });
                
                // If ship is empty, destroy it
                if (ship.crew.length === 0) {
                    console.log(`Destroying empty ship: ${ship.id}`);
                    delete ships[ship.id];
                    delete pendingRequests[ship.id];
                }
            }
        }
        delete players[socket.id];
    });
});

// --- SERVER TICK LOOP ---
let tickCounter = 0;
setInterval(() => {
    tickCounter++;
    Object.values(ships).forEach(ship => {
        let needsSync = false;

        // Passive Energy Regeneration (every 5 seconds)
        if (tickCounter % 5 === 0 && ship.energy < ship.maxEnergy) {
            ship.energy = Math.min(ship.maxEnergy, ship.energy + 1);
            needsSync = true;
        }

        // Cooldown Decrement (1 second per tick)
        Object.keys(ship.cooldowns).forEach(room => {
            if (ship.cooldowns[room] > 0) {
                ship.cooldowns[room] -= 1;
                needsSync = true; // Sync UI continuously while cooldowns are active
            }
        });

        // Always broadcast ship sync to all crew members so their UI is perfectly updated
        ship.crew.forEach(memberId => {
            io.to(memberId).emit('ship_sync', {
                hull: ship.hull,
                fuel: ship.fuel,
                energy: ship.energy,
                scrap: ship.scrap,
                cooldowns: ship.cooldowns
            });
        });
        
        // Hostile Ship Combat Tick (Enemy AI)
        if (tickCounter % 3 === 0 && ship.currentEncounter && ship.currentEncounter.type === 'ship' && Object.keys(players).some(p => players[p].shipId === ship.id && players[p].state === 'IN_GAME')) {
             if (Math.random() > 0.3) {
                 const enemyDmg = Math.floor(Math.random() * 10) + 5;
                 ship.hull -= enemyDmg;
                 ship.crew.forEach(memberId => {
                     io.to(memberId).emit('log', { message: `[!] ${ship.currentEncounter.name.toUpperCase()} FIRED ON US! Took ${enemyDmg} DMG!`, color: '#FF0000' });
                 });
             }
        }
    });
}, 1000);

// --- ENCOUNTER GENERATION ---
function generateEncounter(ship, broadcast) {
    const roll = Math.random();
    
    // 30% Narrative Event
    if (roll < 0.3) {
        const ev = getRandomEvent();
        // Shallow copy the event, but keep options intact
        ship.currentEncounter = { ...ev };
        
        broadcast(`\n--- SENSORS DETECT AN OBJECT ---`, '#FFFF00');
        broadcast(`${ev.title.toUpperCase()} [${ev.type.toUpperCase()}]`, '#00FFFF');
        broadcast(ev.text, '#FFFFFF');
        broadcast("AVAILABLE ACTIONS:", '#AAAAAA');
        
        ev.options.forEach(opt => {
            const req = opt.requiredRoom ? ` (${ROOMS[opt.requiredRoom]})` : "";
            broadcast(`> '${opt.command}': ${opt.description}${req}`, '#FFFFFF');
        });
    } 
    // 20% Asteroid
    else if (roll < 0.5) {
        ship.currentEncounter = { type: 'asteroid', hp: 30 };
        broadcast(`--- SENSORS DETECT AN ASTEROID ---`, '#FFFF00');
        broadcast(`Rich mineral deposits detected. Proceed to Cargo Bay to 'mine'.`, '#AAAAAA');
    }
    // 10% Hostile Ship
    else if (roll < 0.6) {
        ship.currentEncounter = { type: 'ship', hp: 50, name: 'Scrap Pirate' };
        broadcast(`--- PROXIMITY ALERT! ---`, '#FF0000');
        broadcast(`Hostile Scrap Pirate detected! Proceed to Weapons Cntrl to 'attack' or Bridge to 'jump'!`, '#FF0000');
    }
    // 40% empty space
    else {
        ship.currentEncounter = null;
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Tugboat MMO] Server listening on *:${PORT}`);
});
