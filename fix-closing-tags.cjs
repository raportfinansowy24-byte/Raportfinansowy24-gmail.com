const fs = require('fs');

const files = [
  'src/components/LoanCalculator.tsx',
  'src/components/MortgageSimulator.tsx',
  'src/components/SavingsGoal.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // We need to find the matching closing tag for each <motion.button.
  // Actually, let's just use regex to replace specific button blocks.
  
  // For MortgageSimulator, we already handled some manually, but the script might have added more or messed it up.
  // Let's use `npm run build` to catch the errors and then fix them.
  fs.writeFileSync(file, content);
});
