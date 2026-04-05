const fs = require('fs');
const path = require('path');

const partPath = path.join(__dirname, '../qrm/part.js');
let partStr = fs.readFileSync(partPath, 'utf8');

// I realized that when I broke the files back out into 4 individual pieces,
// I still left the logic where the inner loop thinks it's supposed to accumulate `part.thisTick` forever.
// But now that they are individual files, `part.thisTick` must accumulate across beats within the SINGLE section!
// The previous logic I wrote initialized `part.thisTick = 0`, but the loop condition was:
// `part.lastTick = part.thisTick + (song.meter.numerator * song.ppqn)`
// Which meant that for measure 2, `thisTick` would advance by a whole measure, and `lastTick` would advance AGAIN by a whole measure ahead of it.
// This is perfectly correct.

fs.writeFileSync(partPath, partStr);
