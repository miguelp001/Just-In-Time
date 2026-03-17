import { COLORS, SYMBOLS, ROOM_DESCRIPTIONS } from './events.js';
import { CustomPipeline } from './crt_shader.js';

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
        
        // --- Device Detection ---
        this.isMobile = !this.sys.game.device.os.desktop || 
                        window.innerWidth < 800 || 
                        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform)); // iPad "Desktop" mode detection
        this.isPortrait = window.innerHeight > window.innerWidth;

        // Get game dimensions
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Base text configuration - Scale for mobile
        const baseFontSize = this.isMobile ? '16px' : '18px';
        const headerFontSize = this.isMobile ? '20px' : '22px';

        this.baseTextConfig = {
            fontFamily: 'Courier New, monospace',
            fontSize: baseFontSize,
            color: COLORS.WHITE,
            align: 'left',
            wordWrap: { width: width * (this.isPortrait ? 0.9 : 0.7), useAdvancedWrap: true }
        };

        // --- Game State ---
        this.gameState = {
            hull: { current: 100, max: 100 },
            fuel: { current: 80, max: 100 },
            energy: { current: 50, max: 50 },
            scrap: 15,
            credits: 200,
            location: 'Bridge',
            currentEncounter: null,
            currentEvent: null,
            inCombat: false,
            isGameOver: false,
            factions: {
                pirates: -50,
                miners: 0,
                corps: 10
            }
        };

        this.ROOM_NAMES = {
            'bridge': 'Bridge',
            'weapons': 'Weapons Cntrl',
            'cargo': 'Cargo Bay',
            'engineering': 'Engineering'
        };

        // --- Layout Constants ---
        const margin = 20;
        const headerH = this.isMobile ? 80 : 50;
        const footerH = this.isMobile ? 120 : 60; // Extra space for mobile buttons
        
        // --- Scaffold UI Layout ---
        
        // Header
        this.headerText = this.add.text(margin, margin, "", { ...this.baseTextConfig, fontSize: headerFontSize, color: COLORS.GREEN, fontStyle: 'bold' });
        this.updateHeader();
        this.add.line(0, 0, margin, headerH, width - margin, headerH, 0x00FF00).setOrigin(0,0);

        if (!this.isPortrait) {
            // Desktop/Landscape Sidebar (Right)
            const sidebarX = width * 0.75;
            this.add.line(0, 0, sidebarX, headerH, sidebarX, height - footerH, 0x00FF00).setOrigin(0,0);
            
            this.sidebarTitle = this.add.text(sidebarX + 20, 60, "> LOCATION:", { ...this.baseTextConfig, color: COLORS.CYAN });
            this.sidebarLocation = this.add.text(sidebarX + 20, 90, "[B] Bridge", this.baseTextConfig);
            
            this.sidebarSensorsTitle = this.add.text(sidebarX + 20, 140, "> SCANNERS:", { ...this.baseTextConfig, color: COLORS.CYAN });
            this.sidebarSensors = this.add.text(sidebarX + 20, 170, "No signals.", { ...this.baseTextConfig, color: COLORS.YELLOW });
        } else {
            // Mobile Portrait Summary (Top/Mid)
            // We'll overlay or show them in the log for now, or a compact bar.
            this.sidebarLocation = this.add.text(width - 120, margin, "[B] Bridge", { ...this.baseTextConfig, fontSize: '14px' });
            // Scanners will be shown as log messages in mobile mode for better flow
        }

        // Main View (Left/Center)
        this.mainLogTitle = this.add.text(margin, headerH + 10, "SYS_LOG_SEC_9:", { ...this.baseTextConfig, fontSize: '14px', color: COLORS.GRAY });
        
        this.logContainer = this.add.container(margin, headerH + 40);
        this.logLines = []; 
        
        // Initial Logs
        this.logMessage("Boot sequence complete.", COLORS.WHITE);
        this.logMessage("Uplink secured. Ready.", COLORS.GREEN);
        this.logMessage("Awaiting orders. Type 'help'.", COLORS.WHITE);

        // Footer (Command Prompt & Mobile Buttons)
        const promptY = height - footerH + 10;
        this.add.line(0, 0, margin, height - footerH, width - margin, height - footerH, 0x00FF00).setOrigin(0,0);
        this.promptText = this.add.text(margin, promptY, "C:\\TGB\\CMD >_ ", { ...this.baseTextConfig, color: COLORS.GREEN, fontStyle: 'bold' });
        
        if (this.isMobile) {
            this.createMobileButtons(height - 40, width);
        }

        // --- Input Handling ---
        this.currentInput = "";
        
        // --- Mobile Input Support ---
        this.mobileInput = document.getElementById('mobile-input');
        
        this.input.keyboard.on('keydown', (event) => {
            if (event.keyCode === 13) {
                // Enter
                if (this.currentInput.trim().length > 0) {
                    this.processCommand(this.currentInput);
                }
            }
            
            // All alphanumeric, space, and backspace input is now handled natively 
            // by the 'input' event on the mobileInput element. 
            // We do NOT preventDefault here so the browser can update the DOM value.
            
            if (!this.gameState.isGameOver) {
                 this.updatePrompt();
            }
        });

        if (this.mobileInput) {
            this.mobileInput.addEventListener('input', (event) => {
                this.currentInput = event.target.value;
                if (!this.gameState.isGameOver) {
                    this.updatePrompt();
                }
            });
            
            this.mobileInput.addEventListener('keydown', (event) => {
                if (event.keyCode === 13) {
                    if (this.currentInput.trim().length > 0) {
                        this.processCommand(this.currentInput);
                    }
                }
            });
        }

        // --- Apply CRT Shader ---
        this.cameras.main.setPostPipeline(CustomPipeline);

        // Global Tap to Re-focus (Vital for Safari/Opera/Desktop)
        this.input.on('pointerdown', () => {
            if (this.mobileInput) {
                // Some browsers ignore focus on elements with pointer-events: none
                this.mobileInput.style.pointerEvents = 'auto'; 
                this.mobileInput.focus();
                
                // Safari/Opera need it immediate, but a second attempt helps
                setTimeout(() => { 
                    if (this.mobileInput) this.mobileInput.focus(); 
                }, 10);

                // Disable pointer events after a delay so it doesn't block game interaction
                setTimeout(() => { 
                    if (this.mobileInput) this.mobileInput.style.pointerEvents = 'none'; 
                }, 150);
            }
        });

        // --- Network Connection ---
        this.connectToServer();
    }

    connectToServer() {
        this.logMessage(`INITIALIZING NEBULA UPLINK...`, COLORS.CYAN);
        
        // Protocol-aware WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            this.logMessage(`Uplink secured. Ready.`, COLORS.GREEN);
            this.socket.connected = true; 
            
            // --- PERSISTENCE: Send init with saved token ---
            const savedId = localStorage.getItem('jit_player_id');
            this.socket.send(JSON.stringify({ 
                type: 'init', 
                playerId: savedId || '' 
            }));
        };

        this.socket.onmessage = (event) => {
            try {
                const packet = JSON.parse(event.data);
                const { type, data } = packet;

                switch (type) {
                    case 'log':
                        if (data.message) {
                            this.logMessage(data.message, data.color || COLORS.WHITE);
                        }
                        break;
                    case 'identity':
                        localStorage.setItem('jit_player_id', data.id);
                        this.logMessage(`IDENTITY RECOGNIZED: ${data.id.slice(0, 8)}...`, COLORS.GREEN);
                        break;
                    case 'chat':
                        this.logMessage(`[COMM - ${data.ship}] ${data.sender}: "${data.text}"`, data.color || COLORS.CYAN);
                        break;
                    case 'update_ui':
                        this.handleUpdateUI(data);
                        break;
                    case 'ship_sync':
                        this.handleShipSync(data);
                        break;
                    case 'update_sector':
                        this.handleUpdateSector(data);
                        break;
                }
            } catch (err) {
                console.error("Failed to parse server message:", err);
            }
        };

        this.socket.onerror = (err) => {
            console.warn("Connection failed.", err);
            this.logMessage("UPLINK OFFLINE. SECURE LINK FAILED.", COLORS.YELLOW);
        };

        this.socket.onclose = () => {
            this.socket.connected = false;
            this.logMessage("LINK SEVERED. ATTEMPTING RECONNECT...", COLORS.RED);
            // Optional: Implement auto-reconnect logic here
            setTimeout(() => this.connectToServer(), 3000);
        };
    }

    handleUpdateUI(data) {
        if (data.state) {
            this.gameState.networkState = data.state;
            if (data.state === 'LOBBY') {
                this.headerText.setText("[ LOBBY ]");
                this.sidebarLocation.setText("");
            }
        }
        if (data.location) {
            this.gameState.location = data.location;
            const shortTag = data.location.charAt(0).toUpperCase();
            this.sidebarLocation.setText(`[${shortTag}] ${data.location}`);
        }
        if (data.sector !== undefined) {
            this.gameState.sector = data.sector;
            if (this.gameState.networkState === 'IN_GAME') {
                this.updateHeader();
            }
        }
    }

    handleShipSync(data) {
        if (this.gameState.networkState === 'IN_GAME') {
            // Normalize: server sends flat numbers from tick, objects from reconnect
            this.gameState.hull = (typeof data.hull === 'object') ? data.hull : { current: data.hull, max: data.maxHull || 100 };
            this.gameState.fuel = (typeof data.fuel === 'object') ? data.fuel : { current: data.fuel, max: 100 };
            this.gameState.energy = (typeof data.energy === 'object') ? data.energy : { current: data.energy, max: data.maxEnergy || 50 };
            this.gameState.scrap = data.scrap;
            this.gameState.credits = data.credits;
            this.gameState.cooldowns = data.cooldowns;
            this.updateHeader();
        }
    }

    handleUpdateSector(data) {
        this.currentSectorInfo = data;
        let text = `SECTOR: ${data.id}\n`;
        text += `LINKS: ${data.links.join(', ')}\n`;
        if (data.station) {
            text += `[!!!] STATION: ${data.station.name.toUpperCase()}\n`;
        }
        if (data.encounterType) {
            text += `STATUS: ${data.encounterType.toUpperCase()}\n`;
        } else {
            text += `STATUS: CLEAR\n`;
        }
        this.updateSensors(text, data.station ? COLORS.GREEN : COLORS.YELLOW);
    }

    updateHeader() {
        if (this.gameState.networkState === 'LOBBY') return;

        const g = this.gameState;
        let cooldownsStr = '';
        if (g.cooldowns) {
            for (const [room, time] of Object.entries(g.cooldowns)) {
                if (time > 0) {
                    cooldownsStr += ` [! ${room.toUpperCase().slice(0,3)} CD:${time}s]`;
                }
            }
        }

        if (this.isMobile) {
            this.headerText.setText(
                `${SYMBOLS.HULL}${g.hull.current || 0} ${SYMBOLS.FUEL}${g.fuel.current || 0} ${SYMBOLS.ENERGY}${g.energy.current || 0} ${SYMBOLS.SCRAP}${g.scrap || 0} $${g.credits || 0}\n` +
                `[SEC: ${g.sector || 'UNC'}]${cooldownsStr}`
            );
        } else {
            this.headerText.setText(
                `${SYMBOLS.HULL} Hull: ${g.hull.current || 0}/${g.hull.max || 100} | ` +
                `${SYMBOLS.FUEL} Fuel: ${g.fuel.current || 0}/${g.fuel.max || 100} | ` +
                `${SYMBOLS.ENERGY} Energy: ${g.energy.current || 0}/${g.energy.max || 50} | ` +
                `${SYMBOLS.SCRAP} Scrap: ${g.scrap || 0} | ` +
                `Credits: $${g.credits || 0} | ` +
                `[ SECTOR: ${g.sector || 'UNKNOWN'} ]${cooldownsStr}`
            );
        }
    }

    updatePrompt() {
        this.promptText.setText(`C:\\TUGBOAT\\CMD >_ ${this.currentInput}`);
    }

    alignLog() {
        const footerH = this.isMobile ? 120 : 60;
        let currentY = this.cameras.main.height - footerH - 10;
        const topLimit = (this.isMobile ? 80 : 50) + 40;

        for (let i = this.logLines.length - 1; i >= 0; i--) {
            const line = this.logLines[i];
            line.setX(20);
            line.setY(currentY - line.displayHeight);
            currentY -= line.displayHeight + 6;

            if (currentY < topLimit) {
                // Destroy hidden lines
                const removed = this.logLines.splice(0, i + 1);
                removed.forEach(r => r.destroy());
                break;
            }
        }
    }

    createMobileButtons(y, width) {
        const btnWidth = (width - 40) / 5;
        const commands = ['HELP', 'MOVE', 'SCAN', 'MAP', 'JOIN'];
        
        commands.forEach((cmd, i) => {
            const x = 20 + (i * btnWidth);
            const btn = this.add.rectangle(x + btnWidth/2 - 5, y, btnWidth - 10, 40, 0x003300)
                .setStrokeStyle(1, 0x00FF00)
                .setInteractive({ useHandCursor: true });
            
            this.add.text(x + btnWidth/2 - 5, y, cmd, { fontSize: '14px', color: '#00FF00' }).setOrigin(0.5);
            
            btn.on('pointerdown', () => {
                this.cameras.main.shake(50, 0.002);
                const newVal = (cmd === 'MOVE' || cmd === 'JOIN') ? cmd.toLowerCase() + " " : cmd.toLowerCase();
                
                // Update the DOM input directly so it's the source of truth
                if (this.mobileInput) {
                    this.mobileInput.value = newVal;
                    this.currentInput = newVal;
                } else {
                    this.currentInput = newVal;
                }

                if (cmd !== 'MOVE' && cmd !== 'JOIN') {
                    this.processCommand(this.currentInput);
                }
                this.updatePrompt();
            });
        });

        // Add a "Keyboard" toggle button for mobile (Native DOM Button for Android Reliability)
        const nativeKbBtn = document.createElement('button');
        nativeKbBtn.innerText = "KBD";
        nativeKbBtn.className = "mobile-kbd-btn";
        if (this.isMobile) {
            nativeKbBtn.style.display = "flex";
            document.body.appendChild(nativeKbBtn);
        }
        
        const triggerFocus = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (this.mobileInput) {
                // Ensure it's reachable for the focus call
                this.mobileInput.style.pointerEvents = 'auto';
                this.mobileInput.focus();
                
                // Mobile browsers often need extra nudges
                setTimeout(() => {
                    if (this.mobileInput) {
                        this.mobileInput.focus();
                    }
                }, 50);

                // Keep it active long enough to register the focus
                setTimeout(() => {
                    if (this.mobileInput) {
                        this.mobileInput.style.pointerEvents = 'none';
                    }
                }, 200);
                
                // Keep the CRT vibe: log to terminal
                this.logMessage("LINK ESTABLISHED. SENSOR UPLINK ACTIVE.", COLORS.YELLOW);
            } else {
                this.logMessage("ERROR: Input proxy missing.", COLORS.RED);
            }
        };

        nativeKbBtn.ontouchstart = triggerFocus;
        nativeKbBtn.ontouchend = (e) => e.preventDefault(); // Prevent ghost clicks
        nativeKbBtn.onclick = triggerFocus; // Fallback for some browsers

        // Clean up on scene shutdown
        this.events.once('shutdown', () => {
            if (nativeKbBtn.parentNode) {
                nativeKbBtn.parentNode.removeChild(nativeKbBtn);
            }
        });
    }

    logMessage(message, color = COLORS.WHITE) {
        // DETECT RADAR MAP: If multi-line, don't prefix with '>'
        const isMap = message.includes('--- CRT RADAR UNIT');
        const displayMsg = isMap ? message : `> ${message}`;
        
        const textObj = this.add.text(20, 0, displayMsg, { ...this.baseTextConfig, color });
        
        // If it's a map, make it stand out with a slight glow or different config if needed
        if (isMap) {
            textObj.setStroke('#00FF00', 1);
            textObj.setShadow(2, 2, '#003300', 2, true, true);
        }

        this.logLines.push(textObj);
        this.alignLog();
    }

    processCommand(cmd) {
        const args = cmd.trim().split(' ');
        const mainCmd = args[0].toLowerCase();
        
        // Echo the command to the local log
        this.logMessage(cmd, COLORS.GRAY); 

        // Raw WebSocket Command Send
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ 
                type: 'command', 
                cmd: cmd 
            }));
        } else {
            this.logMessage(`ERROR: UPLINK OFFLINE. COMMAND DROPPED.`, COLORS.RED);
        }

        // Clear State
        this.currentInput = "";
        if (this.mobileInput) {
            this.mobileInput.value = "";
            // Buffer Clearing Trick: Blur and focus to reset predictive text buffers
            this.mobileInput.blur();
            setTimeout(() => {
                if (this.mobileInput && !this.gameState.isGameOver) {
                    this.mobileInput.focus();
                }
            }, 50);
        }
        this.updatePrompt();

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
    type: Phaser.WEBGL,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    scene: [MainScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    pipeline: { CustomPipeline } // Register our custom pipeline
};

const game = new Phaser.Game(config);

// Handle window resizing
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
