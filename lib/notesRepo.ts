import { database, Note, Tag, NoteTag } from './db';

export interface CreateNoteData {
  title: string;
  body: string;
  tags?: string[];
}

export interface UpdateNoteData {
  title?: string;
  body?: string;
  pinned?: boolean;
  tags?: string[];
}

export interface NoteWithTags extends Note {
  tags: Tag[];
}

export class NotesRepository {
  async listNotes({ search, limit = 100 }: { search?: string; limit?: number } = {}): Promise<NoteWithTags[]> {
    let sql = `
      SELECT n.*, GROUP_CONCAT(t.name, ',') as tag_names
      FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
    `;
    
    const params: any[] = [];
    
    if (search) {
      sql += ` WHERE n.title LIKE ? OR n.body LIKE ? OR t.name LIKE ?`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    sql += `
      GROUP BY n.id
      ORDER BY n.pinned DESC, n.updated_at DESC
      LIMIT ?
    `;
    params.push(limit);
    
    const rows = await database.query<Note & { tag_names: string | null }>(sql, params);
    
    return rows.map(row => ({
      ...row,
      tags: row.tag_names 
        ? row.tag_names.split(',').map(name => ({ id: '', name }))
        : []
    }));
  }

  async getNote(id: string): Promise<NoteWithTags | null> {
    const sql = `
      SELECT n.*, GROUP_CONCAT(t.id || ':' || t.name, ',') as tag_data
      FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
      WHERE n.id = ?
      GROUP BY n.id
    `;
    
    const rows = await database.query<Note & { tag_data: string | null }>(sql, [id]);
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      ...row,
      tags: row.tag_data 
        ? row.tag_data.split(',').map(tagStr => {
            const [id, name] = tagStr.split(':');
            return { id, name };
          })
        : []
    };
  }

  async createNote({ title, body, tags = [] }: CreateNoteData): Promise<NoteWithTags> {
    const id = this.generateId();
    const now = Date.now();
    
    return await database.transaction(async () => {
      // Insert note
      await database.execute(
        'INSERT INTO notes (id, title, body, pinned, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
        [id, title, body, now, now]
      );
      
      // Insert tags and relationships
      if (tags.length > 0) {
        await this.upsertTags(tags);
        await this.linkNoteTags(id, tags);
      }
      
      return await this.getNote(id) as NoteWithTags;
    });
  }

  async updateNote(id: string, { title, body, pinned, tags }: UpdateNoteData): Promise<NoteWithTags> {
    const now = Date.now();
    
    return await database.transaction(async () => {
      // Build update query dynamically
      const updates: string[] = [];
      const params: any[] = [];
      
      if (title !== undefined) {
        updates.push('title = ?');
        params.push(title);
      }
      
      if (body !== undefined) {
        updates.push('body = ?');
        params.push(body);
      }
      
      if (pinned !== undefined) {
        updates.push('pinned = ?');
        params.push(pinned ? 1 : 0);
      }
      
      updates.push('updated_at = ?');
      params.push(now);
      params.push(id);
      
      if (updates.length > 1) { // More than just updated_at
        await database.execute(
          `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`,
          params
        );
      }
      
      // Update tags if provided
      if (tags !== undefined) {
        await this.unlinkNoteTags(id);
        if (tags.length > 0) {
          await this.upsertTags(tags);
          await this.linkNoteTags(id, tags);
        }
      }
      
      return await this.getNote(id) as NoteWithTags;
    });
  }

  async deleteNote(id: string): Promise<void> {
    await database.execute('DELETE FROM notes WHERE id = ?', [id]);
  }

  async togglePin(id: string): Promise<NoteWithTags> {
    const now = Date.now();
    
    await database.execute(
      'UPDATE notes SET pinned = NOT pinned, updated_at = ? WHERE id = ?',
      [now, id]
    );
    
    return await this.getNote(id) as NoteWithTags;
  }

  async listTags(): Promise<Tag[]> {
    const sql = 'SELECT * FROM tags ORDER BY name';
    return await database.query<Tag>(sql);
  }

  async upsertTags(tagNames: string[]): Promise<void> {
    for (const name of tagNames) {
      const id = this.generateId();
      await database.execute(
        'INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)',
        [id, name]
      );
    }
  }

  async tagsForNote(noteId: string): Promise<Tag[]> {
    const sql = `
      SELECT t.* FROM tags t
      JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = ?
      ORDER BY t.name
    `;
    return await database.query<Tag>(sql, [noteId]);
  }

  private async linkNoteTags(noteId: string, tagNames: string[]): Promise<void> {
    for (const tagName of tagNames) {
      const tagId = await this.getTagIdByName(tagName);
      if (tagId) {
        await database.execute(
          'INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)',
          [noteId, tagId]
        );
      }
    }
  }

  private async unlinkNoteTags(noteId: string): Promise<void> {
    await database.execute('DELETE FROM note_tags WHERE note_id = ?', [noteId]);
  }

  private async getTagIdByName(name: string): Promise<string | null> {
    const rows = await database.query<{ id: string }>('SELECT id FROM tags WHERE name = ?', [name]);
    return rows.length > 0 ? rows[0].id : null;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const notesRepository = new NotesRepository();
