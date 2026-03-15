
const COLORS = {
    GREEN: '#00FF00',
    RED: '#FF0000',
    YELLOW: '#FFFF00',
    CYAN: '#00FFFF',
    GRAY: '#AAAAAA',
    WHITE: '#FFFFFF',
    MAGENTA: '#FF00FF'
};
const SYMBOLS = {
    HULL: '[♥]',
    ENERGY: '[⚡]',
    FUEL: '[⛽]',
    SCRAP: '[⚙]',
    CREDITS: '[$]',
    ALERT: '[!]',
    UNKNOWN: '[?]',
    HOSTILE: '[X]',
    FRIENDLY: '[O]',
    FACTION: '[F]',
    ASTEROID: '[*]'
};

const SECTOR_FLAVOR = [
    "The void here is stained with the neon ghost of a dying nebula.",
    "Frozen husks of ancient freighters drift in the silence, their hulls picked clean by scavengers.",
    "A field of crystalline dust catches the distant starlight, sparkling like a million diamonds.",
    "The darkness here feels heavy and absolute, as if the light of the stars has been swallowed.",
    "Bizarre gravitational ripples vibrate through the hull; the very fabric of space seems thin here.",
    "An eerie silence pervades the sector, interrupted only by the rhythmic clicking of your scanners.",
    "The glow of a nearby pulsar bathes the ship in rhythmic flashes of violet light.",
    "Static discharge dances across the viewports as the ship passes through an ion cloud.",
    "The radar shows nothing but ghosts and reflections of long-dead civilizations."
];

const ROOM_DESCRIPTIONS = {
    'Bridge': "A cramped array of flickering CRT monitors and coffee-stained consoles. The hum of the navigation computer is the only constant.",
    'Weapons Cntrl': "Smells of ozone and cold steel. The targeting displays pulse with a predatory red light, waiting for a lock.",
    'Cargo Bay': "Cavernous and echoing. Magnetic clamps rattle as the ship maneuvers; the air is thick with the scent of industrial grease.",
    'Engineering': "The heart of the tugboat. A chaotic maze of pulsing pipes and white-hot fusion coils. The heat is almost physical."
};
const GAME_EVENTS = [
    {
        id: "anomaly_clockwork_rift",
        title: "The Clockwork Rift",
        type: "anomaly",
        text: "Space here seems to tick rhythmically. A massive, gear-like fracture in reality spins slowly.",
        options: [
            {
                command: "sync",
                requiredRoom: "engineering",
                description: "Attempt to sync engines with the rhythm (Risk: Mod)",
                execute: (ship, player, broadcast) => {
                    if (Math.random() > 0.4) {
                        ship.fuel.current = Math.min(ship.fuel.max, ship.fuel.current + 20);
                        broadcast("ENGINES SYNCED. Siphoned temporal energy into the fuel reserves. (+20 Fuel)", COLORS.GREEN);
                    } else {
                        ship.energy.current -= 15;
                        broadcast("SYNC FAILED. The rhythmic feedback drained ship capacitors. (-15 Energy)", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Leave the anomaly alone",
                execute: (ship, player, broadcast) => {
                    broadcast("You steer clear of the rift. It ticks ominously as you pass.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    },
    {
        id: "anomaly_sentient_stardust",
        title: "Sentient Stardust",
        type: "anomaly",
        text: "A cloud of shimmering, colorful dust approaches the ship. It seems to move with purpose.",
        options: [
            {
                command: "allow",
                description: "Drop shields and let the dust cling to the hull",
                execute: (ship, player, broadcast) => {
                    ship.hull.current = Math.min(ship.hull.max, ship.hull.current + 10);
                    broadcast("The dust settles into micro-fractures, solidifying and repairing the plating! (+10 Hull)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "repel",
                requiredRoom: "bridge",
                description: "Boost shields to repel the dust (-5 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy.current >= 5) {
                        ship.energy.current -= 5;
                        broadcast("Shields flared. The dust scatters harmlessly into the void.", COLORS.GRAY);
                    } else {
                        broadcast("Not enough energy to repel. The dust clings to the ship, but finds no damage to repair.", COLORS.GRAY);
                    }
                    ship.currentEncounter = null;
                }
            }
        ]
    },
    {
        id: "derelict_abandoned_casino",
        title: "Abandoned Casino Ship",
        type: "derelict",
        text: "A floating luxury vessel, dark and silent. Neon signs flicker weakly: 'The Golden Asteroid'.",
        options: [
            {
                command: "board",
                requiredRoom: "cargo",
                description: "Dock and search for valuables (-10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy.current >= 10) {
                        ship.energy.current -= 10;
                        const foundCredits = Math.floor(Math.random() * 50) + 20;
                        ship.credits += foundCredits;
                        broadcast(`You force the airlocks open. Found an unattended high-roller table with ${foundCredits} Credits!`, COLORS.GREEN);
                    } else {
                        broadcast("Insufficient energy to run life-support umbilical for a boarding party.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Leave it alone",
                execute: (ship, player, broadcast) => {
                    broadcast("You leave the ghost ship to spin in the dark.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    },
    {
        id: "derelict_frozen_frigate",
        title: "Frozen Frigate",
        type: "derelict",
        text: "An old warship encased in strange, glowing blue ice. Faint power signatures emanate from within.",
        options: [
            {
                command: "thaw",
                requiredRoom: "weapons",
                description: "Fire mining lasers to melt the ice (-10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy.current >= 10) {
                        ship.energy.current -= 10;
                        ship.scrap += 15;
                        broadcast("The ice shatters, allowing you to salvage 15 Scrap from the hull.", COLORS.GREEN);
                    } else {
                        broadcast("Not enough energy to channel the continuous beam required.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Leave it frozen",
                execute: (ship, player, broadcast) => {
                    broadcast("You leave the frozen tomb untouched.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    },
    {
        id: "hazard_solar_flare",
        title: "Solar Flare Warning",
        type: "hazard",
        text: "WARNING: Massive coronal mass ejection detected from a nearby unstable star. Radiation wave approaching rapidly.",
        options: [
            {
                command: "brace",
                requiredRoom: "engineering",
                description: "Divert all auxiliary power to structural integrity (-15 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy.current >= 15) {
                        ship.energy.current -= 15;
                        broadcast("Shields hold against the brunt of the radiation. The ship groans but survives unscathed.", COLORS.GREEN);
                    } else {
                        broadcast("Insufficient energy to reinforce shields! The flare scorches the hull.", COLORS.RED);
                        ship.hull.current -= 25;
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Take the hit to save energy (Takes 25 Hull DMG)",
                execute: (ship, player, broadcast) => {
                    ship.hull.current -= 25;
                    broadcast("The radiation flare scorches the hull. Warning sirens blare. (-25 Hull)", COLORS.RED);
                    ship.currentEncounter = null;
                }
            }
        ]
    },
    {
        id: "distress_lost_cargo",
        title: "Lost Cargo Pod",
        type: "distress",
        text: "A faint automated distress beacon leads you to an intact Corpo Sec cargo pod drifting alone.",
        options: [
            {
                command: "salvage",
                requiredRoom: "cargo",
                description: "Break it down for parts",
                execute: (ship, player, broadcast) => {
                    const yieldAmt = Math.floor(Math.random() * 10) + 10;
                    ship.scrap += yieldAmt;
                    broadcast(`Pod scrapped. Acquired ${yieldAmt} Scrap.`, COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "open",
                requiredRoom: "cargo",
                description: "Hack the lock and see what's inside",
                execute: (ship, player, broadcast) => {
                    if (Math.random() > 0.5) {
                        const credits = Math.floor(Math.random() * 40) + 20;
                        ship.credits += credits;
                        broadcast(`Success! Found Corpo bearer bonds worth ${credits} Cr.`, COLORS.GREEN);
                    } else {
                        ship.hull.current -= 10;
                        broadcast("BOOBY TRAP! The pod detonates, damaging the tugboat! (-10 Hull)", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            }
        ]
    },
    {
        id: "faction_miner_toll",
        title: "Miner Toll Gate",
        type: "faction",
        text: "A squad of Free Miners blocks the optimal jump vector. 'Toll's 10 Credits today, friend.'",
        options: [
            {
                command: "pay",
                requiredRoom: "bridge",
                description: "Pay the 10 Credits",
                execute: (ship, player, broadcast) => {
                    if (ship.credits >= 10) {
                        ship.credits -= 10;
                        ship.factions.miners += 2;
                        broadcast("You transfer the funds. 'Safe travels, ' they broadcast. (+Miner Rep)", COLORS.GREEN);
                    } else {
                        broadcast("You don't have enough Credits to pay!", COLORS.RED);
                        broadcast("The Miners are annoyed and tell you to take the long way around. (-10 Fuel)", COLORS.YELLOW);
                        ship.fuel.current -= 10;
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "threaten",
                requiredRoom: "weapons",
                description: "Charge weapons and tell them to move",
                execute: (ship, player, broadcast) => {
                    ship.factions.miners -= 10;
                    broadcast("The Miners back down, cursing you over open comms. (-10 Miner Rep)", COLORS.YELLOW);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "anomaly_chronal_echo",
        title: "Chronal Echo",
        type: "anomaly",
        text: "You detect a ghost signature of your own ship from hours ago. Scanning it yields Scrap, but causes a temporary Energy drain.",
        options: [
            {
                command: "investigate",
                requiredRoom: "bridge",
                description: "Sync with the echo (-10 Energy, gain Scrap)",
                execute: (ship, player, broadcast) => {
                    ship.energy -= 10;
                    const scrap = Math.floor(Math.random() * 10) + 5;
                    ship.scrap += scrap;
                    broadcast(`The echo phased through the hull, depositing ${scrap} units of temporal scrap. (-10 Energy)`, COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Leave it alone",
                execute: (ship, player, broadcast) => { broadcast("The echo fades, leaving only static.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "anomaly_probability_storm",
        title: "Probability Storm",
        type: "anomaly",
        text: "Reality is unstable. Flipping a switch might grant Credits or instantly damage the Hull.",
        options: [
            {
                command: "investigate",
                requiredRoom: "bridge",
                description: "Roll the dice (50/50: +40 Credits or -15 Hull)",
                execute: (ship, player, broadcast) => {
                    if (Math.random() > 0.5) {
                        ship.credits += 40;
                        broadcast("Reality snaps in your favor! A cache of data-credits materializes. (+40 Credits)", COLORS.GREEN);
                    } else {
                        ship.hull -= 15;
                        broadcast("The storm collapses inward! Hull buckles from impossible physics. (-15 Hull)", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Leave it alone",
                execute: (ship, player, broadcast) => { broadcast("You fly through untouched. Probably for the best.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "anomaly_null_g_bubble",
        title: "Null-G Bubble",
        type: "anomaly",
        text: "A localized field where gravity ceases to exist. Spending Energy allows you to harvest rare frictionless materials.",
        options: [
            {
                command: "investigate",
                requiredRoom: "engineering",
                description: "Harvest materials (-8 Energy, gain Credits)",
                execute: (ship, player, broadcast) => {
                    ship.energy -= 8;
                    const credits = Math.floor(Math.random() * 20) + 15;
                    ship.credits += credits;
                    broadcast(`Zero-gravity extraction successful. Harvested rare lubricants worth ${credits} Cr. (-8 Energy)`, COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Leave it alone",
                execute: (ship, player, broadcast) => { broadcast("The bubble drifts away silently.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "anomaly_whispering_nebula",
        title: "Whispering Nebula",
        type: "anomaly",
        text: "Bizarre static on the comms sounds like voices predicting your next jump. Costs Energy to analyze, but reveals adjacent sector data.",
        options: [
            {
                command: "investigate",
                requiredRoom: "bridge",
                description: "Analyze the whispers (-5 Energy, reveal intel)",
                execute: (ship, player, broadcast) => {
                    ship.energy -= 5;
                    ship.fuel += 10;
                    broadcast("The whispers align into navigational data. Fuel reserves optimized. (+10 Fuel, -5 Energy)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Leave it alone",
                execute: (ship, player, broadcast) => { broadcast("The voices fade into static.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "anomaly_magnetic_monopole",
        title: "Magnetic Monopole",
        type: "anomaly",
        text: "A rare physics anomaly. Catching it with the grabber arm yields immense Credits but risks severe Hull damage.",
        options: [
            {
                command: "investigate",
                requiredRoom: "cargo",
                description: "Grab it (70% chance: +60 Credits, 30% chance: -25 Hull)",
                execute: (ship, player, broadcast) => {
                    if (Math.random() > 0.3) {
                        ship.credits += 60;
                        broadcast("CONTACT! The monopole is secured. Researchers will pay handsomely. (+60 Credits)", COLORS.GREEN);
                    } else {
                        ship.hull -= 25;
                        broadcast("The monopole destabilizes and tears through the cargo bay! (-25 Hull)", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Leave it alone",
                execute: (ship, player, broadcast) => { broadcast("Too risky. You let it drift.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "anomaly_time_dilation_field",
        title: "Time Dilation Field",
        type: "anomaly",
        text: "Time slows down inside the field. You burn extra Energy keeping life support synced, but gain a significant combat advantage.",
        options: [
            {
                command: "investigate",
                requiredRoom: "engineering",
                description: "Enter the field (-15 Energy, reset all cooldowns)",
                execute: (ship, player, broadcast) => {
                    ship.energy -= 15;
                    for (const room in ship.cooldowns) { ship.cooldowns[room] = 0; }
                    broadcast("Time bends around the ship. All systems reset to ready state. (-15 Energy, All CDs cleared)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Leave it alone",
                execute: (ship, player, broadcast) => { broadcast("You skirt the edge of the field. Time resumes normally.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "anomaly_tachyon_burst",
        title: "Tachyon Burst",
        type: "anomaly",
        text: "A sudden surge of faster-than-light particles. Riding the wave fully recharges ship Energy.",
        options: [
            {
                command: "investigate",
                requiredRoom: "bridge",
                description: "Ride the wave (Full Energy recharge)",
                execute: (ship, player, broadcast) => {
                    ship.energy = ship.maxEnergy;
                    broadcast("The tachyon burst floods every capacitor. Energy reserves fully recharged!", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Leave it alone",
                execute: (ship, player, broadcast) => { broadcast("The particles scatter harmlessly into the void.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "anomaly_micro_wormhole",
        title: "Micro-Wormhole",
        type: "anomaly",
        text: "A tiny tear in space. Tossing in Scrap returns a refined item worth Credits, but there's a chance it returns a live explosive.",
        options: [
            {
                command: "investigate",
                requiredRoom: "cargo",
                description: "Toss in 10 Scrap (80%: +50 Credits, 20%: -20 Hull)",
                execute: (ship, player, broadcast) => {
                    if (ship.scrap < 10) {
                        broadcast("Not enough scrap to sacrifice to the wormhole.", COLORS.RED);
                        ship.currentEncounter = null;
                        return;
                    }
                    ship.scrap -= 10;
                    if (Math.random() > 0.2) {
                        ship.credits += 50;
                        broadcast("The wormhole spits back a polished crystal worth 50 Credits! (-10 Scrap)", COLORS.GREEN);
                    } else {
                        ship.hull -= 20;
                        broadcast("It returned a LIVE EXPLOSIVE! The blast rocks the cargo bay! (-10 Scrap, -20 Hull)", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Leave it alone",
                execute: (ship, player, broadcast) => { broadcast("The tear seals itself shut.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "derelict_grave_of_the_leviathan",
        title: "Grave of the Leviathan",
        type: "derelict",
        text: "A massive, ancient alien skeleton floating in space. Its bones hum with residual bio-energy.",
        options: [
            {
                command: "harvest",
                requiredRoom: "cargo",
                description: "Harvest bio-matter (Risk: 40% alien parasite, -20 Hull)",
                execute: (ship, player, broadcast) => {
                    if (Math.random() > 0.4) {
                        ship.scrap += 25;
                        ship.credits += 15;
                        broadcast("Harvested alien bio-composites. Rich material! (+25 Scrap, +15 Credits)", COLORS.GREEN);
                    } else {
                        ship.hull -= 20;
                        ship.fires = (ship.fires || 0) + 1;
                        broadcast("PARASITIC ORGANISMS! They breach the hull and start a fire! (-20 Hull, +1 Fire)", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "scan",
                requiredRoom: "bridge",
                description: "Scan the remains from a safe distance (-5 Energy)",
                execute: (ship, player, broadcast) => {
                    ship.energy -= 5;
                    ship.credits += 20;
                    broadcast("Deep scan data sold to xenobiologists. Safe profit. (-5 Energy, +20 Credits)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "derelict_corpo_blacksite_station",
        title: "Corpo Blacksite Station",
        type: "derelict",
        text: "A heavily shielded, unlisted station. The firewalls are thick, but the data inside is worth a fortune.",
        options: [
            {
                command: "hack",
                requiredRoom: "engineering",
                description: "Brute-force hack (-25 Energy, high reward)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy >= 25) {
                        ship.energy -= 25;
                        ship.credits += 80;
                        broadcast("FIREWALL BREACHED. Downloaded classified schematics worth 80 Credits! (-25 Energy)", COLORS.GREEN);
                    } else {
                        broadcast("ERROR: Insufficient energy to sustain the hack. Need 25 Energy.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "salvage",
                requiredRoom: "cargo",
                description: "Strip exterior panels for safe scrap",
                execute: (ship, player, broadcast) => {
                    ship.scrap += 12;
                    broadcast("Stripped external armor plating. Safe haul. (+12 Scrap)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "derelict_the_flying_dutchman",
        title: "The Flying Dutchman",
        type: "derelict",
        text: "A legendary ghost ship of the sector. Its hull phases in and out of reality. The cargo hold glows with eerie light.",
        options: [
            {
                command: "board",
                requiredRoom: "cargo",
                description: "Board the ghost ship (50%: +100 Credits, 50%: -30 Hull + Fire)",
                execute: (ship, player, broadcast) => {
                    if (Math.random() > 0.5) {
                        ship.credits += 100;
                        broadcast("The spectral cargo hold contains phantom currency that solidifies on touch! (+100 Credits)", COLORS.GREEN);
                    } else {
                        ship.hull -= 30;
                        ship.fires = (ship.fires || 0) + 2;
                        broadcast("THE SHIP PHASES THROUGH YOURS! Massive structural damage and ghostfire! (-30 Hull, +2 Fires)", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Leave the legend alone",
                execute: (ship, player, broadcast) => {
                    broadcast("Wisely, you steer clear. The Dutchman fades into the void.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "derelict_drifting_escape_pod",
        title: "Drifting Escape Pod",
        type: "derelict",
        text: "A cryo-pod with frozen, long-dead occupants. Their personal effects might be valuable... or cursed.",
        options: [
            {
                command: "loot",
                requiredRoom: "cargo",
                description: "Search the bodies (gain Credits, risk: cooldown penalty)",
                execute: (ship, player, broadcast) => {
                    ship.credits += 30;
                    if (Math.random() < 0.3) {
                        for (const room in ship.cooldowns) { ship.cooldowns[room] += 3; }
                        broadcast("Found 30 Credits in personal effects, but a bio-alarm triggered! All cooldowns +3! (+30 Cr)", COLORS.YELLOW);
                    } else {
                        broadcast("Found 30 Credits worth of personal effects. Rest in peace. (+30 Credits)", COLORS.GREEN);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "bury",
                requiredRoom: "bridge",
                description: "Give them a proper space burial (-5 Fuel)",
                execute: (ship, player, broadcast) => {
                    ship.fuel -= 5;
                    ship.hull += 5;
                    broadcast("You fire the pod into the nearest star. The crew feels at peace. Hull micro-fractures seal. (-5 Fuel, +5 Hull)", COLORS.CYAN);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "derelict_automated_factory_barge",
        title: "Automated Factory Barge",
        type: "derelict",
        text: "The factory AI is stuck in a loop, endlessly assembling and then smelting down ship components.",
        options: [
            {
                command: "override",
                requiredRoom: "engineering",
                description: "Overload the smelter (-15 Energy, gain Scrap)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy >= 15) {
                        ship.energy -= 15;
                        ship.scrap += 40;
                        broadcast("Reactor spike forced the smelter to eject its raw reserves! (+40 Scrap, -15 Energy)", COLORS.GREEN);
                    } else {
                        broadcast("Insufficient energy to force an override.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "salvage",
                requiredRoom: "cargo",
                description: "Carefully pick through the conveyor lines",
                execute: (ship, player, broadcast) => {
                    ship.scrap += 15;
                    broadcast("You salvaged active components before they were recycled. (+15 Scrap)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "derelict_pirate_s_stash",
        title: "Pirate's Stash",
        type: "derelict",
        text: "A hollowed-out asteroid containing a pirate loot cache. The encryption is brutal.",
        options: [
            {
                command: "hack",
                requiredRoom: "bridge",
                description: "Crack the vault (-10 Energy, 70% success)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy >= 10) {
                        ship.energy -= 10;
                        if (Math.random() > 0.3) {
                            ship.credits += 60;
                            ship.fuel += 5;
                            broadcast("Vault cracked! Stolen credits and fuel siphoned. (+60 Credits, +5 Fuel)", COLORS.GREEN);
                        } else {
                            broadcast("HACK FAILED. The vault's logic-bomb fried your sensors. (-10 Energy)", COLORS.RED);
                        }
                    } else {
                        broadcast("Not enough energy.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "salvage",
                requiredRoom: "cargo",
                description: "Strip the vault's outer casing for scrap",
                execute: (ship, player, broadcast) => {
                    ship.scrap += 10;
                    broadcast("You take what you can without touching the traps. (+10 Scrap)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "derelict_generation_ship_debris",
        title: "Generation Ship Debris",
        type: "derelict",
        text: "Wreckage from a pre-jump colony ship. Its archives contain centuries of untouched data.",
        options: [
            {
                command: "archive",
                requiredRoom: "bridge",
                description: "Recover historical data (-8 Energy)",
                execute: (ship, player, broadcast) => {
                    ship.energy -= 8;
                    ship.credits += 45;
                    broadcast("Academic guilds will pay a high price for these records. (+45 Credits, -8 Energy)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "salvage",
                requiredRoom: "cargo",
                description: "Strip the ancient hull for scrap",
                execute: (ship, player, broadcast) => {
                    ship.scrap += 20;
                    broadcast("The old alloys are rare and valuable. (+20 Scrap)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "derelict_self_replicating_minefield",
        title: "Self-Replicating Minefield",
        type: "derelict",
        text: "A web of smart-mines surround a cluster of salvageable hulls. They react to movement.",
        options: [
            {
                command: "defuse",
                requiredRoom: "engineering",
                description: "Broadcast a deactivation code (-12 Energy, Risk: 30% -20 Hull)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy >= 12) {
                        ship.energy -= 12;
                        if (Math.random() > 0.3) {
                            ship.scrap += 50;
                            broadcast("Mines powered down. Safe passage to the core salvage! (+50 Scrap, -12 Energy)", COLORS.GREEN);
                        } else {
                            ship.hull -= 20;
                            broadcast("BOOM! A mine detected the hack and detonated! (-20 Hull)", COLORS.RED);
                        }
                    } else {
                        broadcast("Not enough energy.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "bypass",
                requiredRoom: "bridge",
                description: "Navigate through the gaps (-10 Fuel)",
                execute: (ship, player, broadcast) => {
                    ship.fuel -= 10;
                    ship.scrap += 20;
                    broadcast("Precision flying got you in and out. (+20 Scrap, -10 Fuel)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "faction_miner_strike",
        title: "Miner Strike",
        type: "faction",
        text: "Free Miners are blockading a jump gate, protesting corporate fuel prices. They demand a donation to their strike fund.",
        options: [
            {
                command: "donate",
                requiredRoom: "bridge",
                description: "Donate 20 Credits (+Rep, skip blockade)",
                execute: (ship, player, broadcast) => {
                    if (ship.credits >= 20) {
                        ship.credits -= 20;
                        ship.factions.miners += 5;
                        broadcast("The miners clear a path. 'Thanks for the solidarity, pilot.' (+5 Miner Rep, -20 Credits)", COLORS.GREEN);
                    } else {
                        broadcast("You don't have enough credits to support the cause.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "negotiate",
                requiredRoom: "bridge",
                description: "Convince them you're just a tugboat (-10 Energy)",
                execute: (ship, player, broadcast) => {
                    ship.energy -= 10;
                    if (Math.random() > 0.4) {
                        broadcast("Your humble plea works. They let you through out of pity. (-10 Energy)", COLORS.GREEN);
                        ship.currentEncounter = null;
                    } else {
                        broadcast("They don't buy it. 'Look at those upgrades! You're corporate!' Blockade holds.", COLORS.RED);
                    }
                }
            }
        ]
    }
    ,{
        id: "faction_corporate_inspection",
        title: "Corporate Inspection",
        type: "faction",
        text: "A Corpo Sec patrol demands to scan your cargo for 'unauthorized salvage'. Refusing is a crime.",
        options: [
            {
                command: "allow",
                requiredRoom: "cargo",
                description: "Allow scan (50% chance they seize 10 Scrap)",
                execute: (ship, player, broadcast) => {
                    if (Math.random() > 0.5 && ship.scrap >= 10) {
                        ship.scrap -= 10;
                        broadcast("They found 'improperly logged' materials and seized them. (-10 Scrap)", COLORS.YELLOW);
                    } else {
                        broadcast("Scan clean. 'Move along, civilian.'", COLORS.GREEN);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "bribe",
                requiredRoom: "bridge",
                description: "Offer a 'service fee' of 40 Credits",
                execute: (ship, player, broadcast) => {
                    if (ship.credits >= 40) {
                        ship.credits -= 40;
                        broadcast("The inspectors look the other way. 'Have a productive day.' (-40 Credits)", COLORS.GREEN);
                        ship.currentEncounter = null;
                    } else {
                        broadcast("Not enough credits to bribe the patrol.", COLORS.RED);
                    }
                }
            }
        ]
    }
    ,{
        id: "faction_pirate_toll_gate",
        title: "Pirate Toll Gate",
        type: "faction",
        text: "Scrap Pirates have anchored a 'toll station' in the hyperlane. 'Pay 15 Fuel or we open fire.'",
        options: [
            {
                command: "pay",
                requiredRoom: "cargo",
                description: "Eject 15 Fuel (-15 Fuel)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel >= 15) {
                        ship.fuel -= 15;
                        broadcast("You dump the canisters. The pirates move to retrieve them. (+Safe passage)", COLORS.YELLOW);
                        ship.currentEncounter = null;
                    } else {
                        broadcast("You don't have enough fuel to satisfy them!", COLORS.RED);
                    }
                }
            },
            {
                command: "run",
                requiredRoom: "bridge",
                description: "Full burn through the gate (-20 Energy, -5 Fuel, take 10 DMG)",
                execute: (ship, player, broadcast) => {
                    ship.energy -= 20;
                    ship.fuel -= 5;
                    ship.hull -= 10;
                    broadcast("You blast through their net. Hull took minor fire. (-20 Energy, -5 Fuel, -10 Hull)", COLORS.YELLOW);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "faction_pirate_s_challenge",
        title: "Pirate's Challenge",
        type: "faction",
        text: "A pirate captain challenges you to a duel—no weapons, just a ramming contest. Wager 50 Credits.",
        options: [
            {
                command: "accept",
                requiredRoom: "engineering",
                description: "Reinforce hull and RAM! (Risk: 50% win +100c, 50% lose -20 Hull)",
                execute: (ship, player, broadcast) => {
                    if (ship.credits >= 50) {
                        ship.credits -= 50;
                        if (Math.random() > 0.5) {
                            ship.credits += 150;
                            broadcast("BAM! You knocked their engine block clean off! You win the pot! (+100 Credits net)", COLORS.GREEN);
                        } else {
                            ship.hull -= 20;
                            broadcast("CRUNCH. Your bow buckled. They laugh as they take your credits. (-50 Cr, -20 Hull)", COLORS.RED);
                        }
                        ship.currentEncounter = null;
                    } else {
                        broadcast("Not enough credits to wager.", COLORS.RED);
                    }
                }
            },
            {
                command: "decline",
                description: "Ignore the brute",
                execute: (ship, player, broadcast) => {
                    broadcast("They call you a coward over open comms, but let you pass.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "hazard_solar_flare",
        title: "Solar Flare",
        type: "hazard",
        text: "A massive wave of radiation is approaching from the local star. Radiation shields are failing.",
        options: [
            {
                command: "divert",
                requiredRoom: "engineering",
                description: "Divert all reactor output to shielding (-30 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy >= 30) {
                        ship.energy -= 30;
                        broadcast("Shields flare brilliant violet, absorbing the radiation wave. (-30 Energy)", COLORS.GREEN);
                    } else {
                        ship.hull -= 40;
                        broadcast("Insufficient energy! The flare scorches the internals! (-40 Hull)", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "hide",
                requiredRoom: "cargo",
                description: "Use lead-lined cargo pods for shelter (Loss: 10 Scrap)",
                execute: (ship, player, broadcast) => {
                    if (ship.scrap >= 10) {
                        ship.scrap -= 10;
                        ship.hull -= 10;
                        broadcast("The scrap absorbed most of the radiation, but was vaporized. (-10 Scrap, -10 Hull)", COLORS.YELLOW);
                    } else {
                        ship.hull -= 40;
                        broadcast("Not enough scrap to form a shield! You take the full hit. (-40 Hull)", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "hazard_ion_storm",
        title: "Ion Storm",
        type: "hazard",
        text: "Violent electrostatic discharges are playing havoc with the ship's computer.",
        options: [
            {
                command: "ground",
                requiredRoom: "engineering",
                description: "Ground the hull through the cargo bay (Risk: -15 Scrap)",
                execute: (ship, player, broadcast) => {
                    const lost = Math.min(ship.scrap, 15);
                    ship.scrap -= lost;
                    broadcast(`You grounded the discharge. ${lost} scrap was fused by the heat.`, COLORS.YELLOW);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "purge",
                requiredRoom: "bridge",
                description: "Purge main capacitors (-20 Energy)",
                execute: (ship, player, broadcast) => {
                    ship.energy -= 20;
                    broadcast("Capacitors purged. The storm passes without damaging the hull. (-20 Energy)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "hazard_micro_meteoroid_shower",
        title: "Micro-Meteoroid Shower",
        type: "hazard",
        text: "A dense field of tiny rocks pelts the hull like machine-gun fire.",
        options: [
            {
                command: "evade",
                requiredRoom: "bridge",
                description: "Perform high-G maneuvers (-10 Fuel, -5 Energy)",
                execute: (ship, player, broadcast) => {
                    ship.fuel -= 10;
                    ship.energy -= 5;
                    broadcast("You danced through the debris field unscathed. (-10 Fuel, -5 Energy)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "brace",
                requiredRoom: "engineering",
                description: "Full power to structural integrity (Takes 10 DMG, -10 Energy)",
                execute: (ship, player, broadcast) => {
                    ship.hull -= 10;
                    ship.energy -= 10;
                    broadcast("The hull groans as it takes the hits, but stays intact. (-10 Hull, -10 Energy)", COLORS.YELLOW);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "hazard_corrosive_gas_nebula",
        title: "Corrosive Gas Nebula",
        type: "hazard",
        text: "The nebula is filled with caustic gasses that eat away at hull plating.",
        options: [
            {
                command: "vent",
                requiredRoom: "engineering",
                description: "Vent atmosphere to blow gas away (-10 Fuel, -10 Energy)",
                execute: (ship, player, broadcast) => {
                    ship.fuel -= 10;
                    ship.energy -= 10;
                    broadcast("You blew the gas clear. Hull preserved. (-10 Fuel, -10 Energy)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Take the corrosion (-20 Hull)",
                execute: (ship, player, broadcast) => {
                    ship.hull -= 20;
                    broadcast("The gas pits the armor. Warning: Hull integrity compromised. (-20 Hull)", COLORS.RED);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "hazard_gravity_well",
        title: "Gravity Well",
        type: "hazard",
        text: "A rogue singularity is dragging the ship toward the event horizon. Engines are screaming.",
        options: [
            {
                command: "burn",
                requiredRoom: "engineering",
                description: "Melt the core for emergency thrust (-25 Fuel)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel >= 25) {
                        ship.fuel -= 25;
                        broadcast("Emergency burn successful. You escaped the well. (-25 Fuel)", COLORS.GREEN);
                        ship.currentEncounter = null;
                    } else {
                        broadcast("Not enough fuel to escape! Gravity tears at the hull.", COLORS.RED);
                        ship.hull -= 30;
                        ship.currentEncounter = null;
                    }
                }
            },
            {
                command: "slingshot",
                requiredRoom: "bridge",
                description: "Attempt a risky orbital slingshot (-15 Energy, 50% success)",
                execute: (ship, player, broadcast) => {
                    ship.energy -= 15;
                    if (Math.random() > 0.5) {
                        ship.fuel += 10;
                        broadcast("PERFECT CALCULATION. You gained momentum! (+10 Fuel, -15 Energy)", COLORS.GREEN);
                        ship.currentEncounter = null;
                    } else {
                        ship.hull -= 25;
                        broadcast("Calculations were off. You grazed the horizon. (-25 Hull, -15 Energy)", COLORS.RED);
                        ship.currentEncounter = null;
                    }
                }
            }
        ]
    }
    ,{
        id: "hazard_space_flora",
        title: "Space Flora",
        type: "hazard",
        text: "Giant, bio-luminescent spores have attached to the hull and are draining power.",
        options: [
            {
                command: "shock",
                requiredRoom: "engineering",
                description: "Electrify the hull (-20 Energy)",
                execute: (ship, player, broadcast) => {
                    ship.energy -= 20;
                    broadcast("The spores shrivel and drop off. Energy drain stopped. (-20 Energy)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "scrap",
                requiredRoom: "cargo",
                description: "Scrape them off with the grabber arm (-10 Hull)",
                execute: (ship, player, broadcast) => {
                    ship.hull -= 10;
                    broadcast("Spore pods crushed, but the bloom damaged the hull. (-10 Hull)", COLORS.YELLOW);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "hazard_emp_burst",
        title: "EMP Burst",
        type: "hazard",
        text: "A natural pulsar discharge is about to hit. It will fry your capacitors.",
        options: [
            {
                command: "ground",
                requiredRoom: "engineering",
                description: "Ground systems through the scrap hold (Cost: 15 Scrap)",
                execute: (ship, player, broadcast) => {
                    if (ship.scrap >= 15) {
                        ship.scrap -= 15;
                        broadcast("The electrical surge was absorbed by the scrap pile. (-15 Scrap)", COLORS.GREEN);
                        ship.currentEncounter = null;
                    } else {
                        ship.energy = 0;
                        broadcast("Not enough scrap! Capactiors fried! (Energy reset to 0)", COLORS.RED);
                        ship.currentEncounter = null;
                    }
                }
            },
            {
                command: "brace",
                requiredRoom: "bridge",
                description: "Shut down non-essential systems (-10 Energy)",
                execute: (ship, player, broadcast) => {
                    ship.energy -= 10;
                    if (Math.random() > 0.3) {
                         broadcast("Systems rebooted safely after the pulse. (-10 Energy)", COLORS.GREEN);
                    } else {
                        ship.energy = 0;
                        broadcast("Reboot failed! The pulse caught your systems active! (Energy reset to 0)", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "distress_the_hitchhiker",
        title: "The Hitchhiker",
        type: "distress",
        text: "A lone survivor in a cryo-pod. They claim to be a master engineer.",
        options: [
            {
                command: "rescue",
                requiredRoom: "cargo",
                description: "Bring them aboard (-10 Energy)",
                execute: (ship, player, broadcast) => {
                    ship.energy -= 10;
                    ship.hull = Math.min(ship.maxHull || 100, (ship.hull !== undefined ? ship.hull : 100) + 20);
                    broadcast("The survivor fixed your main couplings! (+20 Hull, -10 Energy)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Leave them to the void",
                execute: (ship, player, broadcast) => {
                    broadcast("You leave the pod behind. Silent guilt follows.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "distress_stranded_diplomat",
        title: "Stranded Diplomat",
        type: "distress",
        text: "A luxury shuttle is losing air. The occupant is a high-ranking Corpo VIP.",
        options: [
            {
                command: "rescue",
                requiredRoom: "cargo",
                description: "High-priority rescue (-15 Fuel)",
                execute: (ship, player, broadcast) => {
                    ship.fuel -= 15;
                    ship.credits += 100;
                    broadcast("A hefty reward was wired to your account! (+100 Credits, -15 Fuel)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ransack",
                requiredRoom: "weapons",
                description: "Loot the shuttle and leave (30 Scrap)",
                execute: (ship, player, broadcast) => {
                    ship.scrap += 30;
                    broadcast("You took the valuables and left the VIP. Cold-blooded. (+30 Scrap)", COLORS.YELLOW);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "distress_medical_emergency",
        title: "Medical Emergency",
        type: "distress",
        text: "A colony ship has a plague outbreak. They need specialized radiation-stabilized scrap for repairs.",
        options: [
            {
                command: "donate",
                requiredRoom: "cargo",
                description: "Donate 25 Scrap (+Rep, -25 Scrap)",
                execute: (ship, player, broadcast) => {
                    if (ship.scrap >= 25) {
                        ship.scrap -= 25;
                        ship.credits += 30;
                        broadcast("The colony ship survives. A symbol of gratitude was given. (+30 Credits, -25 Scrap)", COLORS.GREEN);
                    } else {
                        broadcast("You don't have enough scrap to help.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Too dangerous to dock",
                execute: (ship, player, broadcast) => {
                    broadcast("You avoid the contaminated ship.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "distress_the_saboteur",
        title: "The Saboteur",
        type: "distress",
        text: "You found a 'distress' beacon that was actually a trap! A stowaway has disabled your jump drive.",
        options: [
            {
                command: "flush",
                requiredRoom: "engineering",
                description: "Flush the airlocks (-15 Energy, -5 Fuel)",
                execute: (ship, player, broadcast) => {
                    ship.energy -= 15;
                    ship.fuel -= 5;
                    broadcast("Saboteur ejected! Systems restored to jump capacity. (-15 Energy, -5 Fuel)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "bribe",
                requiredRoom: "bridge",
                description: "Offer 30 Credits to stop",
                execute: (ship, player, broadcast) => {
                    if (ship.credits >= 30) {
                        ship.credits -= 30;
                        broadcast("They took the money and escaped in a pod. (-30 Credits)", COLORS.YELLOW);
                        ship.currentEncounter = null;
                    } else {
                        broadcast("They don't take empty promises.", COLORS.RED);
                    }
                }
            }
        ]
    }
    ,{
        id: "distress_stowaway_fauna",
        title: "Stowaway Fauna",
        type: "distress",
        text: "A swarm of 'Hull-Hoppers' has attached to your ship. They are eating the wiring.",
        options: [
            {
                command: "vent",
                requiredRoom: "engineering",
                description: "Vent the bulkheads (-20 Energy)",
                execute: (ship, player, broadcast) => {
                    ship.energy -= 20;
                    broadcast("The critters were blown into space. Damage stopped. (-20 Energy)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "trap",
                requiredRoom: "cargo",
                description: "Use 10 Scrap as bait to trap them",
                execute: (ship, player, broadcast) => {
                    if (ship.scrap >= 10) {
                        ship.scrap -= 10;
                        ship.credits += 25;
                        broadcast("Trapped and sold to a collector. (+25 Credits, -10 Scrap)", COLORS.GREEN);
                        ship.currentEncounter = null;
                    } else {
                        broadcast("Not enough scrap for bait!", COLORS.RED);
                    }
                }
            }
        ]
    }
    ,{
        id: "distress_cultist_caravan",
        title: "Cultist Caravan",
        type: "distress",
        text: "A ship of the 'Order of the Void' asks for a fuel donation to reach the Great Rift.",
        options: [
            {
                command: "donate",
                requiredRoom: "cargo",
                description: "Donate 15 Fuel (-15 Fuel)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel >= 15) {
                        ship.fuel -= 15;
                        ship.hull = Math.min(ship.maxHull || 100, (ship.hull !== undefined ? ship.hull : 100) + 40);
                        broadcast("They bless your ship. Hull plates glow with peace. (+40 Hull, -15 Fuel)", COLORS.GREEN);
                    } else {
                        broadcast("Not enough fuel.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Keep your fuel",
                execute: (ship, player, broadcast) => {
                    broadcast("The cultists chant is lost in the static.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "distress_ai_core_transfer",
        title: "AI Core Transfer",
        type: "distress",
        text: "A damaged military core needs an emergency upload to survive. It will take up ship CPU.",
        options: [
            {
                command: "upload",
                requiredRoom: "bridge",
                description: "Accept the upload (Permanent -5 Energy Regen, +10 Weapon DMG)",
                execute: (ship, player, broadcast) => {
                    ship.energyRegen = (ship.energyRegen || 0) - 0.2; // 0.2 units per tick is significant
                    ship.dmgFlat = (ship.dmgFlat || 0) + 10;
                    broadcast("The AI integrates. Power draw is high, but aim is lethal. (-Regen, +10 DMG)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "wipe",
                requiredRoom: "engineering",
                description: "Wipe for scrap (30 Scrap)",
                execute: (ship, player, broadcast) => {
                    ship.scrap += 30;
                    broadcast("Core purged. Raw materials recovered. (+30 Scrap)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "distress_phantom_signal",
        title: "Phantom Signal",
        type: "distress",
        text: "A signal that sounds like your own ship's distress call... from the future.",
        options: [
            {
                command: "analyze",
                requiredRoom: "bridge",
                description: "Analyze the signal (-10 Energy, +Rep)",
                execute: (ship, player, broadcast) => {
                    ship.energy -= 10;
                    ship.credits += 50;
                    broadcast("Navigational anomalies identified. Data sold for 50 Credits! (-10 Energy)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Tear down the antenna",
                execute: (ship, player, broadcast) => {
                    broadcast("You refuse to hear your own ghost.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "distress_the_old_captain",
        title: "The Old Captain",
        type: "distress",
        text: "An ancient tugboat captain is drifting in a suit. He offers wisdom for a ride to the next station.",
        options: [
            {
                command: "welcome",
                requiredRoom: "cargo",
                description: "Welcome aboard (-10 Fuel)",
                execute: (ship, player, broadcast) => {
                    ship.fuel -= 10;
                    // Reducing jump cost isn't trivial to implement here without changing jump command, 
                    // so we'll give a huge fuel reserve instead.
                    ship.fuel += 40;
                    broadcast("The Captain shows you fuel-efficient routes! (+40 Fuel net gain 30)", COLORS.GREEN);
                    ship.currentEncounter = null;
                }
            },
            {
                command: "refuse",
                description: "No room for passengers",
                execute: (ship, player, broadcast) => {
                    broadcast("The old man's signal fades into the distance.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
];

// Helper to get a random event
function getRandomEvent() {
    return GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
}


export { GAME_EVENTS, getRandomEvent, COLORS, SYMBOLS, SECTOR_FLAVOR, ROOM_DESCRIPTIONS };
