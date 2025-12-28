function ParseJsonl(content) {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const messages = [];
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      const parsed = JSON.parse(lines[i]);
      messages.push(parsed);
    } catch (error) {
      errors.push({
        lineNumber: i + 1,
        error: error.message,
        content: lines[i].substring(0, 100)
      });
    }
  }

  return {
    success: errors.length === 0,
    messages,
    errors,
    totalLines: lines.length,
    validMessages: messages.length
  };
}

export { ParseJsonl };
