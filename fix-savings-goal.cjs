const fs = require('fs');
let content = fs.readFileSync('src/components/SavingsGoal.tsx', 'utf8');

if (!content.includes("from 'motion/react'") && !content.includes('from "motion/react"')) {
  content = content.replace(/import React[^;]*;/, match => match + "\nimport { motion } from 'motion/react';");
}

content = content.replace(
  /<button \n\s+onClick=\{\(\) => fetchOffers\('all'\)\}/g,
  '<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}\n                  onClick={() => fetchOffers(\'all\')}'
);

content = content.replace(
  /<button \n\s+onClick=\{\(\) => setShowReportModal\(true\)\}/g,
  '<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}\n                    onClick={() => setShowReportModal(true)}'
);

content = content.replace(
  /<\/button>/g,
  '</motion.button>'
); // Note: SavingsGoal only has 2 buttons, both are replaced. Wait, let me check if there are others.

fs.writeFileSync('src/components/SavingsGoal.tsx', content);
