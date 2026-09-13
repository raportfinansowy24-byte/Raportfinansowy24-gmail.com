const fs = require('fs');
let content = fs.readFileSync('src/components/LoanCalculator.tsx', 'utf8');

const linesToFix = [848, 854, 874, 1110, 1397, 1419, 1423];

let lines = content.split('\n');

linesToFix.forEach(lineNumber => {
  let idx = lineNumber - 1; // 0-indexed
  lines[idx] = lines[idx].replace('</button>', '</motion.button>');
});

fs.writeFileSync('src/components/LoanCalculator.tsx', lines.join('\n'));
