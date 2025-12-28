import fs from 'fs/promises';
import path from 'path';

async function ScanForJsonlFiles(directoryPath) {
  try {
    const files = await fs.readdir(directoryPath);
    const jsonlFiles = files.filter(file => path.extname(file).toLowerCase() === '.jsonl');
    
    return {
      success: true,
      files: jsonlFiles.map(file => path.join(directoryPath, file))
    };
  } catch (error) {
    return { success: false, error: error.message, files: [] };
  }
}

export { ScanForJsonlFiles };
