const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '../qrm/main.js');
let mainStr = fs.readFileSync(mainPath, 'utf8');

// Remove duplicate declaration caused by multiple regex passes
mainStr = mainStr.replace(/const performerTracks = \{\};\n\n               const performerTracks = \{\};/g, 'const performerTracks = {};');

fs.writeFileSync(mainPath, mainStr);
console.log("Syntax error fixed.");
