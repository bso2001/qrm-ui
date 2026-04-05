const fs = require('fs');
const execSync = require('child_process').execSync;
console.log("Rolling back qrm to known good state...");
execSync('git -C ../qrm restore common.js main.js part.js theory.js');
console.log("Rolled back qrm.");
