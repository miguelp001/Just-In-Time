// Shared constants provided by events.js
// COLORS, SYMBOLS

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.socket = null;
    }

    preload() {
        // No assets to load in a pure text game!
    }

    create() {
        console.log("Phaser: create() starting...");
        // Get game dimensions
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Base text configuration
        this.baseTextConfig = {
            fontFamily: 'Courier New, monospace',
            fontSize: '18px',
            color: COLORS.WHITE,
            align: 'left'
        };

        // --- Game State ---
        this.gameState = {
            hull: { current: 100, max: 100 },
            fuel: { current: 80, max: 100 },
            energy: { current: 50, max: 50 },
            scrap: 15,
            credits: 200,
            location: 'Bridge',
            
            // Encounter State
            currentEncounter: null, // e.g., { type: 'asteroid', hp: 50 } or { type: 'ship', faction: 'miners', hp: 80, name: 'Pirate Drone' }
            currentEvent: null, // Holds the active event data from events.js
            inCombat: false,
            isGameOver: false,
            
            // Factions (Reputation: -100 to 100. < -20 is hostile, > 20 is friendly)
            factions: {
                pirates: -50,   // Scrap Pirates (always hostile by default)
                miners: 0,      // Free Miners
                corps: 10       // Corporate Sec
            }
        };

        this.ROOM_NAMES = {
            'bridge': 'Bridge',
            'weapons': 'Weapons Cntrl',
            'cargo': 'Cargo Bay',
            'engineering': 'Engineering'
        };

        // --- Scaffold UI Layout ---
        
        // Header
        this.headerText = this.add.text(20, 20, "", { ...this.baseTextConfig, color: COLORS.GREEN, fontStyle: 'bold' });
        this.updateHeader();
        this.add.line(0, 0, 20, 50, width - 20, 50, 0x00FF00).setOrigin(0,0);

        // Sidebar (Right)
        const sidebarX = width * 0.75;
        this.add.line(0, 0, sidebarX, 50, sidebarX, height - 60, 0x00FF00).setOrigin(0,0);
        
        this.sidebarTitle = this.add.text(sidebarX + 20, 60, "> CURRENT LOCATION:", { ...this.baseTextConfig, color: COLORS.CYAN });
        this.sidebarLocation = this.add.text(sidebarX + 20, 90, "[B] Bridge", this.baseTextConfig);
        
        this.sidebarSensorsTitle = this.add.text(sidebarX + 20, 140, "> SCANNERS:", { ...this.baseTextConfig, color: COLORS.CYAN });
        this.sidebarSensors = this.add.text(sidebarX + 20, 170, 
            `${SYMBOLS.ASTEROID} Rich Ore Vein\n${SYMBOLS.UNKNOWN} Weak Signal\n\n\n${SYMBOLS.ALERT} PROXIMITY ALERT!`, 
            { ...this.baseTextConfig, color: COLORS.YELLOW }
        );

        // Main View (Left/Center)
        this.mainLogTitle = this.add.text(20, 60, "SYS_LOG_SEC_9:", { ...this.baseTextConfig, color: COLORS.GRAY });
        
        this.logLines = []; // Array to store Text objects
        
        // Initial Logs
        this.logMessage("Boot sequence complete.", COLORS.WHITE);
        this.logMessage("Establishing connection to navigation buoys...", COLORS.WHITE);
        this.logMessage("Connection failed. Spiral Nebula interference detected.", COLORS.RED);
        this.logMessage("Captain, we are currently adrift in an uncharted sector.", COLORS.WHITE);
        this.logMessage("Sensors detect a faint distress signal nearby, as well as several mineral deposits.", COLORS.YELLOW);
        this.logMessage("TACTICAL SYSTEM: Turn-based mode active. Time only advances when you issue a command.", COLORS.CYAN);
        this.logMessage("Awaiting orders. Type 'help' for commands.", COLORS.WHITE);

        // Footer (Command Prompt)
        this.add.line(0, 0, 20, height - 60, width - 20, height - 60, 0x00FF00).setOrigin(0,0);
        this.promptText = this.add.text(20, height - 40, "C:\\TUGBOAT\\CMD >_ ", { ...this.baseTextConfig, color: COLORS.GREEN, fontStyle: 'bold' });
        
        // --- Input Handling ---
        this.currentInput = "";
        
        this.input.keyboard.on('keydown', (event) => {
            // Prevent default browser actions for space and backspace
            if (event.keyCode === 32 || event.keyCode === 8) {
                event.preventDefault();
            }

            if (event.keyCode === 8 && this.currentInput.length > 0) {
                // Backspace
                this.currentInput = this.currentInput.slice(0, -1);
            } else if (event.keyCode === 32 || (event.keyCode >= 48 && event.keyCode <= 90)) {
                // Alphanumeric + Space
                this.currentInput += event.key.toLowerCase();
            } else if (event.keyCode === 13) {
                // Enter
                if (this.currentInput.trim().length > 0) {
                    if (!this.gameState.isGameOver) {
                        this.processCommand(this.currentInput);
                    }
                    this.currentInput = "";
                }
            }
            if (!this.gameState.isGameOver) {
                 this.updatePrompt();
            }
        });

        // --- Apply CRT Shader ---
        this.cameras.main.setPostPipeline(CustomPipeline);

        // --- Network Connection ---
        this.connectToServer();
    }

    connectToServer() {
        if (typeof io !== 'undefined') {
            this.socket = io();
        } else {
            console.error("socket.io not found! Is the server running and can it serve /socket.io/socket.io.js?");
            this.logMessage("CRITICAL ERROR: Uplink module (socket.io) not found.", COLORS.RED);
            return;
        }

        this.socket.on('log', (data) => {
            this.logMessage(`[SYS] ${data.message}`, data.color || COLORS.WHITE);
        });

        this.socket.on('chat', (data) => {
            this.logMessage(`[COMM - ${data.ship}] ${data.sender}: "${data.text}"`, data.color || COLORS.CYAN);
        });

        this.socket.on('update_ui', (data) => {
            if (data.state) {
                this.gameState.networkState = data.state;
                if (data.state === 'LOBBY') {
                    this.headerText.setText("[ LOBBY ]");
                    this.sidebarLocation.setText("");
                }
            }
            if (data.location) {
                this.gameState.location = data.location;
                // Preserve the [L] tag styling
                const shortTag = data.location.charAt(0).toUpperCase();
                this.sidebarLocation.setText(`[${shortTag}] ${data.location}`);
            }
            if (data.sector !== undefined) {
                // Update header or sidebar with sector info
                this.gameState.sector = data.sector;
                if (this.gameState.networkState === 'IN_GAME') {
                    this.updateHeader();
                }
            }
        });

        this.socket.on('ship_sync', (data) => {
            if (this.gameState.networkState === 'IN_GAME') {
                this.gameState.hull = data.hull;
                this.gameState.fuel = data.fuel;
                this.gameState.energy = data.energy;
                this.gameState.scrap = data.scrap;
                this.gameState.cooldowns = data.cooldowns;
                this.updateHeader();
            }
        });

        // Disable standard game events/generation locally (Server handles this now)
        this.socket.on('connect', () => {
             this.logMessage(`Uplink secured. Ready.`, COLORS.GREEN);
        });
    }

    updateHeader() {
        if (this.gameState.networkState === 'LOBBY') return;

        const g = this.gameState;
        let cooldownsStr = '';
        if (g.cooldowns) {
            for (const [room, time] of Object.entries(g.cooldowns)) {
                if (time > 0) {
                    cooldownsStr += ` | [! ${room.toUpperCase()} CD: ${time}s]`;
                }
            }
        }

        this.headerText.setText(
            `${SYMBOLS.HULL} Hull: ${g.hull || 0}/100 | ` +
            `${SYMBOLS.FUEL} Fuel: ${g.fuel || 0}/100 | ` +
            `${SYMBOLS.ENERGY} Energy: ${g.energy || 0}/50 | ` +
            `${SYMBOLS.SCRAP} Scrap: ${g.scrap || 0} | ` +
            `[ SECTOR: ${g.sector || 'UNKNOWN'} ]${cooldownsStr}`
        );
    }

    updatePrompt() {
        this.promptText.setText(`C:\\TUGBOAT\\CMD >_ ${this.currentInput}`);
    }

    alignLog() {
        let currentY = this.cameras.main.height - 80;
        // Start from newest command, push them up
        for (let i = this.logLines.length - 1; i >= 0; i--) {
            this.logLines[i].setY(currentY - this.logLines[i].displayHeight);
            currentY -= this.logLines[i].displayHeight + 4;
        }
        
        // Remove lines that go past the header area
        while(this.logLines.length > 0 && this.logLines[0].y < 80) {
             const old = this.logLines.shift();
             old.destroy();
        }
    }

    logMessage(text, color = COLORS.WHITE) {
        const sidebarX = this.cameras.main.width * 0.75;
        const newText = this.add.text(20, 0, "> " + text, { 
            ...this.baseTextConfig, 
            color: color, 
            wordWrap: { width: sidebarX - 40 } 
        });
        
        this.logLines.push(newText);
        this.alignLog();
    }

    processCommand(cmd) {
        const args = cmd.trim().split(' ');
        const mainCmd = args[0].toLowerCase();
        
        // Echo the command to the local log
        this.logMessage(cmd, COLORS.GRAY); 

        // MMO PHASE 1: Forward ALL input directly to the Server
        if (this.socket && this.socket.connected) {
            this.socket.emit('command', cmd);
        } else {
            this.logMessage(`ERROR: UPLINK OFFLINE. COMMAND DROPPED.`, COLORS.RED);
        }

        /* 
        // --- OLD LOCAL LOGIC COMMENTED OUT FOR MMO PHASE 1 ---
        // Intercept commands if an event is active
        if (this.gameState.currentEvent) {
            // Allow movement while an event is active so they can get to the right room
            if (mainCmd === 'move' || mainCmd === 'help') {
                // Let these fall through to the main switch statement
            } else {
                const eventOpt = this.gameState.currentEvent.options.find(o => o.command === mainCmd);
                if (eventOpt) {
                    if (eventOpt.requiredRoom && !this.gameState.location.toLowerCase().includes(eventOpt.requiredRoom.toLowerCase())) {
                        this.logMessage(`ERROR: '${mainCmd}' MUST BE EXECUTED FROM ${this.ROOM_NAMES[eventOpt.requiredRoom] || eventOpt.requiredRoom.toUpperCase()}.`, COLORS.RED);
                        return;
                    }
                    eventOpt.execute(this);
                    return;
                } else if (mainCmd !== 'jump') {
                    this.logMessage(`ERROR: Invalid action. Type an event command, 'move <room>', or 'jump'.`, COLORS.RED);
                    return;
                }
            }
        }
        
        switch(mainCmd) {
            case 'jump':
                if (this.gameState.location !== 'Bridge') {
                    this.logMessage("ERROR: JUMP COMMAND MUST BE EXECUTED FROM THE BRIDGE.", COLORS.RED);
                    break;
                }
                if (this.gameState.inCombat) {
                    this.logMessage("ERROR: CANNOT JUMP WHILE IN COMBAT. DESTROY ENEMY OR FLEE.", COLORS.RED);
                    break;
                }
                if (this.gameState.fuel.current >= 10) {
                    this.gameState.fuel.current -= 10;
                    // Reset encounter state on jump
                    this.gameState.currentEncounter = null;
                    if (this.gameState.currentEvent) {
                        this.logMessage(`Fleeing from event...`, COLORS.GRAY);
                        this.clearEvent();
                    }
                    
                    this.updateHeader();
                    this.logMessage("SPOOLING FSD DRIVE...", COLORS.CYAN);
                    this.cameras.main.shake(300, 0.005);
                    
                    this.time.delayedCall(1500, () => {
                         this.logMessage("JUMP SUCCESSFUL. ARRIVED IN NEW SECTOR.", COLORS.GREEN);
                         this.generateEncounter();
                         this.checkStranded();
                    });
                } else {
                    this.logMessage(`ERROR: INSUFFICIENT FUEL FOR JUMP. REQUIRED: 10 ${SYMBOLS.FUEL}`, COLORS.RED);
                }
                break;
            case 'mine':
                if (!this.gameState.location.includes('Cargo')) {
                    this.logMessage("ERROR: MINE COMMAND MUST BE EXECUTED FROM THE CARGO BAY.", COLORS.RED);
                    break;
                }
                if (this.gameState.currentEncounter && this.gameState.currentEncounter.type === 'asteroid') {
                    const yieldAmt = Math.floor(Math.random() * 5) + 2;
                    this.gameState.scrap += yieldAmt;
                    this.gameState.currentEncounter.hp -= 10;
                    this.updateHeader();
                    this.logMessage(`GRABBER ARM ACTIVATED. ACQUIRED ${yieldAmt} ${SYMBOLS.SCRAP}`, COLORS.GREEN);
                    
                    if (this.gameState.currentEncounter.hp <= 0) {
                        this.logMessage(`ASTEROID DEPLETED.`, COLORS.GRAY);
                        this.gameState.currentEncounter = null;
                        this.updateSensors(`No prominent signals.`, COLORS.GRAY);
                    }
                } else {
                    this.logMessage(`ERROR: NO MINEABLE ASTEROID IN RANGE.`, COLORS.RED);
                }
                break;
            case 'attack':
                if (!this.gameState.location.includes('Weapons')) {
                    this.logMessage("ERROR: WEAPONS COMMAND MUST BE EXECUTED FROM WEAPONS CNTRL.", COLORS.RED);
                    break;
                }
                if (this.gameState.currentEncounter && this.gameState.currentEncounter.type === 'ship') {
                    // Check if they were neutral/friendly, and if so, penalize rep and initiate combat
                    if (!this.gameState.inCombat) {
                        this.gameState.inCombat = true;
                        const fac = this.gameState.currentEncounter.faction;
                        if (fac !== 'pirates') {
                             this.gameState.factions[fac] -= 30; // Huge penalty for unprovoked attack
                             this.logMessage(`WARNING: UNPROVOKED ATTACK ON ${fac.toUpperCase()}. REPUTATION DECREASED.`, COLORS.RED);
                        }
                        this.logMessage(`COMBAT INITIATED WITH ${this.gameState.currentEncounter.name}!`, COLORS.MAGENTA);
                        this.updateSensors(`${SYMBOLS.HOSTILE} ${this.gameState.currentEncounter.name} [Engaging]`, COLORS.RED);
                    }
                    
                    if (this.gameState.energy.current >= 10) {
                        // Spend energy
                        this.gameState.energy.current -= 10;
                        
                        // Player attacks
                        this.cameras.main.shake(100, 0.002);
                        const pDmg = 15;
                        this.gameState.currentEncounter.hp -= pDmg;
                        this.logMessage(`FIRING TURRETS [-10 Energy]: Dealt ${pDmg} DMG to ${this.gameState.currentEncounter.name}`, COLORS.CYAN);
                        
                        if (this.gameState.currentEncounter.hp <= 0) {
                            this.logMessage(`TARGET DESTROYED. ${this.gameState.currentEncounter.name} eliminated.`, COLORS.GREEN);
                            this.gameState.scrap += 10; // Loot
                            this.logMessage(`SALVAGED 10 ${SYMBOLS.SCRAP}`, COLORS.GREEN);
                            
                            // Defeating pirates boosts miner rep slightly
                            if (this.gameState.currentEncounter.faction === 'pirates') {
                                this.gameState.factions.miners += 5;
                                this.logMessage(`Free Miners appreciate your anti-piracy efforts. (+Rep)`, COLORS.GREEN);
                            }
                            
                            this.gameState.inCombat = false;
                            this.gameState.currentEncounter = null;
                            this.updateSensors(`No prominent signals.`, COLORS.GRAY);
                            this.updateHeader();
                        } else {
                            // Enemy Turn
                            this.time.delayedCall(800, () => this.enemyTurn());
                        }
                    } else {
                        this.logMessage(`ERROR: INSUFFICIENT ENERGY [REQ: 10 ${SYMBOLS.ENERGY}]. RECHARGING...`, COLORS.RED);
                        this.logMessage(`Turn yielded to enemy.`, COLORS.GRAY);
                        // Skip player action, enemy attacks
                        this.time.delayedCall(800, () => this.enemyTurn());
                    }
                } else {
                    this.logMessage(`ERROR: NO VALID COMBAT TARGET.`, COLORS.RED);
                }
                break;
            case 'move':
                if (args.length < 2) {
                    this.logMessage("ERROR: Provide a destination (e.g., 'move weapons', 'move engineering').", COLORS.RED);
                    break;
                }
                const dest = args[1].toLowerCase();
                const validRooms = ['bridge', 'weapons', 'cargo', 'engineering'];
                
                if (validRooms.includes(dest)) {
                    if (this.gameState.location.toLowerCase().includes(dest)) {
                        this.logMessage(`You are already in ${this.ROOM_NAMES[dest]}.`, COLORS.GRAY);
                    } else {
                        this.gameState.location = this.ROOM_NAMES[dest];
                        this.sidebarLocation.setText(`[L] ${this.ROOM_NAMES[dest]}`);
                        this.logMessage(`Moved to ${this.ROOM_NAMES[dest]}.`, COLORS.CYAN);
                        
                        // Moving in combat takes a turn
                        if (this.gameState.inCombat) {
                            this.time.delayedCall(800, () => this.enemyTurn());
                        }
                    }
                } else {
                    this.logMessage(`ERROR: Unknown room '${dest}'. Valid rooms: bridge, weapons, cargo, engineering.`, COLORS.RED);
                }
                break;
            case 'repair':
                if (!this.gameState.location.includes('Engineering')) {
                    this.logMessage("ERROR: REPAIR COMMAND MUST BE EXECUTED FROM ENGINEERING.", COLORS.RED);
                    break;
                }
                if (this.gameState.scrap >= 5) {
                    if (this.gameState.hull.current === this.gameState.hull.max) {
                        this.logMessage("HULL INTEGRITY MAXIMUM. REPAIRS UNNECESSARY.", COLORS.GRAY);
                        break;
                    }
                    this.gameState.scrap -= 5;
                    const amount = Math.min(10, this.gameState.hull.max - this.gameState.hull.current);
                    this.gameState.hull.current += amount;
                    this.updateHeader();
                    this.logMessage(`Welding torch activated. Repaired ${amount} Hull [-5 Scrap]`, COLORS.GREEN);
                    
                    if (this.gameState.inCombat) {
                        this.time.delayedCall(800, () => this.enemyTurn());
                    }
                } else {
                    this.logMessage("ERROR: INSUFFICIENT SCRAP FOR REPAIRS. REQUIRED: 5", COLORS.RED);
                }
                break;
            case 'help':
                this.logMessage("AVAILABLE COMMANDS:", COLORS.YELLOW);
                this.logMessage("- 'move <room>': Change location (bridge, weapons, cargo, engineering)", COLORS.WHITE);
                this.logMessage("- 'jump': Jump to new sector [BRIDGE ONLY] (Cost 10 Fuel)", COLORS.WHITE);
                this.logMessage("- 'mine': Harvest resources [CARGO BAY ONLY]", COLORS.WHITE);
                this.logMessage("- 'attack': Fire weapons [WEAPONS CNTRL ONLY]", COLORS.WHITE);
                this.logMessage("- 'repair': Restore Hull with Scrap [ENGINEERING ONLY]", COLORS.WHITE);
                this.logMessage("- 'help': Show this message", COLORS.WHITE);
                break;
            default:
                this.logMessage("ERROR: Command not recognized. Type 'help' for options.", COLORS.RED);
        }
        */
    }

    getFactionColor(rep) {
        if (rep <= -20) return COLORS.RED;
        if (rep >= 20) return COLORS.GREEN;
        return COLORS.GRAY;
    }

    getFactionStandingStr(rep) {
        if (rep <= -20) return "Hostile";
        if (rep >= 20) return "Friendly";
        return "Neutral";
    }

    generateEncounter() {
        const roll = Math.random();
        
        if (roll < 0.25) {
            // 25% chance for an asteroid
            this.gameState.currentEncounter = { type: 'asteroid', hp: 30 };
            this.logMessage(`${SYMBOLS.ALERT} SENSORS DETECT A DENSE ASTEROID FIELD.`, COLORS.YELLOW);
            this.logMessage(`Use 'mine' to deploy the grabber arm.`, COLORS.GRAY);
            this.updateSensors(`${SYMBOLS.ASTEROID} Mineral Rich Asteroid`);
            
        } else if (roll < 0.6) {
            // 35% chance for a ship
            const isPirate = Math.random() < 0.5;
            let shipDetails;
            
            if (isPirate) {
                shipDetails = { faction: 'pirates', name: 'Scrap Pirate', hp: 50, dmg: 10 };
            } else {
                shipDetails = { faction: 'miners', name: 'Free Miner Skiff', hp: 40, dmg: 6 };
            }
            
            this.gameState.currentEncounter = { type: 'ship', ...shipDetails };
            
            const rep = this.gameState.factions[shipDetails.faction];
            const standingColor = this.getFactionColor(rep);
            const standingStr = this.getFactionStandingStr(rep);
            
            this.logMessage(`${SYMBOLS.ALERT} SENSORS DETECT A SHIP IN SECTOR.`, COLORS.YELLOW);
            
            if (rep <= -20) {
                // Hostile
                this.gameState.inCombat = true;
                this.logMessage(`${SYMBOLS.HOSTILE} WARNING: HOSTILE ${shipDetails.name} APPROACHES!`, standingColor);
                this.logMessage(`[Faction: ${shipDetails.faction.toUpperCase()} | Standing: ${standingStr}]`, standingColor);
                this.logMessage(`COMBAT INITIATED. Use 'attack'.`, COLORS.MAGENTA);
                this.logMessage(`TACTICAL PAUSE: Hostile target is awaiting your move.`, COLORS.GRAY);
                this.updateSensors(`${SYMBOLS.HOSTILE} ${shipDetails.name} [Engaging]`, standingColor);
            } else {
                // Neutral / Friendly
                this.logMessage(`${SYMBOLS.FRIENDLY} Detected ${shipDetails.name}. They are holding position.`, standingColor);
                this.logMessage(`[Faction: ${shipDetails.faction.toUpperCase()} | Standing: ${standingStr}]`, standingColor);
                this.logMessage(`You can 'jump' away, or 'attack' to initiate hostilities.`, COLORS.GRAY);
                this.updateSensors(`${SYMBOLS.FRIENDLY} ${shipDetails.name} [Idle]`, standingColor);
            }
        } else if (roll < 0.85) {
            // 35% chance for a special event
            this.triggerEvent();
        } else {
            // 15% Empty space
            this.logMessage("Sector is clear. Navigation buoys offline.", COLORS.GRAY);
            this.updateSensors(`No prominent signals.`, COLORS.GRAY);
        }
    }

    updateSensors(text, color = COLORS.YELLOW) {
        this.sidebarSensors.setText(text);
        this.sidebarSensors.setColor(color);
    }

    triggerEvent() {
        if (!GAME_EVENTS || GAME_EVENTS.length === 0) return;
        const event = getRandomEvent();
        this.gameState.currentEvent = event;
        this.gameState.currentEncounter = null;
        
        this.logMessage(`--- ANOMALY DETECTED ---`, COLORS.MAGENTA);
        this.logMessage(`${event.title}`, COLORS.WHITE);
        this.logMessage(`${event.text}`, COLORS.GRAY);
        this.logMessage(`OPTIONS:`, COLORS.YELLOW);
        
        event.options.forEach(opt => {
            let reqText = opt.requiredRoom ? ` [Requires: ${this.ROOM_NAMES[opt.requiredRoom] || opt.requiredRoom}]` : "";
            this.logMessage(`- '${opt.command}': ${opt.description}${reqText}`, COLORS.CYAN);
        });
        
        this.updateSensors(`${SYMBOLS.UNKNOWN} ${event.title}`, COLORS.MAGENTA);
    }
    
    clearEvent() {
        this.gameState.currentEvent = null;
        this.updateSensors(`No prominent signals.`, COLORS.GRAY);
        this.updateHeader();
    }

    enemyTurn() {
        if (!this.gameState.inCombat || !this.gameState.currentEncounter) return;
        
        const enemy = this.gameState.currentEncounter;
        this.logMessage(`[!] ${enemy.name} returns fire!`, COLORS.RED);
        this.cameras.main.shake(150, 0.01);
        
        this.gameState.hull.current -= enemy.dmg;
        
        // Regenerate energy at the end of the round
        this.gameState.energy.current = Math.min(this.gameState.energy.max, this.gameState.energy.current + 5);
        
        this.updateHeader();
        
        this.logMessage(`WARNING: HULL INTEGRITY DROPPED BY ${enemy.dmg}. (+5 Energy Regenerated)`, COLORS.RED);
        
        if (this.gameState.hull.current <= 0) {
            this.gameState.hull.current = 0;
            this.updateHeader();
            this.logMessage(`CRITICAL FAILURE. HULL BREACHED. SHIP DESTROYED.`, COLORS.RED);
            this.triggerGameOver("Destroyed in combat.");
        }
    }
    
    checkStranded() {
        if (this.gameState.fuel.current < 10 && !this.gameState.currentEncounter) {
             this.logMessage(`CRITICAL ALERT: INSUFFICIENT FUEL FOR FURTHER JUMPS.`, COLORS.RED);
             this.logMessage(`NO HARVESTABLE RESOURCES IN SENSORS.`, COLORS.RED);
             this.triggerGameOver("Stranded in the Spiral Nebula.");
        }
    }

    triggerGameOver(reason) {
        this.gameState.isGameOver = true;
        this.gameState.inCombat = false;
        this.promptText.setText("SYSTEM FAILURE. CRITICAL ERROR.");
        this.promptText.setColor(COLORS.RED);
        this.logMessage(`*** GAME OVER ***`, COLORS.MAGENTA);
        this.logMessage(`Reason: ${reason}`, COLORS.GRAY);
        // Extreme screen shake on death
        this.cameras.main.shake(1000, 0.02);
    }

    update() {
        // Update shader time for potential dynamic effects
        // this.postPipeline.time += 0.05; 
    }
}

// Phaser Configuration
const config = {
    type: Phaser.AUTO, // Use AUTO for better compatibility
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#000000',
    scene: [MainScene],
    pipeline: { CustomPipeline } // Register our custom pipeline
};

const game = new Phaser.Game(config);
