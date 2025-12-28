import { SummarizeMessages } from '../Ai/ContextSummarizer.js';
import { ValidateToolPairs } from '../Validation/ToolPairValidator.js';
import { FindAndDeleteOrphans } from '../Helpers/OrphanResolver.js';

async function CompressMedium(messages, validationData, modelName, temperature) {
  const minReduction = Math.ceil(messages.length * 0.10);
  const maxReduction = Math.ceil(messages.length * 0.20);
  
  let targetPairIndex = -1;
  let deleteStartIndex = -1;
  let resultIndex = -1;
  let deletionCount = 0;
  let finalResultIndex = -1;
  
  for (let pairIndex = validationData.pairs.length - 1; pairIndex >= 0; pairIndex--) {
    const pair = validationData.pairs[pairIndex];
    const pairResultIndex = pair.toolResult.messageIndex;
    
    let preferredStartIndex = -1;
    let fallbackStartIndex = 0;
    
    for (let i = pairResultIndex - 1; i >= 0; i--) {
      const msg = messages[i];
      
      if (msg.type === 'file-history-snapshot') {
        preferredStartIndex = i + 1;
        break;
      }
      
      if (msg.type === 'summary' && preferredStartIndex === -1) {
        preferredStartIndex = i + 1;
      }
    }
    
    if (preferredStartIndex === -1) {
      preferredStartIndex = 0;
    }
    
    let preferredCount = pairResultIndex - preferredStartIndex;
    let fallbackCount = pairResultIndex - fallbackStartIndex;
    
    if (preferredCount >= minReduction && preferredCount <= maxReduction) {
      targetPairIndex = pairIndex;
      deleteStartIndex = preferredStartIndex;
      deletionCount = preferredCount;
      finalResultIndex = pairResultIndex;
      break;
    } else if (fallbackCount >= minReduction && fallbackCount <= maxReduction && targetPairIndex === -1) {
      targetPairIndex = pairIndex;
      deleteStartIndex = fallbackStartIndex;
      deletionCount = fallbackCount;
      finalResultIndex = pairResultIndex;
      break;
    }
  }
  
  if (targetPairIndex === -1) {
    return {
      messages: messages,
      originalCount: messages.length,
      compressedCount: messages.length,
      removalLog: [],
      mode: 'medium',
      skipped: true,
      reason: `Too tight to squeeze > need ${minReduction}-${maxReduction} messages`
    };
  }

  const targetPair = validationData.pairs[targetPairIndex];
  resultIndex = finalResultIndex;
  
  const deletedMessages = messages.slice(deleteStartIndex, resultIndex);
  
  const compressed = [
    ...messages.slice(0, deleteStartIndex),
    ...messages.slice(resultIndex)
  ];

  const validation = ValidateToolPairs(compressed);
  
  let workingMessages = compressed;
  let deletedMessagesToSummarize = [...deletedMessages];
  let orphanLog = null;
  
  if (validation.hasOrphans) {
    const orphanResult = FindAndDeleteOrphans(compressed, validation.orphanedUses, validation.orphanedResults);
    workingMessages = orphanResult.messages;
    orphanLog = {
      orphansDeleted: orphanResult.deletedCount,
      orphanIndices: orphanResult.deletedIndices
    };
    
    for (const orphan of validation.orphanedUses) {
      deletedMessagesToSummarize = deletedMessagesToSummarize.filter(msg => {
        if (!msg.message?.content || !Array.isArray(msg.message.content)) return true;
        return !msg.message.content.some(block => block.type === 'tool_use' && block.id === orphan.id);
      });
    }
    
    for (const orphan of validation.orphanedResults) {
      deletedMessagesToSummarize = deletedMessagesToSummarize.filter(msg => {
        if (!msg.message?.content || !Array.isArray(msg.message.content)) return true;
        return !msg.message.content.some(block => block.type === 'tool_result' && block.tool_use_id === orphan.toolUseId);
      });
    }
  }
  
  if (deletedMessagesToSummarize.length === 0) {
    return {
      messages: workingMessages,
      originalCount: messages.length,
      compressedCount: workingMessages.length,
      removalLog: [{
        deletedRange: `[${deleteStartIndex}, ${resultIndex - 1}]`,
        deletedCount: deletionCount,
        targetToolPair: targetPairIndex + 1,
        toolUseId: targetPair.id,
        minReduction: minReduction,
        maxReduction: maxReduction,
        orphans: orphanLog,
        reason: 'No messages left to cuddle'
      }],
      mode: 'medium'
    };
  }

  const summaryResult = await SummarizeMessages(deletedMessagesToSummarize, 'medium', modelName, temperature);
  
  if (!summaryResult.success) {
    return {
      messages: workingMessages,
      originalCount: messages.length,
      compressedCount: workingMessages.length,
      removalLog: [{
        deletedRange: `[${deleteStartIndex}, ${resultIndex - 1}]`,
        deletedCount: deletionCount,
        targetToolPair: targetPairIndex + 1,
        toolUseId: targetPair.id,
        minReduction: minReduction,
        maxReduction: maxReduction,
        orphans: orphanLog,
        reason: 'AI too lazy to summarize',
        error: summaryResult.error
      }],
      mode: 'medium'
    };
  }

  let summaryInsertionIndex = 0;
  
  for (let i = 0; i < workingMessages.length; i++) {
    if (workingMessages[i].type === 'file-history-snapshot') {
      summaryInsertionIndex = i + 1;
      break;
    }
  }
  
  if (summaryInsertionIndex === 0) {
    for (let i = workingMessages.length - 1; i >= 0; i--) {
      if (workingMessages[i].type === 'summary') {
        summaryInsertionIndex = i + 1;
        break;
      }
    }
  }

  const firstDeletedMsg = deletedMessages[0];
  
  const summarizedMessage = {
    parentUuid: firstDeletedMsg.parentUuid || null,
    uuid: firstDeletedMsg.uuid,
    timestamp: firstDeletedMsg.timestamp,
    type: 'summary',
    message: {
      role: 'assistant',
      content: [{ type: 'text', text: summaryResult.summary }]
    }
  };

  const finalCompressed = [
    ...workingMessages.slice(0, summaryInsertionIndex),
    summarizedMessage,
    ...workingMessages.slice(summaryInsertionIndex)
  ];

  const finalValidation = ValidateToolPairs(finalCompressed);
  
  if (finalValidation.hasOrphans) {
    const finalOrphanResult = FindAndDeleteOrphans(finalCompressed, finalValidation.orphanedUses, finalValidation.orphanedResults);
    return {
      messages: finalOrphanResult.messages,
      originalCount: messages.length,
      compressedCount: finalOrphanResult.messages.length,
      removalLog: [{
        deletedRange: `[${deleteStartIndex}, ${resultIndex - 1}]`,
        deletedCount: deletionCount,
        targetToolPair: targetPairIndex + 1,
        toolUseId: targetPair.id,
        minReduction: minReduction,
        maxReduction: maxReduction,
        orphans: orphanLog,
        summarizedMessages: deletedMessagesToSummarize.length,
        postSummaryOrphansDeleted: finalOrphanResult.deletedCount,
        reason: 'AI summarized and cleaned up the orphans'
      }],
      mode: 'medium'
    };
  }

  return {
    messages: finalCompressed,
    originalCount: messages.length,
    compressedCount: finalCompressed.length,
    removalLog: [{
      deletedRange: `[${deleteStartIndex}, ${resultIndex - 1}]`,
      deletedCount: deletionCount,
      targetToolPair: targetPairIndex + 1,
      toolUseId: targetPair.id,
      minReduction: minReduction,
      maxReduction: maxReduction,
      orphans: orphanLog,
      summarizedMessages: deletedMessagesToSummarize.length,
      reason: 'AI got the summary done'
    }],
    mode: 'medium'
  };
}

export { CompressMedium };
