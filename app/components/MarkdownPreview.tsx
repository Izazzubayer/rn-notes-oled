import React from 'react';
import { View, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { theme } from '../../lib/theme';

interface MarkdownPreviewProps {
  content: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  const markdownStyles = {
    body: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.base,
      lineHeight: 24,
    },
    heading1: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.xxl,
      fontWeight: theme.typography.fontWeight.bold,
      marginBottom: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    heading2: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    heading3: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    paragraph: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.base,
      lineHeight: 24,
      marginBottom: theme.spacing.md,
    },
    strong: {
      color: theme.colors.text,
      fontWeight: theme.typography.fontWeight.bold,
    },
    em: {
      color: theme.colors.text,
      fontStyle: 'italic' as const,
    },
    code_inline: {
      backgroundColor: theme.colors.muted,
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.sm,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
    },
    code_block: {
      backgroundColor: theme.colors.muted,
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.sm,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginVertical: theme.spacing.md,
    },
    link: {
      color: theme.colors.primary,
    },
    bullet_list: {
      marginBottom: theme.spacing.md,
    },
    ordered_list: {
      marginBottom: theme.spacing.md,
    },
    list_item: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.base,
      lineHeight: 24,
    },
    blockquote: {
      backgroundColor: theme.colors.muted,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
      paddingLeft: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      marginVertical: theme.spacing.md,
    },
  };

  return (
    <View style={styles.container}>
      <Markdown style={markdownStyles}>
        {content}
      </Markdown>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
  },
});
