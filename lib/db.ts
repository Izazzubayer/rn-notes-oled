import * as SQLite from 'expo-sqlite';

export interface Note {
  id: string;
  title: string;
  body: string;
  pinned: number; // 0 or 1
  created_at: number;
  updated_at: number;
}

export interface Tag {
  id: string;
  name: string;
}

export interface NoteTag {
  note_id: string;
  tag_id: string;
}

class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    
    this.db = await SQLite.openDatabaseAsync('notes.db');
    
    // Enable WAL mode for better performance
    await this.db.execAsync('PRAGMA journal_mode=WAL;');
    
    // Create tables
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        pinned INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      );
    `);

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
      );
    `);

    // Create indexes
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_notes_updated 
      ON notes(updated_at DESC);
    `);

    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_notes_pinned_updated 
      ON notes(pinned DESC, updated_at DESC);
    `);
  }

  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const result = await this.db.getAllAsync(sql, params);
    return result as T[];
  }

  async execute(sql: string, params: any[] = []): Promise<SQLite.SQLiteRunResult> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return await this.db.runAsync(sql, params);
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return await this.db.withTransactionAsync(fn as () => Promise<void>) as T;
  }
}

export const database = new Database();
