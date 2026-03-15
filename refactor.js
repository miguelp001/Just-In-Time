const fs = require('fs');

let content = fs.readFileSync('events.js', 'utf8');

// 1. Change execute signature
content = content.replace(/execute: \(scene\) => \{/g, 'execute: (ship, player, broadcast) => {');

// 2. Change state references
content = content.replace(/scene\.gameState\./g, 'ship.');

// 3. Change log calls
content = content.replace(/scene\.logMessage\((.*?),\s*(.*?)\)/g, 'broadcast($1, $2)');

// 4. Change clearEvent calls
content = content.replace(/scene\.clearEvent\(\);?/g, 'ship.currentEncounter = null;');

// 5. Add module exports at the bottom
if (!content.includes('module.exports')) {
    content += `\n\nmodule.exports = { GAME_EVENTS, getRandomEvent };\n`;
}

// 6. Fix COLORS reference (since COLORS isn't defined here, we can either define it or pass exact hex codes, or just define COLORS at top)
if (!content.includes('const COLORS =')) {
    const colorsObj = `
const COLORS = {
    GREEN: '#00FF00',
    RED: '#FF0000',
    YELLOW: '#FFFF00',
    CYAN: '#00FFFF',
    GRAY: '#AAAAAA',
    WHITE: '#FFFFFF',
    MAGENTA: '#FF00FF'
};
`;
    content = colorsObj + content;
}

fs.writeFileSync('events.js', content, 'utf8');
console.log('Successfully refactored events.js');
