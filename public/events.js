
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
        text: "A massive, ancient alien skeleton floating in space. Mining it yields strange biological `Scrap`.",
        options: [
            {
                command: "salvage",
                requiredRoom: "cargo",
                description: "Tear it down for scrap (-10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy.current >= 10) {
                        ship.energy.current -= 10;
                        const scrap = Math.floor(Math.random() * 15) + 5;
                        ship.scrap += scrap;
                        broadcast("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
                    } else {
                        broadcast("Not enough energy.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Pass by",
                execute: (ship, player, broadcast) => { broadcast("Passed by.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "derelict_corpo_blacksite_station",
        title: "Corpo Blacksite Station",
        type: "derelict",
        text: "A heavily shielded, unlisted station. Hacking it requires massive `Energy` but offers high-tier tech (`Credits`/`Scrap`).",
        options: [
            {
                command: "salvage",
                requiredRoom: "cargo",
                description: "Tear it down for scrap (-10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy.current >= 10) {
                        ship.energy.current -= 10;
                        const scrap = Math.floor(Math.random() * 15) + 5;
                        ship.scrap += scrap;
                        broadcast("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
                    } else {
                        broadcast("Not enough energy.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Pass by",
                execute: (ship, player, broadcast) => { broadcast("Passed by.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "derelict_the_flying_dutchman",
        title: "The Flying Dutchman",
        type: "derelict",
        text: "A legendary ghost ship of the sector. Leaving it alone is safe; attacking it curses your `Energy` regeneration for 3 jumps.",
        options: [
            {
                command: "salvage",
                requiredRoom: "cargo",
                description: "Tear it down for scrap (-10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy.current >= 10) {
                        ship.energy.current -= 10;
                        const scrap = Math.floor(Math.random() * 15) + 5;
                        ship.scrap += scrap;
                        broadcast("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
                    } else {
                        broadcast("Not enough energy.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Pass by",
                execute: (ship, player, broadcast) => { broadcast("Passed by.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "derelict_drifting_escape_pod",
        title: "Drifting Escape Pod",
        type: "derelict",
        text: "A pod with frozen, long-dead occupants. Salvaging it feels wrong, but yields `Scrap`. (Miners reputation decreases if seen).",
        options: [
            {
                command: "salvage",
                requiredRoom: "cargo",
                description: "Tear it down for scrap (-10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy.current >= 10) {
                        ship.energy.current -= 10;
                        const scrap = Math.floor(Math.random() * 15) + 5;
                        ship.scrap += scrap;
                        broadcast("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
                    } else {
                        broadcast("Not enough energy.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Pass by",
                execute: (ship, player, broadcast) => { broadcast("Passed by.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "derelict_automated_factory_barge",
        title: "Automated Factory Barge",
        type: "derelict",
        text: "Still producing goods despite lacking a crew. You can dock to trade `Scrap` for `Fuel`.",
        options: [
            {
                command: "salvage",
                requiredRoom: "cargo",
                description: "Tear it down for scrap (-10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy.current >= 10) {
                        ship.energy.current -= 10;
                        const scrap = Math.floor(Math.random() * 15) + 5;
                        ship.scrap += scrap;
                        broadcast("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
                    } else {
                        broadcast("Not enough energy.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Pass by",
                execute: (ship, player, broadcast) => { broadcast("Passed by.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "derelict_pirate_s_stash",
        title: "Pirate's Stash",
        type: "derelict",
        text: "A hollowed-out asteroid containing a pirate loot cache. Taking it grants `Credits` and `Fuel`, but decreases Pirate reputation drastically.",
        options: [
            {
                command: "salvage",
                requiredRoom: "cargo",
                description: "Tear it down for scrap (-10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy.current >= 10) {
                        ship.energy.current -= 10;
                        const scrap = Math.floor(Math.random() * 15) + 5;
                        ship.scrap += scrap;
                        broadcast("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
                    } else {
                        broadcast("Not enough energy.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Pass by",
                execute: (ship, player, broadcast) => { broadcast("Passed by.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "derelict_generation_ship_debris",
        title: "Generation Ship Debris",
        type: "derelict",
        text: "Wreckage from an ancient colonization attempt. Careful salvage yields historical artifacts (`Credits`).",
        options: [
            {
                command: "salvage",
                requiredRoom: "cargo",
                description: "Tear it down for scrap (-10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy.current >= 10) {
                        ship.energy.current -= 10;
                        const scrap = Math.floor(Math.random() * 15) + 5;
                        ship.scrap += scrap;
                        broadcast("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
                    } else {
                        broadcast("Not enough energy.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Pass by",
                execute: (ship, player, broadcast) => { broadcast("Passed by.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "derelict_self_replicating_minefield",
        title: "Self-Replicating Minefield",
        type: "derelict",
        text: "An old war zone where derelicts are surrounded by mines. High risk of `Hull` damage, but high `Scrap` reward.",
        options: [
            {
                command: "salvage",
                requiredRoom: "cargo",
                description: "Tear it down for scrap (-10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.energy.current >= 10) {
                        ship.energy.current -= 10;
                        const scrap = Math.floor(Math.random() * 15) + 5;
                        ship.scrap += scrap;
                        broadcast("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
                    } else {
                        broadcast("Not enough energy.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Pass by",
                execute: (ship, player, broadcast) => { broadcast("Passed by.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "faction_miner_strike",
        title: "Miner Strike",
        type: "faction",
        text: "Free Miners are blockading a jump gate. Paying a toll in `Credits` passes safely; attacking them ruins reputation.",
        options: [
            {
                command: "hail",
                requiredRoom: "bridge",
                description: "Hail them on comms",
                execute: (ship, player, broadcast) => {
                    broadcast("They ignore your hail and jump away.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "faction_corporate_inspection",
        title: "Corporate Inspection",
        type: "faction",
        text: "A Corpo Sec patrol demands to scan your cargo for contraband. Compliance is safe; refusal initiates difficult combat.",
        options: [
            {
                command: "hail",
                requiredRoom: "bridge",
                description: "Hail them on comms",
                execute: (ship, player, broadcast) => {
                    broadcast("They ignore your hail and jump away.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "faction_pirate_toll_gate",
        title: "Pirate Toll Gate",
        type: "faction",
        text: "Scrap Pirates demand a portion of your `Fuel` to let you pass. ",
        options: [
            {
                command: "hail",
                requiredRoom: "bridge",
                description: "Hail them on comms",
                execute: (ship, player, broadcast) => {
                    broadcast("They ignore your hail and jump away.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "faction_miner_distress",
        title: "Miner Distress",
        type: "faction",
        text: "A Miner skiff is under attack by space fauna. Helping them costs `Energy` but boosts Miner reputation significantly.",
        options: [
            {
                command: "hail",
                requiredRoom: "bridge",
                description: "Hail them on comms",
                execute: (ship, player, broadcast) => {
                    broadcast("They ignore your hail and jump away.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "faction_corporate_bidding_war",
        title: "Corporate Bidding War",
        type: "faction",
        text: "Two Corpo ships are fighting over a salvage claim. You can steal the salvage while they fight, angering both.",
        options: [
            {
                command: "hail",
                requiredRoom: "bridge",
                description: "Hail them on comms",
                execute: (ship, player, broadcast) => {
                    broadcast("They ignore your hail and jump away.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "faction_pirate_recruitment",
        title: "Pirate Recruitment",
        type: "faction",
        text: "A pirate captain offers you a lucrative sum of `Credits` to disable a nearby tracking buoy. Lowers Corpo reputation.",
        options: [
            {
                command: "hail",
                requiredRoom: "bridge",
                description: "Hail them on comms",
                execute: (ship, player, broadcast) => {
                    broadcast("They ignore your hail and jump away.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "faction_faction_skirmish",
        title: "Faction Skirmish",
        type: "faction",
        text: "Miners and Pirates are actively interlocked in battle. You can pick a side, or salvage the destroyed ships while dodging crossfire.",
        options: [
            {
                command: "hail",
                requiredRoom: "bridge",
                description: "Hail them on comms",
                execute: (ship, player, broadcast) => {
                    broadcast("They ignore your hail and jump away.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "faction_corpo_vip_escort",
        title: "Corpo VIP Escort",
        type: "faction",
        text: "A damaged Corpo yacht needs a tow. Costs `Fuel`, but rewards massive `Credits` and Corpo reputation.",
        options: [
            {
                command: "hail",
                requiredRoom: "bridge",
                description: "Hail them on comms",
                execute: (ship, player, broadcast) => {
                    broadcast("They ignore your hail and jump away.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "faction_traitorous_miner",
        title: "Traitorous Miner",
        type: "faction",
        text: "A Free Miner offers to sell you stolen Corpo schematics for cheap. Buying them lowers Corpo rep if discovered.",
        options: [
            {
                command: "hail",
                requiredRoom: "bridge",
                description: "Hail them on comms",
                execute: (ship, player, broadcast) => {
                    broadcast("They ignore your hail and jump away.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "faction_pirate_s_challenge",
        title: "Pirate's Challenge",
        type: "faction",
        text: "A pirate challenges you to a duel—no weapons, just a ramming contest. Wager `Credits`. Winner takes all.",
        options: [
            {
                command: "hail",
                requiredRoom: "bridge",
                description: "Hail them on comms",
                execute: (ship, player, broadcast) => {
                    broadcast("They ignore your hail and jump away.", COLORS.GRAY);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "hazard_solar_flare",
        title: "Solar Flare",
        type: "hazard",
        text: "A massive wave of radiation is approaching. You must spend `Energy` to reinforce shields, or suffer massive `Hull` damage.",
        options: [
            {
                command: "evade",
                requiredRoom: "bridge",
                description: "Burn fuel to evade (-15 Fuel)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 15) {
                        ship.fuel.current -= 15;
                        broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
                    } else {
                        ship.hull.current -= 20;
                        broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "brace",
                requiredRoom: "engineering",
                description: "Take the hit (-20 Hull)",
                execute: (ship, player, broadcast) => {
                    ship.hull.current -= 20;
                    broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "hazard_ion_storm",
        title: "Ion Storm",
        type: "hazard",
        text: "Violent electrostatic discharges disable your weapons systems for the next encounter.",
        options: [
            {
                command: "evade",
                requiredRoom: "bridge",
                description: "Burn fuel to evade (-15 Fuel)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 15) {
                        ship.fuel.current -= 15;
                        broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
                    } else {
                        ship.hull.current -= 20;
                        broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "brace",
                requiredRoom: "engineering",
                description: "Take the hit (-20 Hull)",
                execute: (ship, player, broadcast) => {
                    ship.hull.current -= 20;
                    broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "hazard_micro_meteoroid_shower",
        title: "Micro-Meteoroid Shower",
        type: "hazard",
        text: "A dense field of tiny rocks pelts the hull. Small `Hull` damage is unavoidable, unless you burn `Fuel` to dodge.",
        options: [
            {
                command: "evade",
                requiredRoom: "bridge",
                description: "Burn fuel to evade (-15 Fuel)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 15) {
                        ship.fuel.current -= 15;
                        broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
                    } else {
                        ship.hull.current -= 20;
                        broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "brace",
                requiredRoom: "engineering",
                description: "Take the hit (-20 Hull)",
                execute: (ship, player, broadcast) => {
                    ship.hull.current -= 20;
                    broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "hazard_corrosive_gas_cloud",
        title: "Corrosive Gas Cloud",
        type: "hazard",
        text: "Flying through this nebula eats away at your armor. Loose 1 `Hull` every action you take until you jump.",
        options: [
            {
                command: "evade",
                requiredRoom: "bridge",
                description: "Burn fuel to evade (-15 Fuel)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 15) {
                        ship.fuel.current -= 15;
                        broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
                    } else {
                        ship.hull.current -= 20;
                        broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "brace",
                requiredRoom: "engineering",
                description: "Take the hit (-20 Hull)",
                execute: (ship, player, broadcast) => {
                    ship.hull.current -= 20;
                    broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "hazard_gravity_well",
        title: "Gravity Well",
        type: "hazard",
        text: "A rogue black hole or dense dwarf star pulls you in. Requires extra `Fuel` to jump away.",
        options: [
            {
                command: "evade",
                requiredRoom: "bridge",
                description: "Burn fuel to evade (-15 Fuel)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 15) {
                        ship.fuel.current -= 15;
                        broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
                    } else {
                        ship.hull.current -= 20;
                        broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "brace",
                requiredRoom: "engineering",
                description: "Take the hit (-20 Hull)",
                execute: (ship, player, broadcast) => {
                    ship.hull.current -= 20;
                    broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "hazard_space_flora",
        title: "Space Flora",
        type: "hazard",
        text: "Giant, aggressive vines latch onto your ship. You must use 'attack' to cut them off before they drain your `Energy`.",
        options: [
            {
                command: "evade",
                requiredRoom: "bridge",
                description: "Burn fuel to evade (-15 Fuel)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 15) {
                        ship.fuel.current -= 15;
                        broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
                    } else {
                        ship.hull.current -= 20;
                        broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "brace",
                requiredRoom: "engineering",
                description: "Take the hit (-20 Hull)",
                execute: (ship, player, broadcast) => {
                    ship.hull.current -= 20;
                    broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "hazard_emp_burst",
        title: "EMP Burst",
        type: "hazard",
        text: "A localized electromagnetic pulse drains your `Energy` to 0. You are vulnerable until it regenerates.",
        options: [
            {
                command: "evade",
                requiredRoom: "bridge",
                description: "Burn fuel to evade (-15 Fuel)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 15) {
                        ship.fuel.current -= 15;
                        broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
                    } else {
                        ship.hull.current -= 20;
                        broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "brace",
                requiredRoom: "engineering",
                description: "Take the hit (-20 Hull)",
                execute: (ship, player, broadcast) => {
                    ship.hull.current -= 20;
                    broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "hazard_thermal_vent__asteroid_",
        title: "Thermal Vent (Asteroid)",
        type: "hazard",
        text: "An asteroid you are navigating violently outgasses. Roll to see if it aids your jump (free `Fuel`) or damages you.",
        options: [
            {
                command: "evade",
                requiredRoom: "bridge",
                description: "Burn fuel to evade (-15 Fuel)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 15) {
                        ship.fuel.current -= 15;
                        broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
                    } else {
                        ship.hull.current -= 20;
                        broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "brace",
                requiredRoom: "engineering",
                description: "Take the hit (-20 Hull)",
                execute: (ship, player, broadcast) => {
                    ship.hull.current -= 20;
                    broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "hazard_radiation_pocket",
        title: "Radiation Pocket",
        type: "hazard",
        text: "Your Max `Hull` is temporarily reduced by 20% due to material degradation until you repair at a station.",
        options: [
            {
                command: "evade",
                requiredRoom: "bridge",
                description: "Burn fuel to evade (-15 Fuel)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 15) {
                        ship.fuel.current -= 15;
                        broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
                    } else {
                        ship.hull.current -= 20;
                        broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "brace",
                requiredRoom: "engineering",
                description: "Take the hit (-20 Hull)",
                execute: (ship, player, broadcast) => {
                    ship.hull.current -= 20;
                    broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "hazard_navigational_deadzone",
        title: "Navigational Deadzone",
        type: "hazard",
        text: "Sensors are completely blinded. You cannot see the stats or type of your next encounter until you engage it.",
        options: [
            {
                command: "evade",
                requiredRoom: "bridge",
                description: "Burn fuel to evade (-15 Fuel)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 15) {
                        ship.fuel.current -= 15;
                        broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
                    } else {
                        ship.hull.current -= 20;
                        broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "brace",
                requiredRoom: "engineering",
                description: "Take the hit (-20 Hull)",
                execute: (ship, player, broadcast) => {
                    ship.hull.current -= 20;
                    broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
                    ship.currentEncounter = null;
                }
            }
        ]
    }
    ,{
        id: "distress_the_hitchhiker",
        title: "The Hitchhiker",
        type: "distress",
        text: "A lone astronaut floats in a standard suit. Taking them aboard costs `Energy` for life support, but they might be a skilled mechanic (repairs `Hull`).",
        options: [
            {
                command: "assist",
                requiredRoom: "engineering",
                description: "Provide assistance (-10 Fuel, -10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
                        ship.fuel.current -= 10;
                        ship.energy.current -= 10;
                        ship.credits += 50;
                        broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
                    } else {
                        broadcast("You lack the resources to assist.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Ignore distress call",
                execute: (ship, player, broadcast) => { broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "distress_stranded_diplomat",
        title: "Stranded Diplomat",
        type: "distress",
        text: "A high-ranking official needs transport. High `Credits` reward, but you will be hunted by Pirates for the next 3 jumps.",
        options: [
            {
                command: "assist",
                requiredRoom: "engineering",
                description: "Provide assistance (-10 Fuel, -10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
                        ship.fuel.current -= 10;
                        ship.energy.current -= 10;
                        ship.credits += 50;
                        broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
                    } else {
                        broadcast("You lack the resources to assist.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Ignore distress call",
                execute: (ship, player, broadcast) => { broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "distress_medical_emergency",
        title: "Medical Emergency",
        type: "distress",
        text: "A nearby station needs medical supplies immediately. Giving up your medbay reserves (permanently lowers Max `Hull` by 5) gives huge Rep across all factions.",
        options: [
            {
                command: "assist",
                requiredRoom: "engineering",
                description: "Provide assistance (-10 Fuel, -10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
                        ship.fuel.current -= 10;
                        ship.energy.current -= 10;
                        ship.credits += 50;
                        broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
                    } else {
                        broadcast("You lack the resources to assist.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Ignore distress call",
                execute: (ship, player, broadcast) => { broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "distress_the_saboteur",
        title: "The Saboteur",
        type: "distress",
        text: "You rescue a stranded engineer, but they start secretly draining your `Fuel` every turn. You must spend a turn to 'eject' them.",
        options: [
            {
                command: "assist",
                requiredRoom: "engineering",
                description: "Provide assistance (-10 Fuel, -10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
                        ship.fuel.current -= 10;
                        ship.energy.current -= 10;
                        ship.credits += 50;
                        broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
                    } else {
                        broadcast("You lack the resources to assist.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Ignore distress call",
                execute: (ship, player, broadcast) => { broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "distress_stowaway_fauna",
        title: "Stowaway Fauna",
        type: "distress",
        text: "A cute alien creature boards your ship. It consumes 1 `Scrap` per turn, but occasionally produces 1 `Energy`.",
        options: [
            {
                command: "assist",
                requiredRoom: "engineering",
                description: "Provide assistance (-10 Fuel, -10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
                        ship.fuel.current -= 10;
                        ship.energy.current -= 10;
                        ship.credits += 50;
                        broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
                    } else {
                        broadcast("You lack the resources to assist.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Ignore distress call",
                execute: (ship, player, broadcast) => { broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "distress_cultist_caravan",
        title: "Cultist Caravan",
        type: "distress",
        text: "A group of robed figures asks you to tow them into the heart of a dangerous anomaly. High risk, unknown bizarre reward.",
        options: [
            {
                command: "assist",
                requiredRoom: "engineering",
                description: "Provide assistance (-10 Fuel, -10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
                        ship.fuel.current -= 10;
                        ship.energy.current -= 10;
                        ship.credits += 50;
                        broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
                    } else {
                        broadcast("You lack the resources to assist.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Ignore distress call",
                execute: (ship, player, broadcast) => { broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "distress_ai_core_transfer",
        title: "AI Core Transfer",
        type: "distress",
        text: "An unstable AI begs to be downloaded into your ship's mainframe to escape Corpo Sec. Doing so boosts your 'attack' damage but risks random command misfires.",
        options: [
            {
                command: "assist",
                requiredRoom: "engineering",
                description: "Provide assistance (-10 Fuel, -10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
                        ship.fuel.current -= 10;
                        ship.energy.current -= 10;
                        ship.credits += 50;
                        broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
                    } else {
                        broadcast("You lack the resources to assist.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Ignore distress call",
                execute: (ship, player, broadcast) => { broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "distress_phantom_signal",
        title: "Phantom Signal",
        type: "distress",
        text: "A distress call that repeats perfectly every 3 seconds. It's a trap set by automated defense drones. (Forced Combat).",
        options: [
            {
                command: "assist",
                requiredRoom: "engineering",
                description: "Provide assistance (-10 Fuel, -10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
                        ship.fuel.current -= 10;
                        ship.energy.current -= 10;
                        ship.credits += 50;
                        broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
                    } else {
                        broadcast("You lack the resources to assist.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Ignore distress call",
                execute: (ship, player, broadcast) => { broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
    ,{
        id: "distress_the_old_captain",
        title: "The Old Captain",
        type: "distress",
        text: "You find a lifepod containing a retired tugboat captain. They teach you a secret maneuver, permanently reducing the `Fuel` cost of jumps to 8.",
        options: [
            {
                command: "assist",
                requiredRoom: "engineering",
                description: "Provide assistance (-10 Fuel, -10 Energy)",
                execute: (ship, player, broadcast) => {
                    if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
                        ship.fuel.current -= 10;
                        ship.energy.current -= 10;
                        ship.credits += 50;
                        broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
                    } else {
                        broadcast("You lack the resources to assist.", COLORS.RED);
                    }
                    ship.currentEncounter = null;
                }
            },
            {
                command: "ignore",
                description: "Ignore distress call",
                execute: (ship, player, broadcast) => { broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY); ship.currentEncounter = null; }
            }
        ]
    }
];

// Helper to get a random event
function getRandomEvent() {
    return GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
}


export { GAME_EVENTS, getRandomEvent, COLORS, SYMBOLS, SECTOR_FLAVOR, ROOM_DESCRIPTIONS };
