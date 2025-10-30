# AI Chat Feature Documentation

## Overview
The AI Chat feature provides an interactive chat interface where users can query an AI assistant for help with their code. It's integrated into the editor's Secondary Panel alongside code suggestions and documentation.

## Components

### 1. ChatPanel (`components/ai/ChatPanel.tsx`)
Main chat interface component with:
- **Message History**: Scrollable list of conversation messages
- **Quick Prompts**: Pre-defined actions (Explain code, Find bugs, Optimize, etc.)
- **Loading States**: Visual feedback during AI processing
- **Export/Clear**: Chat management features
- **Auto-scroll**: Automatically scrolls to latest message

**Features:**
- Context-aware: Passes active file info to AI
- Mock responses: Built-in fallback for testing
- Chat history: Maintains conversation context
- Export to text file

### 2. ChatMessage (`components/ai/ChatMessage.tsx`)
Individual message display with:
- **Role-based styling**: Different appearance for user/AI/system messages
- **Avatars**: User (purple) and AI (gradient) icons
- **Timestamps**: Shows when message was sent
- **Copy button**: Copy AI responses to clipboard
- **Markdown support**: Ready for rich text formatting

### 3. ChatInput (`components/ai/ChatInput.tsx`)
Message input field with:
- **Auto-resize**: Textarea grows with content (max 150px)
- **Keyboard shortcuts**: Enter to send, Shift+Enter for new line
- **Disabled state**: Prevents input during AI processing
- **Send button**: Gradient button with visual feedback
- **Placeholder text**: Contextual hints

## Integration

### Secondary Panel
The chat is integrated into the editor's Secondary Panel:
- **Tab Navigation**: Chat | Suggestions | Docs
- **Default View**: Opens to Chat tab
- **Context Sharing**: Has access to active file via `useEditor()` hook

### Service Layer (`lib/services/ai-chat.service.ts`)
Provides API methods for:
- `sendMessage()`: Send chat messages with context
- `getCodeSuggestions()`: Get AI code suggestions
- `explainCode()`: Get code explanations
- `findBugs()`: Analyze code for bugs
- `generateTests()`: Generate test cases
- `refactorCode()`: Get refactoring suggestions
- `optimizeCode()`: Get performance optimizations

### API Client (`lib/api/client.ts`)
Generic axios instance with:
- **Auto-authentication**: Adds bearer token to requests
- **Token refresh**: Automatically refreshes expired tokens
- **Error handling**: Handles 401s and other errors gracefully

## Usage

### For Users
1. Open editor with any project
2. Secondary panel opens by default (or click Bot icon to open)
3. Click "Chat" tab
4. Type message or use quick prompts
5. AI responds with contextual help

### Quick Prompts
- **Explain this code**: Get detailed explanation of current file
- **Find bugs**: Analyze code for potential issues
- **Optimize performance**: Get performance improvement tips
- **Add comments**: Get suggestions for code documentation
- **Write tests**: Generate test cases
- **Refactor code**: Get refactoring recommendations

### For Developers

#### Sending a Message
```typescript
import { aiChatService } from '@/lib/services'

const response = await aiChatService.sendMessage({
  message: 'Explain this function',
  context: {
    code: activeFile.content,
    language: activeFile.language,
    filePath: activeFile.path,
  },
  conversationHistory: previousMessages,
})
```

#### Getting Code Suggestions
```typescript
const suggestions = await aiChatService.getCodeSuggestions(
  code,
  'typescript'
)
```

#### Finding Bugs
```typescript
const bugs = await aiChatService.findBugs(code, 'rust')
// Returns: [{ line: 42, severity: 'error', message: '...', suggestion: '...' }]
```

## Styling

### Theme
- **Background**: `#0C0C1E` (main), `#0A0A1A` (messages)
- **Accent**: `#7B2FF7` (purple) to `#00D4FF` (cyan) gradient
- **Text**: White with varying opacity for hierarchy
- **Borders**: `#7B2FF7/20` for subtle separation

### Fonts
- **Headers**: `Orbitron` (cosmic theme)
- **Body**: `Inter` (clean, readable)

## API Endpoints

The service expects these endpoints on the backend:

```
POST /api/ai/chat
  - Body: { message, context, conversationHistory }
  - Response: { message, suggestions, codeBlocks }

POST /api/ai/suggestions
  - Body: { code, language }
  - Response: { suggestions: [] }

POST /api/ai/explain
  - Body: { code, language }
  - Response: { explanation }

POST /api/ai/bugs
  - Body: { code, language }
  - Response: { bugs: [] }

POST /api/ai/tests
  - Body: { code, language }
  - Response: { tests }

POST /api/ai/refactor
  - Body: { code, language, instructions }
  - Response: { refactoredCode }

POST /api/ai/optimize
  - Body: { code, language }
  - Response: { optimizedCode, improvements }
```

## Mock Responses

Currently uses mock responses for testing. The `generateMockResponse()` function provides intelligent responses based on:
- Keywords in user message (explain, bug, optimize, test, refactor)
- Active file context
- Predefined helpful responses

Replace with actual API calls once backend is ready.

## Future Enhancements

### Phase 1 (Current)
- ✅ Chat interface
- ✅ Quick prompts
- ✅ Mock responses
- ✅ Context awareness
- ✅ Export/clear functionality

### Phase 2 (Planned)
- [ ] Connect to actual AI backend
- [ ] Streaming responses (SSE/WebSocket)
- [ ] Code snippet highlighting in messages
- [ ] Inline code suggestions
- [ ] Multi-file context
- [ ] Conversation persistence

### Phase 3 (Future)
- [ ] Voice input/output
- [ ] Image analysis (diagrams, screenshots)
- [ ] Multi-language support
- [ ] Custom AI model selection
- [ ] Rate limiting & usage tracking
- [ ] Collaborative AI sessions

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Semantic HTML with ARIA labels
- **High Contrast**: Works with high contrast modes
- **Focus Management**: Clear focus indicators

## Performance

- **Lazy Loading**: Chat panel only renders when visible
- **Virtual Scrolling**: Ready for large message histories
- **Debounced Input**: Prevents excessive API calls
- **Optimistic Updates**: Immediate UI feedback

## Testing

### Manual Testing Checklist
- [ ] Send message with Enter key
- [ ] Send message with button click
- [ ] Quick prompts work correctly
- [ ] Copy message functionality
- [ ] Export chat to file
- [ ] Clear chat history
- [ ] Auto-scroll to new messages
- [ ] Textarea auto-resize
- [ ] Loading states display
- [ ] Error handling works
- [ ] Context passed to AI (file info)
- [ ] Tab switching (Chat/Suggestions/Docs)

### Unit Tests (TODO)
```typescript
describe('ChatPanel', () => {
  it('renders welcome message')
  it('sends user message')
  it('displays AI response')
  it('handles quick prompts')
  it('exports chat history')
  it('clears messages')
})
```

## Troubleshooting

### Issue: AI not responding
- Check network tab for failed requests
- Verify API_BASE_URL in constants
- Check auth token is valid
- Review backend logs

### Issue: Messages not scrolling
- Check messagesEndRef is attached
- Verify overflow-y-auto on container
- Test with more messages

### Issue: Context not being passed
- Verify useEditor() hook works
- Check activeFile exists
- Review service method signatures

## Contributing

When adding new AI features:
1. Add method to `ai-chat.service.ts`
2. Update API endpoint documentation
3. Add to quick prompts if applicable
4. Update this README
5. Add tests

## License
Part of VibeCode - See main LICENSE file
