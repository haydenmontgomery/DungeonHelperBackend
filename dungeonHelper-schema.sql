CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(25) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL
    CHECK (position('@' IN email) > 1),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE characters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(99) NOT NULL,
  class_name TEXT,
  bio TEXT,
  age INTEGER,
  height TEXT,
  level INTEGER DEFAULT 1,
  inventory TEXT[],
  gold INTEGER,
  hp INTEGER,
  profile_url TEXT DEFAULT '/static/images/default_profile.png',
  user_id INT REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  title TEXT UNIQUE NOT NULL,
  description TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  max_players INTEGER DEFAULT 5 ,
  public_view BOOLEAN DEFAULT FALSE
);

CREATE TABLE campaign_admins (
  campaign_id INT REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, user_id)
);

CREATE TABLE campaign_users (
  campaign_id INT REFERENCES campaigns(id) ON DELETE CASCADE,
  character_id INT REFERENCES characters(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, character_id)
);

CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(25) UNIQUE NOT NULL CHECK (name = lower(name)),
  password TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL,
  campaign_id INT REFERENCES campaigns(id) ON DELETE CASCADE,
  dungeon_master_id INT REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE session_players (
  session_id INT REFERENCES sessions(id) ON DELETE CASCADE,
  character_id INT REFERENCES characters(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, character_id)
);