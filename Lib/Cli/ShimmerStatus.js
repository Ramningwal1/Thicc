import { ShimmerEffect } from './ShimmerEffect.js';

export class ShimmerStatus {
  constructor(options = {}) {
    this.shimmer = new ShimmerEffect(options);
  }

  start() {
    this.shimmer.start();
  }

  stop() {
    this.shimmer.stop();
  }

  async withShimmer(asyncFn) {
    this.start();
    try {
      return await asyncFn();
    } finally {
      this.stop();
    }
  }
}
