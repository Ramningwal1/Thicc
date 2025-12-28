export class ColorGradient {
  /**
   * Parse hex color to RGB object
   * @param {string} hex - Hex color (e.g., "#f34e3f" or "f34e3f")
   * @returns {Object} {r, g, b}
   */
  static hexToRgb(hex) {
    const cleanHex = hex.replace(/^#/, '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }

  /**
   * Convert RGB to hex
   * @param {Object} rgb - {r, g, b}
   * @returns {string} Hex color string
   */
  static rgbToHex(rgb) {
    const toHex = (n) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  /**
   * Interpolate between two colors at a specific ratio
   * @param {string} startColor - Start hex color
   * @param {string} endColor - End hex color
   * @param {number} ratio - 0 to 1 (0 = start, 1 = end)
   * @returns {string} Interpolated hex color
   */
  static interpolate(startColor, endColor, ratio) {
    ratio = Math.max(0, Math.min(1, ratio));

    const start = this.hexToRgb(startColor);
    const end = this.hexToRgb(endColor);

    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);

    return this.rgbToHex({ r, g, b });
  }

  /**
   * Generate gradient colors for each character in text
   * @param {string} text - Text to colorize
   * @param {string} startColor - Start hex color
   * @param {string} endColor - End hex color
   * @returns {Array<{char: string, color: string}>}
   */
  static generateCharacterGradient(text, startColor, endColor) {
    const length = text.length;
    const result = [];

    for (let i = 0; i < length; i++) {
      const ratio = length === 1 ? 0 : i / (length - 1);
      const color = this.interpolate(startColor, endColor, ratio);
      result.push({
        char: text[i],
        color: color
      });
    }

    return result;
  }

  /**
   * Create colored ASCII art string with gradient
   * @param {string} asciiArt - Multi-line ASCII art
   * @param {string} startColor - Start hex color
   * @param {string} endColor - End hex color
   * @returns {string} ANSI-colored ASCII art
   */
  static colorizeAsciiArt(asciiArt, startColor, endColor) {
    const lines = asciiArt.split('\n');
    let colorIndex = 0;
    const totalChars = asciiArt.replace(/\n/g, '').length;

    return lines.map(line => {
      return line.split('').map(char => {
        const ratio = totalChars === 0 ? 0 : colorIndex / totalChars;
        const color = this.interpolate(startColor, endColor, ratio);
        colorIndex++;
        return `\x1b[38;2;${parseInt(color.substring(1, 3), 16)};${parseInt(color.substring(3, 5), 16)};${parseInt(color.substring(5, 7), 16)}m${char}\x1b[0m`;
      }).join('');
    }).join('\n');
  }
}
