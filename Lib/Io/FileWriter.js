import fs from 'fs/promises';

async function WriteFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export { WriteFile };
