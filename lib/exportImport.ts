import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { notesRepository, NoteWithTags } from './notesRepo';

export interface BackupData {
  notes: NoteWithTags[];
  exportedAt: number;
  version: string;
}

export const exportAllNotes = async (): Promise<string> => {
  const notes = await notesRepository.listNotes({ limit: 10000 });
  const backupData: BackupData = {
    notes,
    exportedAt: Date.now(),
    version: '1.0.0',
  };

  const fileName = `notes-backup-${new Date().toISOString().split('T')[0]}.json`;
  const fileUri = FileSystem.Paths.document + fileName;
  
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupData, null, 2));
  
  return fileUri;
};

export const shareNoteAsText = async (note: NoteWithTags): Promise<void> => {
  const content = `# ${note.title}\n\n${note.body}`;
  const fileName = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
  const fileUri = FileSystem.Paths.cache + fileName;
  
  await FileSystem.writeAsStringAsync(fileUri, content);
  
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/plain',
      dialogTitle: 'Share Note',
    });
  }
};

export const shareNoteAsMarkdown = async (note: NoteWithTags): Promise<void> => {
  const content = `# ${note.title}\n\n${note.body}`;
  const fileName = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
  const fileUri = FileSystem.Paths.cache + fileName;
  
  await FileSystem.writeAsStringAsync(fileUri, content);
  
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/markdown',
      dialogTitle: 'Share Note as Markdown',
    });
  }
};

export const importNotes = async (fileUri: string): Promise<{ imported: number; updated: number }> => {
  const content = await FileSystem.readAsStringAsync(fileUri);
  const backupData: BackupData = JSON.parse(content);
  
  let imported = 0;
  let updated = 0;
  
  for (const note of backupData.notes) {
    try {
      const existingNote = await notesRepository.getNote(note.id);
      
      if (existingNote) {
        await notesRepository.updateNote(note.id, {
          title: note.title,
          body: note.body,
          pinned: note.pinned === 1,
          tags: note.tags.map(tag => tag.name),
        });
        updated++;
      } else {
        await notesRepository.createNote({
          title: note.title,
          body: note.body,
          tags: note.tags.map(tag => tag.name),
        });
        imported++;
      }
    } catch (error) {
      console.error(`Failed to import note ${note.id}:`, error);
    }
  }
  
  return { imported, updated };
};