# Demo App Roadmap

> A full-stack demo showcasing assistant-ui capabilities

## Authentication

- [x] Email/Password signup & login
- [x] Social OAuth
  - [x] GitHub
  - [x] Google
- [x] Password reset flow
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [x] Session management
  - [x] List active sessions
  - [x] Revoke single session
  - [x] Revoke all other sessions

## User Profile

- [x] Profile editing
  - [x] Name
  - [x] Nickname
  - [x] Work type
- [x] Connected accounts
  - [x] Link social accounts
  - [x] Unlink social accounts
- [x] Appearance
  - [x] Light theme
  - [x] Dark theme
  - [x] System preference

## Chat

- [x] Conversations
  - [x] Create new thread
  - [x] Auto-generate title
  - [x] Rename thread
  - [x] Archive / Unarchive
  - [x] Delete thread
  - [x] Search threads (title only)
  - [ ] Pinned / Starred chats
  - [ ] Folders / Tags
  - [ ] Bulk delete
  - [ ] Full-text search (message content)
- [x] Messaging
  - [x] Send message
  - [x] Streaming response
  - [x] Edit user message
  - [x] Regenerate response
  - [x] Copy message
  - [x] Export message as Markdown
  - [x] File attachments
  - [x] Image upload
- [x] Branching
  - [x] Create branches (edit & regenerate)
  - [x] Branch picker navigation
  - [x] Branch count display
- [x] Message persistence
  - [x] PostgreSQL storage
  - [x] History adapter
  - [x] Message format adapter (AI SDK v5)
- [x] Incognito mode
  - [x] Toggle incognito chat
  - [x] No history saved
  - [x] No memory saved

## Projects

- [x] Project management
  - [x] Create project
  - [x] Rename project
  - [x] Delete project
  - [x] Project color customization
  - [x] Project instructions (custom system prompt per project)
- [x] Project documents
  - [x] Upload documents
  - [x] Document list view
  - [x] Remove documents
  - [x] Text extraction for context
- [x] Project chats
  - [x] Chats scoped to project
  - [x] Project sidebar list

## Capabilities

- [x] Memory
  - [x] Personalization (auto-save memories)
    - [x] Enable/disable toggle
    - [x] Database storage (PostgreSQL)
    - [x] User profile context (name, nickname, work type)
    - [x] AI-initiated memory saving (save_memory tool)
    - [x] Read-only mode when disabled
  - [ ] Chat history context
    - [ ] Enable/disable toggle
    - [ ] Reference past conversations
  - [x] Memory management
    - [x] View memories dialog
    - [x] Delete/clear memories
- [x] Artifacts
  - [x] Enable/disable toggle
  - [x] create_artifact tool
  - [x] Sandboxed iframe preview (safe-content-frame)
  - [x] Preview/Code tabs
  - [x] Copy and download actions
  - [x] Resizable side panel
  - [x] Compact inline card with "View" button
  - [x] Auto-open on artifact creation
- [ ] Web search
  - [ ] Enable/disable toggle
  - [ ] Search provider integration
  - [ ] Search results display
  - [ ] Source/Citation display (SourceMessagePart)
- [ ] Code execution
  - [ ] Enable/disable toggle
  - [ ] Sandboxed execution
  - [ ] Code output display
- [ ] Computer use (Agentic)
  - [ ] computer_call tool support
  - [ ] Screenshot display
  - [ ] Action confirmation UI

## AI Features

- [x] Model integration
  - [x] Multiple providers via AI SDK (OpenAI, xAI)
  - [x] Model selector (GPT-5, GPT-4o, Grok, etc.)
  - [x] Models dashboard (enable/disable models per user)
  - [x] Default model setting
  - [ ] Add more providers (Anthropic, Gemini, DeepSeek, etc.)
- [x] Reasoning
  - [x] Reasoning toggle per model
  - [x] Collapsible reasoning display
  - [x] Reasoning summary extraction
  - [ ] Chain-of-Thought visualization (ReasoningGroup)
- [ ] Customization
  - [ ] System prompt editor (global)
  - [ ] Temperature control (ModelContext.callSettings)
  - [ ] Max tokens setting
  - [ ] Stop sequences
- [ ] Tools
  - [x] Basic tool execution (save_memory, create_artifact)
  - [ ] Tool use visualization (ToolGroup)
  - [ ] Custom tool UI (makeAssistantToolUI)
  - [ ] Human-in-the-loop tools (confirmation before execution)
  - [ ] Tool result display
- [x] Suggestions
  - [x] Category-based suggestion buttons (Write, Learn, Create)
  - [x] Expandable suggestion lists per category
  - [ ] AI-generated follow-up suggestions (SuggestionAdapter)
  - [ ] AI word suggestions (inline completion while typing)
- [ ] Advanced
  - [ ] Token usage display
  - [ ] Cost estimation
  - [ ] Latency metrics

## Feedback

- [x] Message voting
  - [x] Upvote (thumbs up)
  - [x] Downvote (thumbs down)
- [x] Persistence
  - [x] Save to database
  - [x] Sync on page load
- [ ] Extended feedback
  - [ ] Text comments
  - [ ] Feedback analytics

## Sharing

- [x] Share links
  - [x] Create public link
  - [x] Copy link
  - [x] Delete link
- [x] Share options
  - [x] Public / Private toggle
  - [x] Include future messages
  - [x] Include all branches
- [x] Public view
  - [x] Read-only thread display
  - [x] Branch navigation
  - [x] Sharer info display
- [x] Management
  - [x] List all shares
  - [x] Delete from list

## Data Management

- [x] Export
  - [x] Single message as Markdown
  - [x] Full conversation as Markdown
  - [ ] Export all conversations
  - [ ] JSON export
- [ ] Import
  - [ ] Import conversations
  - [ ] Import from other platforms

## Multimodal

- [x] Images
  - [x] Image upload & recognition
  - [ ] Image generation display (DALL-E, etc.)
- [ ] Audio
  - [ ] Voice input (STT via SpeechRecognition)
  - [ ] Voice output (TTS via ActionBarSpeak)

## Dashboard

- [ ] Usage statistics
  - [ ] API calls
  - [ ] Token consumption
  - [ ] Cost tracking
- [ ] API key management
- [ ] Integrations (coming soon placeholder)

## UI Components

- [x] Layout
  - [x] Collapsible sidebar
  - [x] Mobile responsive
  - [x] App layout wrapper
- [x] Thread UI
  - [x] Welcome message
  - [x] Scroll to bottom
  - [x] Loading indicator
  - [ ] Suggestion chips (ThreadPrimitive.Suggestion)
  - [ ] Smooth text streaming animation (useSmooth)
- [x] Message UI
  - [x] User message bubble
  - [x] Assistant message
  - [x] Action bar (copy, edit, reload, feedback)
  - [x] Attachment preview & dialog
  - [ ] Speak button (TTS)
  - [ ] Tool call grouping (ToolGroup)
  - [ ] Reasoning grouping (ReasoningGroup)
- [x] Markdown rendering
  - [x] GFM support
  - [x] Syntax highlighting
  - [x] Code block copy
  - [x] Tables
  - [ ] LaTeX / Math rendering
- [x] Feedback
  - [x] Toast notifications
  - [x] Confirmation dialogs
  - [x] Loading skeletons
- [ ] Navigation
  - [ ] Command palette (Cmd+K)
  - [ ] Keyboard shortcuts
  - [ ] Focus management

## Developer Experience

- [ ] DevTools integration
  - [ ] React DevTools panel (@assistant-ui/react-devtools)
  - [ ] Event logging
  - [ ] Context viewer
  - [ ] State inspector
- [ ] Debugging
  - [ ] Message inspector
  - [ ] Tool call debugging
  - [ ] Network request viewer

## Integrations

- [ ] Cloud sync (assistant-cloud)
  - [ ] Thread sync across devices
  - [ ] Cloud storage for messages
  - [ ] Real-time collaboration
- [ ] LangGraph integration (@assistant-ui/react-langgraph)
  - [ ] LangGraph agent support
  - [ ] State management
- [ ] A2A integration (@assistant-ui/react-a2a)
  - [ ] Agent-to-Agent communication
- [ ] MCP (Model Context Protocol)
  - [ ] MCP server connection
  - [ ] Tool discovery from MCP

---

## Upstream Issues

> See [enhancements.md](./enhancements.md) for details

- [ ] `ThreadListItemPrimitive.Trigger` lacks `href` support
- [ ] `ThreadListItemPrimitive` needs custom actions dropdown
- [ ] `FeedbackAdapter` loses state with `MessageFormatAdapter`
