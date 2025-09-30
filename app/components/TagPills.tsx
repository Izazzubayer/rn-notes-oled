import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { theme } from '../../lib/theme';

interface Tag {
  id: string;
  name: string;
}

interface TagPillsProps {
  tags: Tag[];
  maxVisible?: number;
}

export const TagPills: React.FC<TagPillsProps> = ({ tags, maxVisible = 3 }) => {
  if (tags.length === 0) return null;

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  const renderTag = ({ item }: { item: Tag }) => (
    <View style={styles.tag}>
      <Text style={styles.tagText}>#{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={visibleTags}
        renderItem={renderTag}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsList}
      />
      {remainingCount > 0 && (
        <View style={styles.moreTag}>
          <Text style={styles.moreText}>+{remainingCount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsList: {
    paddingRight: theme.spacing.xs,
  },
  tag: {
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  tagText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.fontWeight.medium,
  },
  moreTag: {
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  moreText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
