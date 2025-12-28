import { program } from 'commander';

function ParseArguments() {
  program
    .name('Thicc')
    .description('Claude Code JSONL Conversations Compression Tool')
    .version('1.0.0')
    .option('-s, --safe', 'Use safe compression mode (5-10% reduction)')
    .option('-m, --medium', 'Use medium compression mode (10-20% reduction)')
    .option('-a, --aggressive', 'Use aggressive compression mode (15-25% reduction)')
    .option('--hard', 'Alias for aggressive mode')
    .option('--mode <number>', 'Specify mode by number (1=safe, 2=medium, 3=aggressive)')
    .parse();

  const options = program.opts();
  
  if (options.safe) return { mode: 1, interactive: false };
  if (options.medium) return { mode: 2, interactive: false };
  if (options.aggressive || options.hard) return { mode: 3, interactive: false };
  if (options.mode) {
    const modeNum = parseInt(options.mode);
    if (modeNum >= 1 && modeNum <= 3) {
      return { mode: modeNum, interactive: false };
    }
  }
  
  return { mode: null, interactive: true };
}

export { ParseArguments };
