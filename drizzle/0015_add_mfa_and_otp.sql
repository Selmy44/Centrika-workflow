-- Create MFA method type enum
CREATE TYPE mfa_method_type AS ENUM ('email', 'sms', 'totp');

-- MFA Methods table - track what authentication methods each user has enabled
CREATE TABLE mfa_methods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method mfa_method_type NOT NULL,
  phone_number VARCHAR(20),
  is_enabled BOOLEAN DEFAULT false NOT NULL,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  backup_codes TEXT, -- JSON array of backup codes for TOTP
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, method)
);

-- OTP Tokens table - temporary storage for one-time passwords
CREATE TABLE otp_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  method mfa_method_type NOT NULL,
  destination VARCHAR(320), -- email or phone number where OTP was sent
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER DEFAULT 0 NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for faster OTP lookups
CREATE INDEX idx_otp_tokens_user_id_method ON otp_tokens(user_id, method);
CREATE INDEX idx_otp_tokens_expires_at ON otp_tokens(expires_at);

-- Magic Links table - for magic link authentication
CREATE TABLE magic_links (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT false NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for magic link lookups
CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_expires_at ON magic_links(expires_at);

-- MFA Session table - temporary sessions during MFA verification
CREATE TABLE mfa_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  login_method VARCHAR(64) NOT NULL, -- 'email', 'password', etc
  is_mfa_verified BOOLEAN DEFAULT false NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for session lookups
CREATE INDEX idx_mfa_sessions_token ON mfa_sessions(session_token);
CREATE INDEX idx_mfa_sessions_expires_at ON mfa_sessions(expires_at);
