const fs = require('fs');

const mdPath = 'c:\\Users\\migue\\.gemini\\antigravity\\brain\\ea96a12b-0c47-479c-9ea8-3dfe59c22bf7\\events_list.md';
const jsPath = 'c:\\Users\\migue\\Desktop\\Just In Time\\events.js';

let text = fs.readFileSync(mdPath, 'utf8');
let jsText = fs.readFileSync(jsPath, 'utf8');

let insertIndex = jsText.lastIndexOf('];');

if (insertIndex === -1) {
    console.error("Could not find end of GAME_EVENTS array.");
    process.exit(1);
}

const lines = text.split('\n');
let currentType = 'anomaly';
const generatedEvents = [];

for (const line of lines) {
    if (line.startsWith('## ')) {
        const header = line.replace('## ', '').trim();
        if (header.includes('Anomalies')) currentType = 'anomaly';
        else if (header.includes('Derelicts')) currentType = 'derelict';
        else if (header.includes('Faction')) currentType = 'faction';
        else if (header.includes('Hazards')) currentType = 'hazard';
        else if (header.includes('Distress')) currentType = 'distress';
        continue;
    }
    
    const match = line.match(/^\d+\.\s+\*\*(.*?)\*\*\:\s+(.*)/);
    if (match) {
        const title = match[1];
        const desc = match[2].replace(/"/g, '\\"');
        
        if (jsText.includes(`title: "${title}"`)) {
            continue;
        }

        const id = `${currentType}_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

        let optionsCode = '';
        if (currentType === 'anomaly') {
            optionsCode = `
            {
                command: "investigate",
                description: "Investigate the anomaly (-5 Energy)",
                execute: (scene) => {
                    scene.gameState.energy.current -= 5;
                    const res = Math.random();
                    if (res > 0.5) {
                        scene.gameState.credits += 20;
                        scene.logMessage("You recovered strange data worth 20 Cr.", COLORS.GREEN);
                    } else {
                        scene.logMessage("The anomaly dissipates harmlessly.", COLORS.GRAY);
                    }
                    scene.clearEvent();
                }
            },
            {
                command: "ignore",
                description: "Leave it alone",
                execute: (scene) => { scene.logMessage("Ignored.", COLORS.GRAY); scene.clearEvent(); }
            }`;
        } else if (currentType === 'derelict') {
            optionsCode = `
            {
                command: "salvage",
                description: "Tear it down for scrap (-10 Energy)",
                execute: (scene) => {
                    if (scene.gameState.energy.current >= 10) {
                        scene.gameState.energy.current -= 10;
                        const scrap = Math.floor(Math.random() * 15) + 5;
                        scene.gameState.scrap += scrap;
                        scene.logMessage("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
                    } else {
                        scene.logMessage("Not enough energy.", COLORS.RED);
                    }
                    scene.clearEvent();
                }
            },
            {
                command: "ignore",
                description: "Pass by",
                execute: (scene) => { scene.logMessage("Passed by.", COLORS.GRAY); scene.clearEvent(); }
            }`;
        } else if (currentType === 'faction') {
            optionsCode = `
            {
                command: "hail",
                description: "Hail them on comms",
                execute: (scene) => {
                    scene.logMessage("They ignore your hail and jump away.", COLORS.GRAY);
                    scene.clearEvent();
                }
            }`;
        } else if (currentType === 'hazard') {
            optionsCode = `
            {
                command: "evade",
                description: "Burn fuel to evade (-15 Fuel)",
                execute: (scene) => {
                    if (scene.gameState.fuel.current >= 15) {
                        scene.gameState.fuel.current -= 15;
                        scene.logMessage("Successfully evaded using extra fuel.", COLORS.GREEN);
                    } else {
                        scene.gameState.hull.current -= 20;
                        scene.logMessage("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
                    }
                    scene.clearEvent();
                }
            },
            {
                command: "brace",
                description: "Take the hit (-20 Hull)",
                execute: (scene) => {
                    scene.gameState.hull.current -= 20;
                    scene.logMessage("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
                    scene.clearEvent();
                }
            }`;
        } else {
            optionsCode = `
            {
                command: "assist",
                description: "Provide assistance (-10 Fuel, -10 Energy)",
                execute: (scene) => {
                    if (scene.gameState.fuel.current >= 10 && scene.gameState.energy.current >= 10) {
                        scene.gameState.fuel.current -= 10;
                        scene.gameState.energy.current -= 10;
                        scene.gameState.credits += 50;
                        scene.logMessage("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
                    } else {
                        scene.logMessage("You lack the resources to assist.", COLORS.RED);
                    }
                    scene.clearEvent();
                }
            },
            {
                command: "ignore",
                description: "Ignore distress call",
                execute: (scene) => { scene.logMessage("You cold-heartedly ignore the signal.", COLORS.GRAY); scene.clearEvent(); }
            }`;
        }

        generatedEvents.push(`    ,{
        id: "${id}",
        title: "${title}",
        type: "${currentType}",
        text: "${desc}",
        options: [${optionsCode}
        ]
    }`);
    }
}

const newJsText = jsText.substring(0, insertIndex) + generatedEvents.join('\n') + '\n' + jsText.substring(insertIndex);
fs.writeFileSync(jsPath, newJsText);
console.log("Successfully appended " + generatedEvents.length + " events to events.js");
