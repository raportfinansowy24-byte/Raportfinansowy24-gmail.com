const fs = require('fs');

const files = [
  'src/components/LoanCalculator.tsx',
  'src/components/MortgageSimulator.tsx',
  'src/components/SavingsGoal.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add motion import if not present
  if (!content.includes("from 'motion/react'") && !content.includes('from "motion/react"')) {
    content = content.replace(/import React[^;]+;\n/, match => match + "import { motion } from 'motion/react';\n");
  }

  // Replace <input type="range" with <motion.input whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} type="range"
  content = content.replace(/<input\s+type="range"/g, '<motion.input whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} type="range"');
  
  // Also close motion.input correctly - input is self-closing usually, but sometimes not.
  // In React it's always <input ... />
  // We need to replace `/>` for those inputs. Wait, regex for the closing tag of motion.input might be tricky.
  // Actually, <motion.input ... /> is fine.
  
  // Replace main action buttons
  // Example: <button onClick={handleContactSubmit}
  // Let's just manually replace a few known buttons.
  fs.writeFileSync(file, content);
});
