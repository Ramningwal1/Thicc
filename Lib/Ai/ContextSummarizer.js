import { GenerateCompletion } from './OllamaClient.js';

async function SummarizeMessages(messages, mode, modelName, temperature) {
  const totalSize = JSON.stringify(messages).length;
  
  console.log(`\nCooking a reference cuddle (${messages.length} messages, ${(totalSize / 1024).toFixed(1)}KB)...`);
  
  const contextData = ExtractContextData(messages);
  const prompt = BuildContextualPrompt(contextData, mode);
  
  const result = await GenerateCompletion(modelName, prompt, 0.7, true);
  
  return result.success ? { success: true, summary: result.text } : result;
}

function ExtractContextData(messages) {
  const files = new Set();
  const tools = new Set();
  const tasks = [];
  const userMessages = [];
  const assistantMessages = [];
  
  messages.forEach((msg, idx) => {
    if (msg.message?.content && Array.isArray(msg.message.content)) {
      msg.message.content.forEach(block => {
        if (block.type === 'text' && block.text) {
          if (msg.message.role === 'user') {
            userMessages.push(block.text.substring(0, 300));
          } else if (msg.message.role === 'assistant') {
            assistantMessages.push(block.text.substring(0, 300));
          }
          
          const fileMatches = block.text.match(/[\/\\]?[\w\-\.]+\.(js|ts|jsx|tsx|py|java|cpp|c|h|go|rs|rb|php|cs|swift|kt|md|json|yaml|yml|xml|html|css|scss|sql|sh|bat)/gi);
          if (fileMatches) {
            fileMatches.forEach(f => files.add(f));
          }
        }
        
        if (block.type === 'tool_use' && block.name) {
          tools.add(block.name);
        }
      });
    }
  });
  
  const conversationSnippet = messages.slice(0, 3).map(msg => {
    if (msg.message?.content && Array.isArray(msg.message.content)) {
      const textBlocks = msg.message.content.filter(b => b.type === 'text');
      if (textBlocks.length > 0) {
        return `${msg.message.role}: ${textBlocks[0].text?.substring(0, 200) || ''}`;
      }
    }
    return '';
  }).filter(s => s).join('\n');
  
  return {
    messageCount: messages.length,
    files: Array.from(files).slice(0, 10),
    tools: Array.from(tools).slice(0, 8),
    userMessages: userMessages.slice(0, 5),
    assistantMessages: assistantMessages.slice(0, 5),
    conversationSnippet
  };
}

function BuildContextualPrompt(contextData, mode) {
  const targetLength = mode === 'aggressive' ? '300-500' : '400-600';
  
  return `You are summarizing a Claude Code conversation. Create a comprehensive summary (${targetLength} characters) covering:

CONVERSATION CONTEXT:
${contextData.conversationSnippet}

FILES REFERENCED (${contextData.files.length}): ${contextData.files.join(', ') || 'none'}
TOOLS USED (${contextData.tools.length}): ${contextData.tools.join(', ') || 'none'}
MESSAGE COUNT: ${contextData.messageCount}

REQUIREMENTS:
- Summarize the main tasks/objectives
- List critical files worked on (if any)
- Mention key tools used (if relevant)
- Include important context for understanding the work (important)
- Be comprehensive and technical
- Focus on what was accomplished or discussed

Summary:`;
}

export { SummarizeMessages };
