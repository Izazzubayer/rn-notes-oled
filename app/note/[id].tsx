import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, SafeAreaView, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, FileText, Trash2, Eye, Pencil } from 'lucide-react-native';
import { useNote, useCreateNote, useUpdateNote, useDeleteNote } from '../../hooks/useNotes';
import { IconButton } from '../components/IconButton';
import { MarkdownPreview } from '../components/MarkdownPreview';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { theme } from '../../lib/theme';
import { haptics } from '../../lib/haptics';
import { shareNoteAsMarkdown } from '../../lib/exportImport';

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNewNote = id === 'new';
  
  const { data: note, isLoading } = useNote(isNewNote ? '' : id);
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Initialize form with note data
  useEffect(() => {
    if (note && !isNewNote) {
      setTitle(note.title);
      setBody(note.body);
    }
  }, [note, isNewNote]);

  // Autosave functionality
  useEffect(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    const currentContent = `${title}|${body}`;
    if (currentContent === lastSavedRef.current) return;

    autosaveTimeoutRef.current = setTimeout(() => {
      handleAutosave();
    }, 1500);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [title, body]);

  const handleAutosave = async () => {
    if (!title.trim() && !body.trim()) return;

    try {
      if (isNewNote) {
        const newNote = await createNoteMutation.mutateAsync({
          title: title.trim() || 'Untitled',
          body: body.trim(),
        });
        // Navigate to the new note's URL
        if (newNote && newNote.id) {
          router.replace(`/note/${newNote.id}`);
        }
      } else if (note && note.id) {
        await updateNoteMutation.mutateAsync({
          id: note.id,
          data: {
            title: title.trim() || 'Untitled',
            body: body.trim(),
          },
        });
      }
      
      lastSavedRef.current = `${title}|${body}`;
    } catch (error) {
      console.error('Autosave failed:', error);
    }
  };

  const handleSave = async () => {
    await handleAutosave();
  };

  const handleShareMarkdown = async () => {
    if (!note) return;
    
    try {
      await shareNoteAsMarkdown(note);
      haptics.success();
    } catch (error) {
      console.error('Share markdown failed:', error);
    }
  };

  const handleDelete = async () => {
    if (note && note.id) {
      await deleteNoteMutation.mutateAsync(note.id);
      haptics.error();
      router.back();
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading && !isNewNote) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading note...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton onPress={handleBack} accessibilityLabel="Go back">
          <ArrowLeft size={24} color={theme.colors.text} />
        </IconButton>
        
        <View style={styles.headerActions}>
          {note && (
            <>
              <IconButton onPress={handleShareMarkdown} accessibilityLabel="Share as markdown">
                <FileText size={24} color={theme.colors.text} />
              </IconButton>
              
              <IconButton
                onPress={() => setShowDeleteDialog(true)}
                accessibilityLabel="Delete note"
              >
                <Trash2 size={24} color={theme.colors.danger} />
              </IconButton>
            </>
          )}
          
          <IconButton
            onPress={() => setIsPreviewMode(!isPreviewMode)}
            accessibilityLabel={isPreviewMode ? 'Switch to edit mode' : 'Switch to preview mode'}
          >
            {isPreviewMode ? (
              <Pencil size={24} color={theme.colors.text} />
            ) : (
              <Eye size={24} color={theme.colors.text} />
            )}
          </IconButton>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {isPreviewMode ? (
          <MarkdownPreview content={`# ${title}\n\n${body}`} />
        ) : (
          <>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Note title..."
              placeholderTextColor={theme.colors.textMuted}
              multiline={false}
              returnKeyType="next"
            />
            
            <TextInput
              style={styles.bodyInput}
              value={body}
              onChangeText={setBody}
              placeholder="Start writing..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  titleInput: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  bodyInput: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    padding: theme.spacing.lg,
    minHeight: 200,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textMuted,
  },
});
