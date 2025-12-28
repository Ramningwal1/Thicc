function FindAndDeleteOrphans(messages, orphanedUses, orphanedResults) {
  const deletedIndices = new Set();
  
  for (const orphanUse of orphanedUses) {
    deletedIndices.add(orphanUse.messageIndex);
  }
  
  for (const orphanResult of orphanedResults) {
    deletedIndices.add(orphanResult.messageIndex);
  }
  
  const filtered = messages.filter((msg, idx) => !deletedIndices.has(idx));
  
  return {
    messages: filtered,
    deletedCount: deletedIndices.size,
    deletedIndices: Array.from(deletedIndices).sort((a, b) => a - b)
  };
}

export { FindAndDeleteOrphans };
