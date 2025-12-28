import chalk from 'chalk';
import { ColorGradient } from '../Helpers/ColorGradient.js';

export class ConsoleInterceptor {
  constructor(options = {}) {
    this.options = {
      startColor: options.startColor || '#f34e3f',
      endColor: options.endColor || '#410604',
      ...options
    };

    this.originalLog = console.log;
    this.originalWarn = console.warn;
    this.originalError = console.error;
    this.originalStdoutWrite = process.stdout.write.bind(process.stdout);
    this.originalStderrWrite = process.stderr.write.bind(process.stderr);

    this.colorSchemas = {
      log: {
        startColor: '#b0b0b0',
        endColor: '#505050'
      },
      warn: {
        startColor: '#ffeb3b',
        endColor: '#ff9800'
      },
      error: {
        startColor: '#ff5252',
        endColor: '#c41c3b'
      }
    };
  }

  /**
   * Apply gradient coloring to text using chalk
   * @param {string} text - Text to colorize
   * @param {string} startColor - Start hex
   * @param {string} endColor - End hex
   * @returns {string} Colored text
   */
  applyGradient(text, startColor, endColor) {
    const charGradient = ColorGradient.generateCharacterGradient(
      text,
      startColor,
      endColor
    );

    return charGradient.map(({ char, color }) => {
      return chalk.hex(color)(char);
    }).join('');
  }

  interceptLog() {
    console.log = (...args) => {
      const text = args.map(arg => {
        if (typeof arg === 'string') return arg;
        return JSON.stringify(arg, null, 2);
      }).join(' ');

      const schema = this.colorSchemas.log;
      const colorized = this.applyGradient(text, schema.startColor, schema.endColor);
      this.originalLog(colorized);
    };
  }

  interceptWarn() {
    console.warn = (...args) => {
      const text = args.map(arg => {
        if (typeof arg === 'string') return arg;
        return JSON.stringify(arg, null, 2);
      }).join(' ');

      const schema = this.colorSchemas.warn;
      const colorized = this.applyGradient(text, schema.startColor, schema.endColor);
      this.originalLog(colorized);
    };
  }

  interceptError() {
    console.error = (...args) => {
      const text = args.map(arg => {
        if (typeof arg === 'string') return arg;
        return JSON.stringify(arg, null, 2);
      }).join(' ');

      const schema = this.colorSchemas.error;
      const colorized = this.applyGradient(text, schema.startColor, schema.endColor);
      this.originalLog(colorized);
    };
  }

  interceptAll() {
    this.interceptLog();
    this.interceptWarn();
    this.interceptError();
  }

  restore() {
    console.log = this.originalLog;
    console.warn = this.originalWarn;
    console.error = this.originalError;
    process.stdout.write = this.originalStdoutWrite;
    process.stderr.write = this.originalStderrWrite;
  }
}
