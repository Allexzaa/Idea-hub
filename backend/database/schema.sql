-- IdeaNest Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (for development - be careful in production!)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS comment_helpful CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS nurtures CASCADE;
DROP TABLE IF EXISTS sparks CASCADE;
DROP TABLE IF EXISTS ideas CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS idea_stage CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Create custom types
CREATE TYPE idea_stage AS ENUM ('spark', 'growing', 'building', 'launched', 'validated');
CREATE TYPE notification_type AS ENUM ('spark', 'nurture', 'comment', 'message', 'collaboration_invite', 'helpful_comment');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);

-- Ideas (Threads) table
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Sparks (Interest reactions) table
CREATE TABLE sparks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, idea_id)
);

CREATE INDEX idx_sparks_user ON sparks(user_id);
CREATE INDEX idx_sparks_idea ON sparks(idea_id);

-- Nurtures (Help offers) table
CREATE TABLE nurtures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  help_message TEXT, -- "I can help with X"
  status VARCHAR(20) DEFAULT 'offered', -- 'offered', 'accepted', 'declined'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, idea_id)
);

CREATE INDEX idx_nurtures_user ON nurtures(user_id);
CREATE INDEX idx_nurtures_idea ON nurtures(idea_id);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Comment Helpful Marks table
CREATE TABLE comment_helpful (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_helpful_comment ON comment_helpful(comment_id);

-- Attachments/Files table
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Conversations table (for DMs)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (user1_id < user2_id), -- Ensure consistent ordering
  UNIQUE(user1_id, user2_id)
);

CREATE INDEX idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON ideas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some seed data for development (optional)
-- You can remove this in production

-- Sample user
INSERT INTO users (email, username, full_name, bio, skills_tags, help_with, email_verified)
VALUES
  ('demo@ideanest.com', 'demouser', 'Demo User', 'Just exploring IdeaNest!', ARRAY['design', 'development'], 'I can help with UI/UX design and frontend development', true);

-- Sample idea
INSERT INTO ideas (creator_id, title, description, category_tags, help_wanted_tags)
VALUES
  ((SELECT id FROM users WHERE username = 'demouser'),
   'Building a friendly idea-sharing platform',
   'Creating IdeaNest - a warm, collaborative space for sharing and improving ideas together!',
   ARRAY['tech', 'community'],
   ARRAY['design-feedback', 'brainstorming']);

COMMIT;

-- Display success message
SELECT 'Database schema created successfully! 🪺' as message;
