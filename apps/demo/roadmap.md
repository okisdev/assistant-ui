# Demo App Roadmap

> Comprehensive feature roadmap for building a world-class AI assistant experience.
> 
> This document serves as:
> - ✅ Implementation status tracker for all demo features
> - 📋 Planning reference for upcoming features
> - 🎯 Inspiration from ChatGPT, Claude, Perplexity, Manus, and other leading AI products
> - 🔗 Comparison with assistant-ui package capabilities
> 
> Legend: `[x]` = Implemented | `[ ]` = Planned | `~~strikethrough~~` = Not applicable (has dedicated example/app)

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
  - [x] Trash management
    - [x] Soft delete with retention period (30 days)
    - [x] Restore from trash
    - [x] Permanent delete
    - [x] Days remaining display
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
  - [ ] ~~Cloud file attachment adapter (CloudFileAttachmentAdapter)~~ *(requires assistant-cloud, see with-cloud example)*
  - [ ] ~~Composite attachment adapter~~ *(advanced adapter pattern, demo uses simple attachments)*
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
- [x] Web search
  - [x] Enable/disable toggle (settings)
  - [x] Search provider integration (OpenAI web_search, xAI search)
  - [x] Search results display
  - [x] Source/Citation display (SourceMessagePart)
  - [x] Web search progress indicator
  - [x] Search query display
- [ ] Code execution
  - [ ] Enable/disable toggle
  - [ ] Sandboxed execution
  - [ ] Code output display
- [ ] Computer use (Agentic)
  - [ ] computer_call tool support
  - [ ] Screenshot display
  - [ ] Action confirmation UI
  - [ ] Browser automation
  - [ ] Form filling
  - [ ] Web scraping

## Canvas & Collaboration

- [ ] Canvas mode (ChatGPT-style)
  - [ ] Side-by-side editing
  - [ ] AI suggestions inline
  - [ ] Version history
  - [ ] Diff view
- [ ] Whiteboard
  - [ ] Drawing tools
  - [ ] AI diagram generation
  - [ ] Export as image
- [ ] Document collaboration
  - [ ] Real-time co-editing
  - [ ] Comments and annotations
  - [ ] PDF annotation

## AI Features

- [x] Model integration
  - [x] Multiple providers via AI SDK (OpenAI, xAI)
  - [x] Model selector (GPT-5, GPT-4o, Grok, etc.)
  - [x] Models dashboard (enable/disable models per user)
  - [x] Default model setting
  - [x] Model families grouping
  - [x] Model capabilities display (text, image, reasoning)
  - [x] Model pricing information
  - [x] Deprecated model handling
  - [ ] Add more providers (Anthropic, Gemini, DeepSeek, etc.)
- [x] Reasoning
  - [x] Reasoning toggle per model
  - [x] Collapsible reasoning display
  - [x] Reasoning summary extraction
  - [x] Chain-of-Thought prompting modes
    - [x] Off mode
    - [x] Auto mode (AI decides)
    - [x] Always mode (force step-by-step)
  - [x] Chain-of-Thought parsing (&lt;thinking&gt; tags)
  - [ ] Chain-of-Thought visualization (ReasoningGroup)
- [x] Customization
  - [x] Composer modes (default, image-generation)
  - [x] Project-level system prompts
  - [ ] Global system prompt editor
  - [ ] Temperature control
  - [ ] Max tokens setting
  - [ ] ~~Stop sequences~~ *(rarely used, low value)*
- [ ] Tools
  - [x] Basic tool execution (save_memory, create_artifact)
  - [ ] Tool use visualization (ToolGroup)
  - [x] Custom tool UI (makeAssistantToolUI)
  - [ ] ~~Inline render (useInlineRender)~~ *(advanced library pattern, not applicable to demo)*
  - [ ] ~~Make component visible to AI (makeAssistantVisible)~~ *(advanced library pattern, not applicable to demo)*
  - [ ] ~~Toolkit organization (Toolkit, ToolDefinition)~~ *(library API design, not demo UI feature)*
  - [ ] Human-in-the-loop tools (confirmation before execution)
  - [ ] Tool result display
- [x] Suggestions
  - [x] Category-based suggestion buttons (Write, Learn, Create)
  - [x] Expandable suggestion lists per category
  - [ ] AI-generated follow-up suggestions (SuggestionAdapter)
  - [ ] Thread suggestions display (thread.suggestions)
  - [ ] AI word suggestions (inline completion while typing)
- [x] Advanced
  - [x] Token usage display (in dashboard)
  - [x] Cost estimation (per request and aggregated)
  - [x] Latency metrics
    - [x] Time to first chunk
    - [x] Time to first token
    - [x] Total stream time
    - [x] Tokens per second
    - [x] Chunk count
    - [x] Per-message timing display

## Focus Modes (Perplexity-style)

- [ ] Mode selector
  - [ ] General (default)
  - [ ] Academic (cite papers)
  - [ ] Writing (creative focus)
  - [ ] Code (programming focus)
  - [ ] Math (step-by-step solutions)
  - [ ] Research (deep analysis)
- [ ] Mode-specific behaviors
  - [ ] Custom system prompts per mode
  - [ ] Mode-specific tools
  - [ ] Output formatting per mode

## Deep Search (Pro Search)

- [ ] Multi-step research
  - [ ] Query decomposition
  - [ ] Iterative search refinement
  - [ ] Source aggregation
- [ ] Research report generation
  - [ ] Structured output
  - [ ] Citation management
  - [ ] Export as PDF/Markdown
- [ ] Related questions
  - [ ] Auto-generated follow-ups
  - [ ] Topic exploration

## Custom Assistants (GPTs-style)

- [ ] Assistant builder
  - [ ] Custom instructions
  - [ ] Knowledge base upload
  - [ ] Tool selection
  - [ ] Conversation starters
- [ ] Assistant marketplace
  - [ ] Browse public assistants
  - [ ] Install/Use assistants
  - [ ] Rating and reviews
- [ ] Assistant sharing
  - [ ] Public/Private toggle
  - [ ] Share link generation

## Agents & Automation

- [ ] Multi-agent orchestration
  - [ ] Agent-to-agent communication
  - [ ] Task delegation
  - [ ] Result aggregation
- [ ] Task planning
  - [ ] Goal decomposition
  - [ ] Step-by-step execution
  - [ ] Progress tracking
- [ ] Scheduled tasks
  - [ ] Recurring prompts
  - [ ] Scheduled reports
  - [ ] Notification triggers
- [ ] Workflow automation
  - [ ] Visual workflow builder
  - [ ] Trigger conditions
  - [ ] Action chains

## Feedback

- [x] Message voting
  - [x] Upvote (thumbs up)
  - [x] Downvote (thumbs down)
- [x] Persistence
  - [x] Save to database
  - [x] Sync on page load
- [ ] Extended feedback
  - [ ] Text comments
  - [ ] ~~Feedback analytics~~ *(enterprise feature, requires analytics infrastructure)*

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
  - [ ] ~~Thread message text extraction (getThreadMessageText)~~ *(library utility function, not demo UI)*
- [ ] Import
  - [ ] Import conversations
  - [ ] ~~Import from other platforms~~ *(requires third-party API integration, out of scope)*
- [ ] ~~Data streaming~~ *(library internals, not demo UI features)*
  - [ ] ~~Assistant stream utilities (assistant-stream)~~
  - [ ] ~~React data stream (@assistant-ui/react-data-stream)~~

## Multimodal

- [x] Images
  - [x] Image upload & recognition
  - [x] Image generation
    - [x] generate_image tool
    - [x] Multiple models (DALL-E 2, DALL-E 3, Grok 2 Image)
    - [x] Default model selection in settings
    - [x] Image generation mode (composer mode)
    - [x] Generation progress indicator
  - [ ] Image editing
    - [ ] Inpainting
    - [ ] Outpainting
    - [ ] Style transfer
- [x] Audio
  - [x] Voice input (Web Speech Recognition)
    - [x] useSpeechRecognition hook
    - [x] Interim transcript display
    - [x] Browser support detection
  - [x] Voice output (TTS via WebSpeechSynthesisAdapter)
  - [ ] Custom speech synthesis adapters (ElevenLabs, etc.)
  - [ ] Real-time voice mode (bidirectional)
    - [ ] Voice-to-voice conversation
    - [ ] Interruption handling
    - [ ] Emotion detection
  - [ ] Audio file transcription
    - [ ] Upload audio files
    - [ ] Whisper integration
    - [ ] Speaker diarization
- [ ] Video
  - [ ] Video upload & analysis
  - [ ] Frame extraction
  - [ ] Video summarization
- [ ] Documents
  - [ ] PDF parsing & analysis
  - [ ] Document summarization
  - [ ] Table extraction
  - [ ] OCR for scanned documents

## Knowledge Base (RAG)

- [ ] Document ingestion
  - [ ] PDF, DOCX, TXT upload
  - [ ] Web page import
  - [ ] Notion/Google Docs sync
- [ ] Vector storage
  - [ ] Embedding generation
  - [ ] Similarity search
  - [ ] Hybrid search (semantic + keyword)
- [ ] Retrieval
  - [ ] Context injection
  - [ ] Source attribution
  - [ ] Relevance scoring
- [ ] Management
  - [ ] Document list view
  - [ ] Update/Delete documents
  - [ ] Usage statistics

## Collections & Bookmarks

- [ ] Message bookmarks
  - [ ] Save important messages
  - [ ] Add notes to bookmarks
  - [ ] Quick access panel
- [ ] Collections
  - [ ] Group related chats
  - [ ] Collection sharing
  - [ ] Export collection
- [ ] Discover feed
  - [ ] Trending topics
  - [ ] Curated prompts
  - [ ] Community highlights

## Dashboard

- [x] Usage statistics
  - [x] Request count
  - [x] Token consumption (input/output/reasoning)
  - [x] Cost estimation
  - [x] Usage by model breakdown
  - [x] Usage chart (daily trend)
  - [x] Usage heatmap (GitHub-style activity calendar)
  - [x] Recent usage list
  - [x] Time range filtering (today/week/month/all)
- [x] Storage management
  - [x] Storage usage tracking
  - [x] Storage limits display
  - [x] Recent files list
- [ ] API key management (BYOK - Bring Your Own Key)
- [ ] ~~Integrations (coming soon placeholder)~~ *(meaningless placeholder)*

## UI Components

- [x] Layout
  - [x] Collapsible sidebar
  - [x] Mobile responsive
  - [x] App layout wrapper
  - [ ] ~~Assistant modal (AssistantModalPrimitive)~~ *(demo uses full-page layout, modal is alternative pattern)*
- [x] Thread UI
  - [x] Welcome message
  - [x] Scroll to bottom
  - [x] Loading indicator
  - [ ] Suggestion chips (ThreadPrimitive.Suggestion)
  - [x] Smooth text streaming animation (useSmooth)
  - [ ] Viewport slack (ThreadViewportSlack)
- [x] Message UI
  - [x] User message bubble
  - [x] Assistant message
  - [x] Action bar (copy, edit, reload, feedback)
  - [x] Attachment preview & dialog
  - [x] Speak button (TTS via WebSpeechSynthesis)
  - [x] Message timing display (hover tooltip)
  - [x] Activity progress indicators
    - [x] Reasoning progress
    - [x] Web search progress
    - [x] Image generation progress
    - [x] MCP tool progress
  - [x] Share individual message
  - [ ] Tool call grouping (ToolGroup)
  - [ ] Reasoning grouping (ReasoningGroup)
  - [ ] Generic tool fallback component (ToolFallback)
- [x] Markdown rendering
  - [x] GFM support
  - [x] Syntax highlighting (Shiki via react-shiki)
  - [x] Code block copy
  - [x] Tables
  - [ ] LaTeX / Math rendering (katex, remark-math)
  - [x] Mermaid diagram rendering
  - [ ] Language-specific code components (componentsByLanguage)
- [x] Feedback
  - [x] Toast notifications
  - [x] Confirmation dialogs
  - [x] Loading skeletons
- [ ] Navigation
  - [ ] Command palette (Cmd+K)
  - [ ] Keyboard shortcuts
  - [ ] Focus management

## Developer Experience

- [ ] ~~DevTools integration~~ *(separate devtools-frame app exists, not needed in demo)*
  - [ ] ~~React DevTools panel (@assistant-ui/react-devtools)~~
  - [ ] ~~DevToolsModal component~~
  - [ ] ~~DevToolsFrame integration~~
  - [ ] ~~Event logging~~
  - [ ] ~~Context viewer~~
  - [ ] ~~State inspector~~
  - [ ] ~~Tool normalization view~~
- [ ] ~~Debugging~~ *(developer tools, not end-user demo features)*
  - [ ] ~~Message inspector~~
  - [ ] ~~Tool call debugging~~
  - [ ] ~~Network request viewer~~
  - [ ] ~~Model context serialization view~~

## Integrations

- [ ] ~~Cloud sync (assistant-cloud)~~ *(see with-cloud example, demo uses local PostgreSQL)*
  - [ ] ~~Thread sync across devices~~
  - [ ] ~~Cloud storage for messages~~
  - [ ] ~~Cloud file storage (AssistantCloudFiles)~~
  - [ ] ~~Cloud runs (AssistantCloudRuns)~~
  - [ ] ~~Real-time collaboration~~
- [ ] ~~LangGraph integration (@assistant-ui/react-langgraph)~~ *(see with-langgraph example)*
  - [ ] ~~useLangGraphRuntime~~
  - [ ] ~~LangGraph agent support~~
  - [ ] ~~Interrupt state handling (useLangGraphInterruptState)~~
  - [ ] ~~LangGraph commands (useLangGraphSendCommand)~~
- [ ] ~~A2A integration (@assistant-ui/react-a2a)~~ *(separate protocol, has own package)*
  - [ ] ~~useA2ARuntime~~
  - [ ] ~~Agent-to-Agent communication~~
  - [ ] ~~A2A message conversion~~
- [ ] ~~AG-UI integration (@assistant-ui/react-ag-ui)~~ *(see with-ag-ui example)*
  - [ ] ~~useAgUiRuntime~~
  - [ ] ~~AG-UI protocol support~~
- [ ] ~~React Hook Form integration (@assistant-ui/react-hook-form)~~ *(see with-react-hook-form example)*
  - [ ] ~~Form-based chat input~~
  - [ ] ~~Validation integration~~
- [x] MCP (Model Context Protocol)
  - [x] MCP server connection
  - [x] Tool discovery from MCP
  - [x] OAuth authentication for MCP servers
  - [x] Token refresh handling
  - [x] Connection testing
  - [x] Connection status checking
  - [x] Custom headers support
  - [x] HTTP/SSE transport types
  - [ ] stdio transport type (for E2B sandbox integration)
  - [x] Server management (add/edit/delete)
  - [x] Enable/disable servers
  - [x] MCP resource handling
  - [x] MCP Apps (interactive UI from MCP servers)

## Model Context & Runtime

- [ ] ~~Model context embedding~~ *(iframe embedding pattern, demo is standalone app)*
  - [ ] ~~AssistantFrame~~
  - [ ] ~~AssistantFrameHost~~
  - [ ] ~~AssistantFrameProvider~~
- [ ] Model context features
  - [ ] useAssistantInstructions hook
  - [ ] Model context registry
- [x] Runtime adapters
  - [x] Message format adapter (MessageFormatAdapter)
  - [x] Thread history adapter (ThreadHistoryAdapter)
  - [ ] ~~Composite attachment adapter~~ *(advanced pattern, demo uses simple attachments)*
- [ ] ~~External store runtime~~ *(see with-external-store example)*
- [ ] ~~Store integration (@assistant-ui/store)~~ *(see store-example)*
  - [ ] ~~useAssistantClient~~
  - [ ] ~~useAssistantState~~
  - [ ] ~~useAssistantEvent~~
  - [ ] ~~TAP-based state management~~

## Team & Collaboration

- [ ] Workspaces
  - [ ] Create/manage workspaces
  - [ ] Workspace settings
  - [ ] Billing per workspace
- [ ] Team management
  - [ ] Invite members
  - [ ] Role-based permissions (Admin, Member, Viewer)
  - [ ] Activity audit log
- [ ] Shared resources
  - [ ] Shared threads
  - [ ] Shared projects
  - [ ] Shared assistants
- [ ] Real-time collaboration
  - [ ] See who's viewing
  - [ ] Collaborative editing
  - [ ] Thread comments

## Writing Styles (Claude-style)

- [ ] Style presets
  - [ ] Professional
  - [ ] Casual
  - [ ] Academic
  - [ ] Creative
  - [ ] Technical
- [ ] Custom styles
  - [ ] Define custom style
  - [ ] Style from example
  - [ ] Save personal styles
- [ ] Per-thread style override

## Platform & Distribution

- [ ] Mobile app
  - [ ] iOS app
  - [ ] Android app
  - [ ] Push notifications
- [ ] Browser extension
  - [ ] Quick access popup
  - [ ] Page context injection
  - [ ] Screenshot capture
- [ ] Desktop app
  - [ ] Electron wrapper
  - [ ] System tray
  - [ ] Global hotkey
- [ ] API access
  - [ ] REST API
  - [ ] API key management
  - [ ] Rate limiting
  - [ ] Webhooks

## Plugins & Extensions

- [ ] Plugin system
  - [ ] Plugin marketplace
  - [ ] Install/Uninstall plugins
  - [ ] Plugin settings
- [ ] Built-in integrations
  - [ ] Google Drive
  - [ ] Notion
  - [ ] Slack
  - [ ] GitHub
  - [ ] Linear
- [ ] Custom actions
  - [ ] Define custom actions
  - [ ] Action triggers
  - [ ] Action chains

## Accessibility & i18n

- [ ] Accessibility
  - [ ] Screen reader support
  - [ ] Keyboard navigation
  - [ ] High contrast mode
  - [ ] Reduced motion
- [ ] Internationalization
  - [ ] Multi-language UI
  - [ ] RTL support
  - [ ] Locale-specific formatting