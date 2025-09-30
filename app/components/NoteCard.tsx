import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Box, VStack, HStack, Text as GluestackText, Heading, Pressable as GluestackPressable } from '@gluestack-ui/themed';
import { NoteWithTags } from '../../lib/notesRepo';
import { TagPills } from './TagPills';
import { formatDate } from '../../utils/date';
import { theme } from '../../lib/theme';

interface NoteCardProps {
  note: NoteWithTags;
  onPress: () => void;
  onLongPress?: () => void;
}


export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onPress,
  onLongPress,
}) => {
  const getPreviewText = (body: string): string => {
    const lines = body.split('\n');
    const firstLine = lines[0] || '';
    const secondLine = lines[1] || '';
    
    if (firstLine.length > 100) {
      return firstLine.substring(0, 100) + '...';
    }
    
    if (firstLine.length + secondLine.length > 100) {
      return firstLine + ' ' + secondLine.substring(0, 100 - firstLine.length) + '...';
    }
    
    return firstLine + (secondLine ? ' ' + secondLine : '');
  };

  return (
    <Box style={styles.container}>
      <GluestackPressable
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityLabel={`Note: ${note.title}`}
      >
        <VStack space="sm" p="$4">
          <HStack justifyContent="space-between" alignItems="center">
            <Heading 
              size="sm" 
              color="$textLight0" 
              flex={1} 
              numberOfLines={1}
            >
              {note.title || 'Untitled'}
            </Heading>
            {note.pinned === 1 && (
              <Text>📌</Text>
            )}
          </HStack>
          
          {note.body && (
            <GluestackText 
              size="sm" 
              color="$textLight300" 
              numberOfLines={2}
              lineHeight="$sm"
            >
              {getPreviewText(note.body)}
            </GluestackText>
          )}
          
          <HStack justifyContent="space-between" alignItems="center">
            <TagPills tags={note.tags} />
            <GluestackText 
              size="xs" 
              color="$textLight400"
            >
              {formatDate(note.updated_at)}
            </GluestackText>
          </HStack>
        </VStack>
      </GluestackPressable>
    </Box>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});