function ValidateToolPairs(messages) {
  const toolUseMap = new Map();
  const toolResultMap = new Map();
  const pairs = [];
  const orphanedUses = [];
  const orphanedResults = [];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    if (message.message && message.message.content && Array.isArray(message.message.content)) {
      for (const block of message.message.content) {
        if (block.type === 'tool_use') {
          toolUseMap.set(block.id, { messageIndex: i, block, message });
        }
      }
    }

    if (message.message && message.message.role === 'user' && message.message.content && Array.isArray(message.message.content)) {
      for (const block of message.message.content) {
        if (block.type === 'tool_result') {
          toolResultMap.set(block.tool_use_id, { messageIndex: i, block, message });
        }
      }
    }
  }

  for (const [id, useData] of toolUseMap) {
    if (toolResultMap.has(id)) {
      pairs.push({
        id,
        toolUse: useData,
        toolResult: toolResultMap.get(id)
      });
    } else {
      orphanedUses.push({ id, ...useData });
    }
  }

  for (const [id, resultData] of toolResultMap) {
    if (!toolUseMap.has(id)) {
      orphanedResults.push({ toolUseId: id, ...resultData });
    }
  }

  return {
    totalPairs: pairs.length,
    pairs,
    orphanedUses,
    orphanedResults,
    hasOrphans: orphanedUses.length > 0 || orphanedResults.length > 0
  };
}

export { ValidateToolPairs };
