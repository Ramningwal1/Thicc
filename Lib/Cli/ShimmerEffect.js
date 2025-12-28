import chalk from 'chalk';
import { ColorGradient } from '../Helpers/ColorGradient.js';

export class ShimmerEffect {
  constructor(options = {}) {
    this.options = {
      text: options.text || 'Processing...',
      color: options.color || '#ff9800',
      shimmerColor: options.shimmerColor || '#ffeb3b',
      duration: options.duration || 2000,
      interval: options.interval || 50,
      ...options
    };

    this.isRunning = false;
    this.frameCounter = 0;
    this.animationInterval = null;
  }

  interpolateColor(color1, color2, ratio) {
    const rgb1 = ColorGradient.hexToRgb(color1);
    const rgb2 = ColorGradient.hexToRgb(color2);

    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);

    const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    return `#${hex}`;
  }

  calculateShimmerPosition(frameIndex, textLength) {
    const cycleFrames = this.options.duration / this.options.interval;
    const normalizedFrame = (frameIndex % cycleFrames) / cycleFrames;
    return normalizedFrame;
  }

  generateFrame() {
    const text = this.options.text;
    const shimmerPos = this.calculateShimmerPosition(this.frameCounter, text.length);

    let result = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      const distance = Math.abs((i / text.length) - shimmerPos);
      const shimmerIntensity = Math.max(0, 1 - distance * 3);

      const color = this.interpolateColor(
        this.options.color,
        this.options.shimmerColor,
        shimmerIntensity
      );

      result += chalk.hex(color)(char);
    }

    this.frameCounter++;
    return result;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.frameCounter = 0;

    this.animationInterval = setInterval(() => {
      if (!this.isRunning) {
        return;
      }
      
      const frame = this.generateFrame();
      process.stdout.write(`\r${frame}`);
    }, this.options.interval);
  }

  stop() {
    this.isRunning = false;
    
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
    
    process.stdout.write('\r' + ' '.repeat(this.options.text.length) + '\r');
  }

  async runForDuration(durationMs) {
    this.start();
    await new Promise(resolve => setTimeout(resolve, durationMs));
    this.stop();
  }
}
