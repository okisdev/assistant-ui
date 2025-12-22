# Demo App Roadmap

> A full-stack demo showcasing assistant-ui capabilities

## Authentication

- [x] Email/Password signup & login
- [x] Social OAuth
  - [x] GitHub
  - [ ] Google
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
  - [x] Search threads
  - [ ] Folders / Tags
  - [ ] Bulk delete
- [x] Messaging
  - [x] Send message
  - [x] Streaming response
  - [x] Edit user message
  - [x] Regenerate response
  - [x] Copy message
  - [x] Export message as Markdown
  - [ ] File attachments
  - [ ] Image upload
- [x] Branching
  - [x] Create branches (edit & regenerate)
  - [x] Branch picker navigation
  - [x] Branch count display
- [x] Message persistence
  - [x] PostgreSQL storage
  - [x] History adapter
  - [x] Message format adapter (AI SDK v5)

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
- [ ] Code execution
  - [ ] Enable/disable toggle
  - [ ] Sandboxed execution
  - [ ] Code output display

## AI Features

- [x] Model integration
  - [x] GPT-4o via AI SDK
  - [ ] Model selector (Claude, Gemini, etc.)
- [ ] Customization
  - [ ] System prompt editor
  - [ ] Temperature control
  - [ ] Max tokens setting
- [ ] Advanced
  - [ ] Tool use visualization
  - [ ] Reasoning steps display
  - [ ] Token usage display

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

- [ ] Images
  - [ ] Image upload & recognition
  - [ ] Image generation display
- [ ] Audio
  - [ ] Voice input (STT)
  - [ ] Voice output (TTS)

## Dashboard

- [ ] Usage statistics
  - [ ] API calls
  - [ ] Token consumption
  - [ ] Cost tracking
- [ ] API key management

## UI Components

- [x] Layout
  - [x] Collapsible sidebar
  - [x] Mobile responsive
  - [x] App layout wrapper
- [x] Thread UI
  - [x] Welcome message
  - [x] Scroll to bottom
  - [x] Loading indicator
- [x] Message UI
  - [x] User message bubble
  - [x] Assistant message
  - [x] Action bar (copy, edit, reload, feedback)
- [x] Markdown rendering
  - [x] GFM support
  - [x] Syntax highlighting
  - [x] Code block copy
  - [x] Tables
- [x] Feedback
  - [x] Toast notifications
  - [x] Confirmation dialogs
  - [x] Loading skeletons

---

## Upstream Issues

> See [enhancements.md](./enhancements.md) for details

- [ ] `ThreadListItemPrimitive.Trigger` lacks `href` support
- [ ] `ThreadListItemPrimitive` needs custom actions dropdown
- [ ] `FeedbackAdapter` loses state with `MessageFormatAdapter`
