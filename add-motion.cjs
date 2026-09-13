const fs = require('fs');

const files = [
  'src/components/LoanCalculator.tsx',
  'src/components/MortgageSimulator.tsx',
  'src/components/SavingsGoal.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes("from 'motion/react'") && !content.includes('from "motion/react"')) {
    content = content.replace(/import React[^;]*;/, match => match + "\nimport { motion } from 'motion/react';");
  }

  // Range inputs
  content = content.replace(/<input(\s+type="range")/g, '<motion.input whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}$1');

  // Some buttons to animate: 
  // <button onClick={handleContactSubmit} ... >
  content = content.replace(/<button\s+onClick=\{handleContactSubmit\}/g, '<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} onClick={handleContactSubmit}');
  
  // <button onClick={reset}
  content = content.replace(/<button(\s+onClick=\{reset\})/g, '<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}$1');

  // <button onClick={handleMatchOffer}
  content = content.replace(/<button(\s+onClick=\{handleMatchOffer\})/g, '<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}$1');

  // Find all remaining </button> that were opened with <motion.button
  // This is a bit risky with regex, we need to balance them.
  // Instead of complex regex, let's just do targeted replacements of the closing tag if we replaced the opening tag.
  
  fs.writeFileSync(file, content);
});
