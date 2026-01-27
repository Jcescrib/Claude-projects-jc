// Database schema definitions

export const CREATE_TABLES_SQL = `
  -- Habits table
  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    days_of_week TEXT NOT NULL,
    times_of_day TEXT NOT NULL,
    base_points INTEGER DEFAULT 3,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- Habit steps table
  CREATE TABLE IF NOT EXISTS habit_steps (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    response_type TEXT NOT NULL,
    multiple_choice_options TEXT,
    timer_enabled INTEGER DEFAULT 0,
    timer_seconds INTEGER DEFAULT 0,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
  );

  -- Habit completions table
  CREATE TABLE IF NOT EXISTS habit_completions (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL,
    habit_name TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    time_of_day TEXT NOT NULL,
    completed INTEGER NOT NULL,
    points_generated REAL NOT NULL,
    multiplier_used REAL NOT NULL,
    step_responses TEXT,
    FOREIGN KEY (habit_id) REFERENCES habits(id)
  );

  -- Streaks table
  CREATE TABLE IF NOT EXISTS streaks (
    habit_id TEXT PRIMARY KEY,
    current_streak INTEGER DEFAULT 0,
    locked_points REAL DEFAULT 0,
    fixed_points REAL DEFAULT 0,
    permanent_points REAL DEFAULT 0,
    last_completed_date TEXT,
    start_date TEXT,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
  );

  -- Safe points table
  CREATE TABLE IF NOT EXISTS safe_points (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    total REAL DEFAULT 0,
    last_updated TEXT NOT NULL
  );

  -- Rewards table
  CREATE TABLE IF NOT EXISTS rewards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cost REAL NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'available',
    redeemed_at TEXT,
    created_at TEXT NOT NULL
  );

  -- Daily status table
  CREATE TABLE IF NOT EXISTS daily_status (
    date TEXT PRIMARY KEY,
    is_perfect_day INTEGER DEFAULT 0,
    habits_completed INTEGER DEFAULT 0,
    total_habits INTEGER DEFAULT 0,
    bonus_awarded INTEGER DEFAULT 0
  );

  -- App settings table
  CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    perfect_day_bonus INTEGER DEFAULT 15,
    dark_mode INTEGER DEFAULT 0
  );

  -- Initialize safe_points if not exists
  INSERT OR IGNORE INTO safe_points (id, total, last_updated) VALUES (1, 0, datetime('now'));

  -- Initialize app_settings if not exists
  INSERT OR IGNORE INTO app_settings (id, perfect_day_bonus, dark_mode) VALUES (1, 15, 0);
`;

export const DROP_TABLES_SQL = `
  DROP TABLE IF EXISTS habit_completions;
  DROP TABLE IF EXISTS habit_steps;
  DROP TABLE IF EXISTS streaks;
  DROP TABLE IF EXISTS habits;
  DROP TABLE IF EXISTS safe_points;
  DROP TABLE IF EXISTS rewards;
  DROP TABLE IF EXISTS daily_status;
  DROP TABLE IF EXISTS app_settings;
`;
