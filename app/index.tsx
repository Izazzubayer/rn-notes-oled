import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { HStack, Heading, Text as GluestackText, VStack, Button, ButtonIcon } from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { useNotesList, useDeleteNote, useTogglePin } from '../hooks/useNotes';
import { useUIStore } from '../store/uiStore';
import { SearchBar } from './components/SearchBar';
import { NoteCard } from './components/NoteCard';
import { FAB } from './components/FAB';
import { EmptyState } from './components/EmptyState';
import { ConfirmDialog } from './components/ConfirmDialog';
import { IconButton } from './components/IconButton';
import { theme } from '../lib/theme';
import { haptics } from '../lib/haptics';
import { groupNotesByDate } from '../utils/date';

export default function HomeScreen() {
  const { search, setSearch } = useUIStore();
  const { data: notes = [], isLoading } = useNotesList(search);
  const deleteNoteMutation = useDeleteNote();
  const togglePinMutation = useTogglePin();
  
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const pinnedNotes = notes.filter(note => note.pinned === 1);
  const unpinnedNotes = notes.filter(note => note.pinned === 0);
  
  // Group unpinned notes by date
  const dateGroupedNotes = groupNotesByDate(unpinnedNotes);

  const handleNotePress = (noteId: string) => {
    router.push(`/note/${noteId}`);
  };

  const handleNoteLongPress = (noteId: string) => {
    // TODO: Show action sheet with pin/unpin, share, delete options
    haptics.medium();
  };

  const handleDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      deleteNoteMutation.mutate(noteToDelete);
      haptics.error();
    }
    setDeleteDialogVisible(false);
    setNoteToDelete(null);
  };

  const handleTogglePin = (noteId: string) => {
    togglePinMutation.mutate(noteId);
    haptics.light();
  };

  const handleCreateNote = () => {
    router.push('/note/new');
  };

  const renderNote = ({ item }: { item: any }) => (
    <NoteCard
      note={item}
      onPress={() => handleNotePress(item.id)}
      onLongPress={() => handleNoteLongPress(item.id)}
    />
  );

  const renderSection = (title: string, data: any[]) => {
    if (data.length === 0) return null;

    return (
      <VStack space="md" mb="$4">
        <Heading 
          size="sm" 
          color="$textLight400" 
          px="$4" 
          py="$2"
        >
          {title}
        </Heading>
        <FlatList
          data={data}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </VStack>
    );
  };


  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (notes.length === 0 && !search) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="No notes yet"
          subtitle="Create your first note to get started"
          actionText="Create Note"
          onAction={handleCreateNote}
        />
        <FAB onPress={handleCreateNote} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HStack justifyContent="space-between" alignItems="center" px="$4" py="$3">
        <Heading size="2xl" color="$textLight0">
          Your Notes
        </Heading>
        <Button
          onPress={() => router.push('/settings')}
          accessibilityLabel="Open settings"
          size="sm"
          variant="outline"
          action="secondary"
        >
          <ButtonIcon>
            <Text style={styles.headerIcon}>⚙️</Text>
          </ButtonIcon>
        </Button>
      </HStack>
      
      <SearchBar value={search} onChangeText={setSearch} />
      
      <FlatList
        data={[
          ...(pinnedNotes.length > 0 ? [{ type: 'pinned', data: pinnedNotes }] : []),
          ...dateGroupedNotes,
        ]}
        renderItem={({ item }) => {
          if (item.type === 'pinned') {
            return renderSection('Pinned', item.data);
          } else if (item.type === 'dateSection') {
            return renderSection((item as any).title, item.data);
          }
          return null;
        }}
        keyExtractor={(item, index) => item.type === 'pinned' ? 'pinned' : `date-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      
      <FAB onPress={handleCreateNote} />
      
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogVisible(false)}
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
  headerIcon: {
    fontSize: 20,
    color: theme.colors.text,
  },
  listContent: {
    paddingBottom: 100, // Space for FAB
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
