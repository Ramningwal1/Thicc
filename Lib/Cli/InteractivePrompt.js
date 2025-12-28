import readline from 'readline';

async function PromptForMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('Compression Modes:');
    console.log('  1. Safe       (5-10% reduction, minimal context loss)');
    console.log('  2. Medium     (10-20% reduction, balanced)');
    console.log('  3. Aggressive (15-25% reduction, significant context loss)');
    console.log('');
    
    rl.question('Mode > ', (answer) => {
      rl.close();
      const mode = parseInt(answer.trim());
      
      if (mode >= 1 && mode <= 3) {
        resolve({ mode, cancelled: false });
      } else {
        console.log('\nMode too picky > use 1, 2, or 3');
        resolve({ mode: null, cancelled: true });
      }
    });
  });
}

export { PromptForMode };
