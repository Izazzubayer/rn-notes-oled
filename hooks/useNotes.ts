import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesRepository, CreateNoteData, UpdateNoteData, NoteWithTags } from '../lib/notesRepo';
import { useDebounce } from '../utils/debounce';

export const useNotesList = (search: string) => {
  const debouncedSearch = useDebounce(search, 300);
  
  return useQuery({
    queryKey: ['notes', { search: debouncedSearch }],
    queryFn: () => notesRepository.listNotes({ search: debouncedSearch }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useNote = (id: string) => {
  return useQuery({
    queryKey: ['note', id],
    queryFn: () => notesRepository.getNote(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateNoteData) => notesRepository.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteData }) => 
      notesRepository.updateNote(id, data),
    onSuccess: (updatedNote) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.setQueryData(['note', updatedNote.id], updatedNote);
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notesRepository.deleteNote(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.removeQueries({ queryKey: ['note', deletedId] });
    },
  });
};

export const useTogglePin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notesRepository.togglePin(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notes'] });
      
      // Snapshot previous value
      const previousNotes = queryClient.getQueryData(['notes']);
      
      // Optimistically update
      queryClient.setQueryData(['notes'], (old: NoteWithTags[] | undefined) => {
        if (!old) return old;
        return old.map(note => 
          note.id === id 
            ? { ...note, pinned: note.pinned === 1 ? 0 : 1 }
            : note
        );
      });
      
      return { previousNotes };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes'], context.previousNotes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};
