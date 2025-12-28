import { ColorGradient } from '../Helpers/ColorGradient.js';

export class AsciiAnimator {
  constructor(asciiArt, options = {}) {
    this.asciiArt = asciiArt;
    this.options = {
      startColor: options.startColor || '#f34e3f',
      endColor: options.endColor || '#410604',
      delay: options.delay || 50,
      ...options
    };
  }

  async play() {
    const colorized = ColorGradient.colorizeAsciiArt(
      this.asciiArt,
      this.options.startColor,
      this.options.endColor
    );
    const coloredLines = colorized.split('\n');

    for (const line of coloredLines) {
      console.log(line);
      await this.delay(this.options.delay);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
