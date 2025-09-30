import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, ButtonText, Icon, ButtonIcon } from '@gluestack-ui/themed';
import { Plus } from 'lucide-react-native';
import { theme } from '../../lib/theme';

interface FABProps {
  onPress: () => void;
  style?: any;
  accessibilityLabel?: string;
}

export const FAB: React.FC<FABProps> = ({
  onPress,
  style,
  accessibilityLabel = 'Add new note',
}) => {
  return (
    <Button
      size="lg"
      variant="solid"
      action="primary"
      style={[styles.fab, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      bg="$primary500"
      borderRadius="$full"
    >
      <ButtonIcon as={Plus} size="lg" color="$white" />
    </Button>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xxl,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});