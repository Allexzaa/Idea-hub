# IdeaNest - Design Document

**Tagline:** *A safe, warm space where ideas hatch and grow together*

---

## 🎯 Vision

IdeaNest is a friendly, collaborative idea-sharing platform where people from all backgrounds—entrepreneurs, students, hobbyists, professionals—can share ideas, pain points, and solutions in a supportive environment. Unlike Reddit or traditional forums, IdeaNest focuses on **positive collaboration, growth tracking, and human connection**.

---

## 🌟 Core Principles

1. **No Negativity** - No downvotes, only constructive support
2. **People-First** - Show the human behind every idea
3. **Collaboration > Competition** - Ideas can have multiple co-creators
4. **Growth Journey** - Track how ideas evolve from spark to reality
5. **Kindness Rewarded** - Recognition for helpful community members

---

## 🚀 Unique Value Propositions

### What Makes IdeaNest Different:

1. **Spark & Nurture System** (not upvote/downvote)
   - **Spark ✨** - "This interests me!"
   - **Nurture 🌱** - "I can help with this!"
   - No negative voting

2. **Idea Journey Stages**
   ```
   💭 Spark → 🌱 Growing → 🔨 Building → 🚀 Launched → ✅ Validated
   ```
   - Visual progress tracking
   - Stage-specific help requests

3. **Co-Creation Model**
   - Invite collaborators to become co-owners
   - Shared credit system
   - Team formation celebrations

4. **Warm Community Features**
   - Helpfulness Score (not just post popularity)
   - Buddy system for new users
   - Gratitude Wall
   - Direct messaging for connections

5. **Rich Collaboration Tools**
   - Comments with threaded discussions
   - File sharing (PDFs, images, links)
   - "Help Wanted" specific tags
   - Optional voice notes (Phase 2)

---

## 👥 Target Audience

**Primary:** Everyone with ideas - inclusive by design
- Solo entrepreneurs
- Students working on projects
- Hobbyists and makers
- Product managers
- Creative professionals
- Anyone seeking feedback or collaboration

---

## 📱 Platform Strategy

**Phase 1:** Web application (React)
**Phase 2:** Mobile app (React Native/Expo)
**Phase 3:** Progressive Web App (PWA) for mobile-web experience

---

## 🎨 Core Features

### MVP (Phase 1) - Essential Features

#### 1. Authentication
- Email/Password signup
- Google OAuth
- GitHub OAuth (for developers)
- Magic link (passwordless email)
- Profile setup on first login

#### 2. User Profiles
- Name, avatar, bio
- Skills/Interests tags
- "What I can help with" section
- Public idea history
- Helpfulness Score
- Join date

#### 3. Idea Threads (Main Content)
**Create Thread:**
- Title (required)
- Description (rich text editor)
- Idea stage (💭 Spark by default)
- Category/Industry tags
- "Help Wanted" tags:
  - 🎨 Design feedback
  - 💻 Technical co-founder
  - 📊 Market validation
  - 💡 Brainstorming
  - 🔍 Similar makers
  - 💰 Funding advice
  - 🎯 Business model help

**Thread Display:**
- Creator info (name, avatar, brief intro)
- Spark count (✨)
- Nurture count (🌱)
- Comment count
- Stage indicator
- Time posted
- Attached files preview

#### 4. Interaction System

**Spark (✨):**
- "This interests me!"
- Adds to your "Sparked Ideas" collection
- Notifies creator

**Nurture (🌱):**
- "I can help!"
- Opens quick form: "How can you help?"
- Creates notification + direct connection

**Comments:**
- Threaded discussions
- Rich text support
- Attach files/links
- Mark as "Helpful" (contributes to Helpfulness Score)
- @ mentions

#### 5. File Sharing
- Upload: PDF, images (JPG, PNG), documents
- Link embeds with preview
- Max file size: 10MB (MVP)
- Virus scanning

#### 6. Direct Messaging
- One-on-one conversations
- "Coffee Chat" button on profiles
- Notification system

#### 7. Feed & Discovery
- **Home Feed:** Recent ideas (chronological + relevance)
- **Filter by:**
  - Idea stage
  - Help wanted tags
  - Categories
- **Sort by:**
  - Recent
  - Most sparked
  - Most nurtured
- **Search:** Full-text search on titles/descriptions

#### 8. Notifications
- Someone sparked your idea
- Someone wants to nurture (help)
- New comments on your threads
- Direct messages
- Collaboration invites
- In-app + email options

---

### Phase 2 Features (Post-MVP)

#### 1. Advanced Collaboration
- **Co-creator invites** - Make others co-owners
- **Accountability Pods** - Small groups (4-6 people)
- **Private Idea Incubators** - Invite-only spaces
- **Industry Circles** - E.g., "HealthTech Nest", "EdTech Nest"

#### 2. Enhanced Interactions
- Voice notes on threads
- Video embeds (YouTube, Loom)
- Screen recording uploads
- Figma/Miro embeds
- Version history for idea edits

#### 3. Community Building
- **Buddy System** - Pair new users with mentors
- **Weekly Idea Mixer** - Random pairing for coffee chats
- **Community Events** - Virtual meetups
- **Gratitude Wall** - Public thank-yous

#### 4. Recognition System
- **Badges:**
  - 🏅 Idea Champion (top helper)
  - 🚀 Serial Launcher (multiple validated ideas)
  - 🤝 Super Connector (intro'd many people)
  - 💡 Spark Starter (many sparked ideas)
- **Leaderboards** (optional, opt-in)
- **Monthly highlights**

#### 5. AI Enhancements
- Idea matching (find similar ideas/people)
- Smart tagging suggestions
- Summarize long threads
- Translation for global community

#### 6. Monetization (Optional)
- Free forever for core features
- Premium tier:
  - Unlimited file storage
  - Priority support
  - Advanced analytics
  - Private communities hosting
- No ads (keep it friendly)

---

## 🎨 Design Principles

### Visual Identity
- **Color Palette:**
  - Primary: Warm orange (#FF8C42) - Energy, creativity
  - Secondary: Soft green (#7ED957) - Growth, nurturing
  - Accent: Sky blue (#4A90E2) - Trust, calm
  - Neutrals: Warm grays, not cold

- **Typography:**
  - Friendly, rounded sans-serif (e.g., Inter, Poppins)
  - Clear hierarchy

- **UI Style:**
  - Rounded corners (no harsh edges)
  - Generous spacing
  - Approachable, not corporate
  - Celebration animations

### Micro-copy & Tone
- Encouraging, never harsh
- Examples:
  - "Share your spark!" (not "Submit")
  - "Your idea matters" (not "Post")
  - "Find your tribe" (not "Browse users")
  - "Nurture this idea" (not "Help")

### Accessibility
- WCAG AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode

---

## 🏗️ Technical Architecture

### Frontend Stack

**Web Application (Phase 1):**
- **Framework:** React 18+
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Headless UI
- **State Management:** Zustand or React Context + TanStack Query
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod validation
- **Rich Text Editor:** Tiptap or Lexical
- **File Upload:** React Dropzone
- **Real-time:** Socket.io client

**Mobile Application (Phase 2):**
- **Framework:** Expo (React Native)
- **Navigation:** Expo Router
- **Shared code:** Reuse business logic, API calls

### Backend Stack

**API Server:**
- **Runtime:** Node.js 20+
- **Framework:** Express.js or Fastify
- **Language:** TypeScript
- **API Style:** RESTful (Phase 1) + GraphQL (Phase 2 optional)
- **Real-time:** Socket.io for live notifications
- **Validation:** Zod

**Authentication:**
- **Library:** Passport.js
- **Strategies:**
  - Local (email/password)
  - Google OAuth 2.0
  - GitHub OAuth
- **JWT:** Access + Refresh tokens
- **Magic Links:** Email-based passwordless auth

**Database:**
- **Primary:** PostgreSQL 15+
  - Relational data (users, threads, comments)
  - Full-text search
- **Cache:** Redis
  - Session storage
  - Rate limiting
  - Real-time data

**File Storage:**
- **Development:** Local filesystem
- **Production:** AWS S3 or Cloudinary
- **Security:** Virus scanning, file type validation

**Email Service:**
- **Provider:** SendGrid or AWS SES
- **Use cases:**
  - Welcome emails
  - Notifications
  - Magic links
  - Weekly digests

---

## 🗄️ Database Schema

### Core Tables

#### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- nullable for OAuth users
  full_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  skills_tags TEXT[], -- Array of skills
  help_with TEXT, -- What they can help with
  helpfulness_score INT DEFAULT 0,
  oauth_provider VARCHAR(50), -- 'google', 'github', 'email'
  oauth_id VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

#### Ideas (Threads)
```sql
CREATE TYPE idea_stage AS ENUM ('spark', 'growing', 'building', 'launched', 'validated');

CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  stage idea_stage DEFAULT 'spark',
  category_tags TEXT[], -- e.g., ['healthtech', 'saas']
  help_wanted_tags TEXT[], -- e.g., ['design-feedback', 'technical-cofounder']
  spark_count INT DEFAULT 0,
  nurture_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ideas_creator ON ideas(creator_id);
CREATE INDEX idx_ideas_stage ON ideas(stage);
CREATE INDEX idx_ideas_created ON ideas(created_at DESC);
CREATE INDEX idx_ideas_category ON ideas USING GIN(category_tags);
CREATE INDEX idx_ideas_help_wanted ON ideas USING GIN(help_wanted_tags);
```

#### Sparks (Interest reactions)
```sql
CREATE TABLE sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, idea_id)
);

CREATE INDEX idx_sparks_user ON sparks(user_id);
CREATE INDEX idx_sparks_idea ON sparks(idea_id);
```

#### Nurtures (Help offers)
```sql
CREATE TABLE nurtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  help_message TEXT, -- "I can help with X"
  status VARCHAR(20) DEFAULT 'offered', -- 'offered', 'accepted', 'declined'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, idea_id)
);

CREATE INDEX idx_nurtures_user ON nurtures(user_id);
CREATE INDEX idx_nurtures_idea ON nurtures(idea_id);
```

#### Comments
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- for threading
  content TEXT NOT NULL,
  helpful_count INT DEFAULT 0, -- users can mark as helpful
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_idea ON comments(idea_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
```

#### Comment Helpful Marks
```sql
CREATE TABLE comment_helpful (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_helpful_comment ON comment_helpful(comment_id);
```

#### Files/Attachments
```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50), -- 'pdf', 'image', 'link'
  file_size INT, -- in bytes
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (idea_id IS NOT NULL OR comment_id IS NOT NULL)
);

CREATE INDEX idx_attachments_idea ON attachments(idea_id);
CREATE INDEX idx_attachments_comment ON attachments(comment_id);
```

#### Direct Messages
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
```

#### Notifications
```sql
CREATE TYPE notification_type AS ENUM (
  'spark', 'nurture', 'comment', 'message',
  'collaboration_invite', 'helpful_comment'
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE CASCADE, -- who triggered it
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register          - Email/password signup
POST   /api/auth/login             - Email/password login
POST   /api/auth/logout            - Logout (invalidate token)
POST   /api/auth/refresh           - Refresh access token
GET    /api/auth/google            - Google OAuth
GET    /api/auth/google/callback   - Google OAuth callback
GET    /api/auth/github            - GitHub OAuth
GET    /api/auth/github/callback   - GitHub OAuth callback
POST   /api/auth/magic-link        - Send magic link
GET    /api/auth/verify/:token     - Verify magic link
```

### Users
```
GET    /api/users/me               - Get current user profile
PUT    /api/users/me               - Update profile
GET    /api/users/:id              - Get user by ID
GET    /api/users/:id/ideas        - Get user's ideas
GET    /api/users/:id/activity     - Get user's activity
```

### Ideas
```
GET    /api/ideas                  - List ideas (paginated, filtered)
POST   /api/ideas                  - Create new idea
GET    /api/ideas/:id              - Get idea details
PUT    /api/ideas/:id              - Update idea (creator only)
DELETE /api/ideas/:id              - Delete idea (creator only)
PUT    /api/ideas/:id/stage        - Update idea stage
POST   /api/ideas/:id/spark        - Spark an idea
DELETE /api/ideas/:id/spark        - Remove spark
POST   /api/ideas/:id/nurture      - Offer to help
GET    /api/ideas/:id/nurtures     - Get nurture offers
```

### Comments
```
GET    /api/ideas/:id/comments     - Get comments for idea
POST   /api/ideas/:id/comments     - Add comment
PUT    /api/comments/:id           - Update comment
DELETE /api/comments/:id           - Delete comment
POST   /api/comments/:id/helpful   - Mark as helpful
```

### Files
```
POST   /api/upload                 - Upload file
GET    /api/attachments/:id        - Get attachment info
DELETE /api/attachments/:id        - Delete attachment
```

### Messages
```
GET    /api/conversations          - List conversations
GET    /api/conversations/:id      - Get conversation messages
POST   /api/conversations          - Start conversation
POST   /api/conversations/:id/messages - Send message
PUT    /api/messages/:id/read      - Mark as read
```

### Notifications
```
GET    /api/notifications          - List notifications
PUT    /api/notifications/:id/read - Mark as read
PUT    /api/notifications/read-all - Mark all as read
```

### Search
```
GET    /api/search/ideas           - Search ideas
GET    /api/search/users           - Search users
```

---

## 🔒 Security Considerations

1. **Authentication:**
   - Bcrypt password hashing (12+ rounds)
   - JWT with short expiry (15 min access, 7 day refresh)
   - HTTP-only cookies for tokens
   - CSRF protection

2. **Authorization:**
   - Resource ownership checks
   - Role-based access (user, moderator, admin)
   - Rate limiting (Redis)

3. **Input Validation:**
   - Zod schemas on all inputs
   - SQL injection prevention (parameterized queries)
   - XSS prevention (sanitize HTML)

4. **File Security:**
   - File type validation
   - Size limits
   - Virus scanning (ClamAV)
   - Signed URLs for downloads

5. **API Security:**
   - CORS configuration
   - Helmet.js for headers
   - Rate limiting per endpoint
   - Request size limits

---

## 📊 User Flows

### New User Journey
1. Land on homepage → See featured ideas
2. Click "Join IdeaNest"
3. Choose auth method (email/Google/GitHub)
4. Complete profile (name, avatar, bio, skills)
5. See onboarding tips
6. Browse feed or create first idea

### Sharing an Idea
1. Click "Share Your Spark" button
2. Fill form:
   - Title
   - Description (rich text)
   - Category tags
   - Help wanted tags
3. Optional: Upload files
4. Preview
5. Publish
6. Get shareable link
7. See in feed

### Helping Someone
1. Browse feed
2. Find interesting idea
3. Option A: Click "Spark" (bookmark/interest)
4. Option B: Click "Nurture" → Describe how you can help
5. Creator gets notification
6. Direct message opens
7. Conversation begins

### Collaborating
1. Idea creator clicks "Invite Collaborator"
2. Search for user
3. Send invite with message
4. User accepts
5. Both become co-owners
6. Shared credit on idea

---

## 🎯 MVP Development Roadmap

### Phase 1.1 - Foundation (Weeks 1-2)
- [ ] Project setup (React + Node.js + PostgreSQL)
- [ ] Database schema implementation
- [ ] Auth system (email + Google OAuth)
- [ ] User registration and login
- [ ] Basic user profiles

### Phase 1.2 - Core Features (Weeks 3-4)
- [ ] Create/read/update ideas
- [ ] Feed with filtering
- [ ] Spark system
- [ ] Comments (no threading yet)
- [ ] Basic file upload

### Phase 1.3 - Interaction (Weeks 5-6)
- [ ] Nurture system
- [ ] Direct messaging
- [ ] Notifications (in-app)
- [ ] Search functionality
- [ ] User profiles (public view)

### Phase 1.4 - Polish (Week 7-8)
- [ ] UI/UX refinements
- [ ] Email notifications
- [ ] Idea stage management
- [ ] Threaded comments
- [ ] Mobile responsive design
- [ ] Testing & bug fixes

### Phase 1.5 - Launch (Week 9)
- [ ] Deploy to production
- [ ] Monitoring & analytics
- [ ] Beta user onboarding
- [ ] Feedback collection

---

## 📈 Success Metrics

### MVP Goals
- 100 registered users in first month
- 50+ ideas shared
- 200+ comments
- 10+ collaborations formed
- 80% user retention (week 1)

### Key Metrics to Track
- **Engagement:**
  - Daily/weekly active users
  - Ideas created per week
  - Comments per idea
  - Spark/nurture ratio

- **Community Health:**
  - Average helpfulness score
  - Response time to nurture offers
  - Conversation starts from ideas
  - Collaboration invites sent/accepted

- **Growth:**
  - New user signups
  - Referral rate
  - Time to first idea (onboarding)
  - Retention (D1, D7, D30)

---

## 🎨 UI/UX Wireframes (Text Description)

### Homepage (Logged Out)
```
+------------------------------------------+
| 🪺 IdeaNest          Login | Join        |
+------------------------------------------+
|                                          |
|    A safe space where ideas grow        |
|                                          |
|        [Join IdeaNest] [See Ideas]      |
|                                          |
|  Features: No downvotes | Collaboration |
|                                          |
+------------------------------------------+
```

### Feed (Logged In)
```
+------------------------------------------+
| 🪺 IdeaNest  [Search]  [@User]  [🔔]     |
+------------------------------------------+
| [Share Your Spark]                       |
+------------------------------------------+
| Filter: [All Stages] [Help Wanted] [...] |
| Sort: [Recent] [Most Sparked]            |
+------------------------------------------+
|                                          |
| 💭 Looking for feedback on my app idea  |
| by @john · 2h ago · Growing stage        |
|                                          |
| Brief description preview...             |
|                                          |
| 🎨 Design feedback  💡 Brainstorming     |
|                                          |
| ✨ 12 Sparks  🌱 3 Nurtures  💬 8        |
| [Spark] [Nurture]                        |
+------------------------------------------+
| ... more ideas ...                       |
+------------------------------------------+
```

### Idea Detail Page
```
+------------------------------------------+
| 🪺 IdeaNest                    [Back]    |
+------------------------------------------+
|                                          |
| 💭 My Idea Title                         |
| Stage: [Growing] [Update Stage]          |
|                                          |
| 👤 @john · 2h ago                        |
| "What I can help with: Design, UX"       |
| [Message] [Follow]                       |
|                                          |
| Full description with rich text...      |
| - Bullet points                          |
| - Images                                 |
|                                          |
| 📎 Files: design.pdf, mockup.png         |
|                                          |
| Tags: 🎨 Design feedback  💡 Brainstorm  |
|                                          |
| ✨ 12 Sparks  🌱 3 Nurtures              |
| [Spark This Idea] [Offer to Help]        |
|                                          |
+------------------------------------------+
| 💬 Comments (8)                          |
+------------------------------------------+
| @sarah · 1h ago · ⭐ Helpful (3)         |
| Great idea! Have you considered...       |
|   └ @john · 30m ago                      |
|     Thanks! Yes, I thought about...      |
+------------------------------------------+
```

---

## 🚀 Next Steps

1. **Setup Development Environment**
   - Initialize Git repo
   - Setup React frontend
   - Setup Node.js backend
   - Configure PostgreSQL

2. **Start with Auth & Users**
   - Implement registration/login
   - User profiles

3. **Build Core Features**
   - Ideas CRUD
   - Feed & discovery
   - Spark/Nurture

4. **Add Interactions**
   - Comments
   - Messaging
   - Notifications

5. **Polish & Launch**
   - UI refinements
   - Testing
   - Deploy

---

## 📝 Notes

- Keep it simple for MVP - ship fast, learn fast
- Focus on community warmth from day one
- Gather feedback early and often
- Build in public, share the journey
- Start with web, mobile comes later

---

**Ready to build IdeaNest! 🪺✨**
