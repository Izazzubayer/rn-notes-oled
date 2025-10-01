import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Input, InputField, HStack, Button, ButtonIcon, Icon } from '@gluestack-ui/themed';
import { Search, X } from 'lucide-react-native';
import { theme } from '../../lib/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search notes...',
}) => {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleClear = () => {
    setInternalValue('');
    onChangeText('');
  };

  return (
    <View style={styles.container}>
      <HStack space="sm" alignItems="center">
        <Input 
          variant="outline" 
          size="md" 
          flex={1}
          borderColor="$borderDark800"
          borderRadius="$md"
        >
          <InputField
            value={internalValue}
            onChangeText={(text) => {
              setInternalValue(text);
              onChangeText(text);
            }}
            placeholder={placeholder}
            placeholderTextColor="$textLight400"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            color="$textLight0"
          />
        </Input>
        {internalValue.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            action="secondary"
            onPress={handleClear}
            accessibilityLabel="Clear search"
            bg="$backgroundDark950"
            borderColor="$borderDark800"
            borderRadius="$full"
          >
            <ButtonIcon as={X} size="sm" color="$textLight400" />
          </Button>
        )}
      </HStack>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
});
