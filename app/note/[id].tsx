import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, SafeAreaView, ScrollView, Pressable, KeyboardAvoidingView, Platform, Keyboard, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ChevronDown, List, ListOrdered, Quote, MoreVertical, Minus, Square } from 'lucide-react-native';
import { Checkbox, CheckboxIndicator, CheckboxIcon, CheckIcon, CheckboxLabel, HStack } from '@gluestack-ui/themed';
import { useNote, useCreateNote, useUpdateNote } from '../../hooks/useNotes';
import { theme } from '../../lib/theme';
import { haptics } from '../../lib/haptics';

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNewNote = id === 'new';
  
  const { data: note, isLoading } = useNote(isNewNote ? '' : id);
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [isEditingBody, setIsEditingBody] = useState(false);
  
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const bodyInputRef = useRef<TextInput>(null);

  // Initialize form with note data
  useEffect(() => {
    if (note && !isNewNote) {
      setTitle(note.title);
      setBody(note.body);
      setLastSavedTime(note.updated_at);
    }
  }, [note, isNewNote]);

  // Keyboard visibility listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Autosave functionality
  useEffect(() => {
    const handleAutosave = async () => {
      // Double-check conditions before saving
      if (!title.trim() && !body.trim()) {
        return;
      }

      setIsSaving(true);
      try {
        if (isNewNote) {
          // Create new note
          const newNote = await createNoteMutation.mutateAsync({
            title: title.trim() || 'Untitled',
            body: body.trim(),
          });
          if (newNote?.id) {
            router.replace(`/note/${newNote.id}`);
            setLastSavedTime(Date.now());
          }
        } else {
          // Update existing note - capture ID before async call
          const noteId = note?.id;
          if (!noteId) {
            setIsSaving(false);
            return;
          }
          
          await updateNoteMutation.mutateAsync({
            id: noteId,
            data: {
              title: title.trim() || 'Untitled',
              body: body.trim(),
            },
          });
          setLastSavedTime(Date.now());
        }
        
        lastSavedRef.current = `${title}|${body}`;
        haptics.light();
      } catch (error) {
        console.error('Autosave failed:', error);
      } finally {
        setIsSaving(false);
      }
    };

    // Clear any existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Early returns - don't schedule autosave if conditions aren't met
    const currentContent = `${title}|${body}`;
    if (currentContent === lastSavedRef.current) return;
    if (!title.trim() && !body.trim()) return; // Don't autosave empty notes
    
    // For existing notes, wait until note data is loaded
    if (!isNewNote && !note) {
      return;
    }

    // Schedule autosave
    autosaveTimeoutRef.current = setTimeout(() => {
      handleAutosave();
    }, 1500);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [title, body, note, isNewNote, createNoteMutation, updateNoteMutation]);

  const handleBack = () => {
    router.back();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleBodyChange = (text: string) => {
    // Check if the last character added was a space
    if (text.length > body.length && text[text.length - 1] === ' ') {
      // Find the current line
      const lines = text.split('\n');
      const currentLineIndex = text.substring(0, text.length).split('\n').length - 1;
      const currentLine = lines[currentLineIndex];
      
      // Check for numbered list pattern: "1. ", "2. ", etc.
      const numberedMatch = currentLine.match(/^(\d+)\.\s$/);
      if (numberedMatch) {
        // Keep it as is - it's already formatted correctly
        setBody(text);
        return;
      }
      
      // Check for dash pattern: "- " at start of line
      if (currentLine === '- ') {
        setBody(text);
        return;
      }

      // Check for bullet pattern: "* " at start of line - convert to bullet
      if (currentLine === '* ') {
        const beforeCurrentLine = lines.slice(0, currentLineIndex).join('\n');
        const afterCurrentLine = lines.slice(currentLineIndex + 1).join('\n');
        const newLine = '• ';
        const newText = beforeCurrentLine + (beforeCurrentLine ? '\n' : '') + newLine + (afterCurrentLine ? '\n' + afterCurrentLine : '');
        setBody(newText);
        return;
      }

      // Check for square bracket pattern: "[] " - convert to checkbox
      if (currentLine === '[] ') {
        const beforeCurrentLine = lines.slice(0, currentLineIndex).join('\n');
        const afterCurrentLine = lines.slice(currentLineIndex + 1).join('\n');
        const newLine = '[ ] ';
        const newText = beforeCurrentLine + (beforeCurrentLine ? '\n' : '') + newLine + (afterCurrentLine ? '\n' + afterCurrentLine : '');
        setBody(newText);
        haptics.light();
        return;
      }

      // Check for double quote pattern: "" " - convert to quote with placeholder
      if (currentLine === '"" ') {
        const beforeCurrentLine = lines.slice(0, currentLineIndex).join('\n');
        const afterCurrentLine = lines.slice(currentLineIndex + 1).join('\n');
        const newLine = '" "';
        const newText = beforeCurrentLine + (beforeCurrentLine ? '\n' : '') + newLine + (afterCurrentLine ? '\n' + afterCurrentLine : '');
        setBody(newText);
        haptics.light();
        
        // Position cursor between the quotes
        setTimeout(() => {
          const newCursorPos = (beforeCurrentLine ? beforeCurrentLine.length + 1 : 0) + 2;
          bodyInputRef.current?.setNativeProps({
            selection: { start: newCursorPos, end: newCursorPos }
          });
        }, 10);
        return;
      }

      // Check for greater than pattern: "> " - keep as block quote
      if (currentLine === '> ') {
        setBody(text);
        return;
      }
    }
    
    // Check for Enter key press to auto-continue lists
    if (text.length > body.length && text[text.length - 1] === '\n') {
      const lines = text.split('\n');
      const previousLineIndex = lines.length - 2;
      
      if (previousLineIndex >= 0) {
        const previousLine = lines[previousLineIndex];
        
        // Check if previous line was an EMPTY list item (user wants to exit the list)
        const emptyListPatterns = [
          /^(\d+)\.\s*$/,  // Empty numbered list
          /^-\s*$/,         // Empty dash list
          /^•\s*$/,         // Empty bullet list
          /^\[\s?[x ]?\s?\]\s*$/i,  // Empty checkbox
          /^"\s*"$/,        // Empty double quote
          /^>\s*$/,         // Empty block quote
        ];
        
        const isEmptyListItem = emptyListPatterns.some(pattern => pattern.test(previousLine));
        
        if (isEmptyListItem) {
          // Remove the empty list item and exit the list
          const linesBeforeLast = lines.slice(0, previousLineIndex);
          const linesAfterCurrent = lines.slice(previousLineIndex + 1);
          const newText = linesBeforeLast.join('\n') + '\n\n' + linesAfterCurrent.join('\n');
          setBody(newText);
          
          setTimeout(() => {
            const newCursorPos = linesBeforeLast.join('\n').length + 2;
            bodyInputRef.current?.setNativeProps({
              selection: { start: newCursorPos, end: newCursorPos }
            });
          }, 10);
          return;
        }
        
        // Check if previous line was a numbered list
        const numberedMatch = previousLine.match(/^(\d+)\.\s/);
        if (numberedMatch) {
          const nextNumber = parseInt(numberedMatch[1]) + 1;
          const newText = text + `${nextNumber}. `;
          setBody(newText);
          
          // Set cursor after the new list marker
          setTimeout(() => {
            const newCursorPos = newText.length;
            bodyInputRef.current?.setNativeProps({
              selection: { start: newCursorPos, end: newCursorPos }
            });
          }, 10);
          return;
        }
        
        // Check if previous line was a dash list
        if (previousLine.match(/^-\s/)) {
          const newText = text + '- ';
          setBody(newText);
          
          setTimeout(() => {
            const newCursorPos = newText.length;
            bodyInputRef.current?.setNativeProps({
              selection: { start: newCursorPos, end: newCursorPos }
            });
          }, 10);
          return;
        }
        
        // Check if previous line was a bullet list
        if (previousLine.match(/^•\s/)) {
          const newText = text + '• ';
          setBody(newText);
          
          setTimeout(() => {
            const newCursorPos = newText.length;
            bodyInputRef.current?.setNativeProps({
              selection: { start: newCursorPos, end: newCursorPos }
            });
          }, 10);
          return;
        }

        // Check if previous line was a checkbox
        if (previousLine.match(/^\[\s?[x ]?\s?\]\s/i)) {
          const newText = text + '[ ] ';
          setBody(newText);
          
          setTimeout(() => {
            const newCursorPos = newText.length;
            bodyInputRef.current?.setNativeProps({
              selection: { start: newCursorPos, end: newCursorPos }
            });
          }, 10);
          return;
        }

        // Check if previous line was a quote
        if (previousLine.match(/^"\s.*"$/)) {
          const newText = text + '" "';
          setBody(newText);
          
          setTimeout(() => {
            const newCursorPos = newText.length - 1; // Position cursor between quotes
            bodyInputRef.current?.setNativeProps({
              selection: { start: newCursorPos, end: newCursorPos }
            });
          }, 10);
          return;
        }
      }
    }
    
    setBody(text);
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const newText = body.slice(0, cursorPosition) + prefix + suffix + body.slice(cursorPosition);
    setBody(newText);
    haptics.light();
    
    // Set cursor position after the prefix
    setTimeout(() => {
      bodyInputRef.current?.focus();
      const newPosition = cursorPosition + prefix.length;
      bodyInputRef.current?.setNativeProps({
        selection: { start: newPosition, end: newPosition }
      });
    }, 10);
  };

  const insertAtLineStart = (prefix: string) => {
    // Find the start of the current line
    const beforeCursor = body.slice(0, cursorPosition);
    const lastNewline = beforeCursor.lastIndexOf('\n');
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    
    const newText = body.slice(0, lineStart) + prefix + body.slice(lineStart);
    setBody(newText);
    haptics.light();
    
    // Move cursor after the inserted prefix
    setTimeout(() => {
      bodyInputRef.current?.focus();
      const newPosition = cursorPosition + prefix.length;
      bodyInputRef.current?.setNativeProps({
        selection: { start: newPosition, end: newPosition }
      });
    }, 10);
  };

  const applyFormatToSelection = (prefix: string) => {
    const hasSelection = selection.end > selection.start;
    
    if (hasSelection) {
      // Apply format to each selected line
      const beforeSelection = body.slice(0, selection.start);
      const selectedText = body.slice(selection.start, selection.end);
      const afterSelection = body.slice(selection.end);
      
      // Split selected text into lines and add prefix to each
      const lines = selectedText.split('\n');
      const formattedLines = lines.map(line => {
        // Don't add prefix if line already has it
        if (line.startsWith(prefix)) {
          return line;
        }
        return prefix + line;
      });
      
      const newText = beforeSelection + formattedLines.join('\n') + afterSelection;
      setBody(newText);
      haptics.light();
      
      // Update selection to include formatted text
      setTimeout(() => {
        bodyInputRef.current?.focus();
        const newEnd = selection.start + formattedLines.join('\n').length;
        bodyInputRef.current?.setNativeProps({
          selection: { start: selection.start, end: newEnd }
        });
      }, 10);
    } else {
      // No selection, insert at line start (existing behavior)
      insertAtLineStart(prefix);
    }
  };

  const handleBulletList = () => {
    applyFormatToSelection('• ');
    setShowFormatMenu(false);
    setShowSelectionMenu(false);
  };

  const handleDashList = () => {
    applyFormatToSelection('- ');
    setShowFormatMenu(false);
    setShowSelectionMenu(false);
  };

  const handleNumberedList = () => {
    applyFormatToSelection('1. ');
    setShowFormatMenu(false);
    setShowSelectionMenu(false);
  };

  const handleCheckbox = () => {
    applyFormatToSelection('[ ] ');
    setShowFormatMenu(false);
    setShowSelectionMenu(false);
  };

  const handleBlockQuote = () => {
    applyFormatToSelection('> ');
    setShowFormatMenu(false);
    setShowSelectionMenu(false);
  };

  const toggleCheckboxAtLine = (lineIndex: number) => {
    const lines = body.split('\n');
    const line = lines[lineIndex];
    
    // Toggle checkbox: [ ] <-> [x]
    if (line.match(/^\[\s?\]\s/)) {
      lines[lineIndex] = line.replace(/^\[\s?\]\s/, '[x] ');
      haptics.medium();
    } else if (line.match(/^\[x\]\s/i)) {
      lines[lineIndex] = line.replace(/^\[x\]\s/i, '[ ] ');
      haptics.light();
    }
    
    setBody(lines.join('\n'));
  };

  const renderBodyWithCheckboxes = () => {
    const lines = body.split('\n');
    
    return lines.map((line, index) => {
      // Match checkbox: [ ] or [x]
      const checkboxMatch = line.match(/^(\[\s?([x ]?)\s?\])\s(.*)$/i);
      if (checkboxMatch) {
        const isChecked = checkboxMatch[2].toLowerCase() === 'x';
        const text = checkboxMatch[3];
        
        return (
          <HStack key={index} space="sm" alignItems="center" mb="$2" px="$4">
            <Checkbox
              value={`checkbox-${index}`}
              isChecked={isChecked}
              onChange={() => toggleCheckboxAtLine(index)}
              size="md"
            >
              <CheckboxIndicator mr="$2" borderColor={theme.colors.text}>
                <CheckboxIcon as={CheckIcon} color={theme.colors.text} />
              </CheckboxIndicator>
              <CheckboxLabel color={theme.colors.text} fontSize={17} lineHeight={26}>
                {text}
              </CheckboxLabel>
            </Checkbox>
          </HStack>
        );
      }
      
      // Match quote with double quotes: " text "
      const quoteMatch = line.match(/^"\s?(.*)"\s*$/);
      if (quoteMatch) {
        const text = quoteMatch[1];
        
        return (
          <View key={index} style={styles.quoteContainer}>
            <Text style={styles.quoteText}>
              "{text}"
            </Text>
          </View>
        );
      }
      
      // Match block quote: > text
      const blockQuoteMatch = line.match(/^>\s(.+)$/);
      if (blockQuoteMatch) {
        const text = blockQuoteMatch[1];
        
        return (
          <View key={index} style={styles.blockQuoteContainer}>
            <View style={styles.blockQuoteBorder} />
            <Text style={styles.blockQuoteText}>
              {text}
            </Text>
          </View>
        );
      }
      
      // Regular text line
      return (
        <Text key={index} style={styles.bodyTextLine}>
          {line}
        </Text>
      );
    });
  };

  const getWordCount = () => {
    const words = body.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  };

  const getCharCount = () => {
    return body.length;
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
      {/* Minimal Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={handleBack} 
          style={styles.backButton}
          hitSlop={8}
        >
          <ArrowLeft size={22} color={theme.colors.text} />
        </Pressable>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || 'Untitled'}
          </Text>
          <View style={styles.statusRow}>
            {isSaving ? (
              <Text style={styles.savingText}>Saving...</Text>
            ) : lastSavedTime ? (
              <Text style={styles.savedText}>
                Saved {new Date(lastSavedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            ) : null}
          </View>
        </View>
        
        <View style={styles.headerActions}>
          {/* Keyboard Dismiss Button */}
          {isKeyboardVisible && (
            <Pressable 
              onPress={dismissKeyboard} 
              style={styles.actionButton}
              hitSlop={8}
            >
              <ChevronDown size={22} color={theme.colors.text} />
            </Pressable>
          )}

          {/* Format Menu Button */}
          <Pressable 
            onPress={() => setShowFormatMenu(true)} 
            style={styles.actionButton}
            hitSlop={8}
          >
            <MoreVertical size={22} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
      {/* Content */}
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
            placeholder="Untitled Note"
              placeholderTextColor={theme.colors.textMuted}
              multiline={false}
              returnKeyType="next"
            autoFocus={isNewNote}
            />
            
          {/* Show TextInput when editing or keyboard visible, show rendered checkboxes when viewing */}
          {isEditingBody || isKeyboardVisible ? (
            <TextInput
              ref={bodyInputRef}
              style={styles.bodyInput}
              value={body}
              onChangeText={handleBodyChange}
              onFocus={() => setIsEditingBody(true)}
              onBlur={() => setIsEditingBody(false)}
              onSelectionChange={(event) => {
                const { start, end } = event.nativeEvent.selection;
                setCursorPosition(start);
                setSelection({ start, end });
                
                // Show selection menu if text is selected
                if (end > start) {
                  setShowSelectionMenu(true);
                } else {
                  setShowSelectionMenu(false);
                }
              }}
              placeholder="Start writing your thoughts..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              textAlignVertical="top"
              autoFocus={isNewNote}
            />
          ) : (
            <Pressable
              onPress={() => {
                setIsEditingBody(true);
                setTimeout(() => bodyInputRef.current?.focus(), 100);
              }}
              style={styles.bodyViewContainer}
            >
              {body ? renderBodyWithCheckboxes() : (
                <Text style={styles.placeholder}>Start writing your thoughts...</Text>
              )}
            </Pressable>
          )}
        </ScrollView>

        {/* Selection Formatting Toolbar - Shows when text is selected */}
        {showSelectionMenu && !isKeyboardVisible && (
          <View style={styles.selectionToolbar}>
            <Text style={styles.selectionTitle}>Format Selection</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.toolbarContent}
            >
              <Pressable 
                style={styles.toolbarBtn} 
                onPress={handleBulletList}
                hitSlop={8}
              >
                <List size={20} color={theme.colors.text} />
                <Text style={styles.toolbarLabel}>Bullet</Text>
              </Pressable>

              <Pressable 
                style={styles.toolbarBtn} 
                onPress={handleDashList}
                hitSlop={8}
              >
                <Text style={styles.toolbarIcon}>−</Text>
                <Text style={styles.toolbarLabel}>Dash</Text>
              </Pressable>

              <Pressable 
                style={styles.toolbarBtn} 
                onPress={handleNumberedList}
                hitSlop={8}
              >
                <ListOrdered size={20} color={theme.colors.text} />
                <Text style={styles.toolbarLabel}>Numbered</Text>
              </Pressable>

              <View style={styles.toolbarDivider} />

              <Pressable 
                style={styles.toolbarBtn} 
                onPress={handleCheckbox}
                hitSlop={8}
              >
                <Square size={20} color={theme.colors.text} />
                <Text style={styles.toolbarLabel}>Checkbox</Text>
              </Pressable>

              <View style={styles.toolbarDivider} />

              <Pressable 
                style={styles.toolbarBtn} 
                onPress={handleBlockQuote}
                hitSlop={8}
              >
                <Quote size={20} color={theme.colors.text} />
                <Text style={styles.toolbarLabel}>Quote</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}

        {/* Formatting Toolbar - Shows when keyboard is visible */}
        {isKeyboardVisible && !showSelectionMenu && (
          <View style={styles.formattingToolbar}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.toolbarContent}
            >
              <Pressable 
                style={styles.toolbarBtn} 
                onPress={handleBulletList}
                hitSlop={8}
              >
                <List size={20} color={theme.colors.text} />
                <Text style={styles.toolbarLabel}>Bullet</Text>
              </Pressable>

              <Pressable 
                style={styles.toolbarBtn} 
                onPress={handleDashList}
                hitSlop={8}
              >
                <Text style={styles.toolbarIcon}>−</Text>
                <Text style={styles.toolbarLabel}>Dash</Text>
              </Pressable>

              <Pressable 
                style={styles.toolbarBtn} 
                onPress={handleNumberedList}
                hitSlop={8}
              >
                <ListOrdered size={20} color={theme.colors.text} />
                <Text style={styles.toolbarLabel}>Numbered</Text>
              </Pressable>

              <View style={styles.toolbarDivider} />

              <Pressable 
                style={styles.toolbarBtn} 
                onPress={handleCheckbox}
                hitSlop={8}
              >
                <Square size={20} color={theme.colors.text} />
                <Text style={styles.toolbarLabel}>Checkbox</Text>
              </Pressable>

              <View style={styles.toolbarDivider} />

              <Pressable 
                style={styles.toolbarBtn} 
                onPress={handleBlockQuote}
                hitSlop={8}
              >
                <Quote size={20} color={theme.colors.text} />
                <Text style={styles.toolbarLabel}>Quote</Text>
              </Pressable>
      </ScrollView>
          </View>
        )}

        {/* Stats Bar */}
        {body.length > 0 && !isKeyboardVisible && !showSelectionMenu && (
          <View style={styles.statsBar}>
            <Text style={styles.statsText}>
              {getWordCount()} words · {getCharCount()} characters
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Format Menu Modal */}
      <Modal
        visible={showFormatMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFormatMenu(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowFormatMenu(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Formatting</Text>
              
              {/* Lists Section */}
              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>LISTS</Text>
                
                <Pressable 
                  style={styles.menuItem}
                  onPress={handleBulletList}
                >
                  <List size={20} color={theme.colors.text} />
                  <Text style={styles.menuItemText}>Bullet List</Text>
                  <Text style={styles.menuItemHint}>• Item</Text>
                </Pressable>

                <Pressable 
                  style={styles.menuItem}
                  onPress={handleDashList}
                >
                  <Minus size={20} color={theme.colors.text} />
                  <Text style={styles.menuItemText}>Dash List</Text>
                  <Text style={styles.menuItemHint}>- Item</Text>
                </Pressable>

                <Pressable 
                  style={styles.menuItem}
                  onPress={handleNumberedList}
                >
                  <ListOrdered size={20} color={theme.colors.text} />
                  <Text style={styles.menuItemText}>Numbered List</Text>
                  <Text style={styles.menuItemHint}>1. Item</Text>
                </Pressable>
              </View>

              {/* Checkbox Section */}
              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>CHECKBOX</Text>
                
                <Pressable 
                  style={styles.menuItem}
                  onPress={handleCheckbox}
                >
                  <Square size={20} color={theme.colors.text} />
                  <Text style={styles.menuItemText}>Checkbox</Text>
                  <Text style={styles.menuItemHint}>[ ] Task</Text>
                </Pressable>
              </View>

              {/* Other Section */}
              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>OTHER</Text>
                
                <Pressable 
                  style={styles.menuItem}
                  onPress={handleBlockQuote}
                >
                  <Quote size={20} color={theme.colors.text} />
                  <Text style={styles.menuItemText}>Block Quote</Text>
                  <Text style={styles.menuItemHint}>&gt; Quote</Text>
                </Pressable>
              </View>

              <Pressable 
                style={styles.menuCancelButton}
                onPress={() => setShowFormatMenu(false)}
              >
                <Text style={styles.menuCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionButton: {
    padding: theme.spacing.xs,
  },
  headerCenter: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  savedText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 80, // Space for stats bar
  },
  titleInput: {
    fontSize: 28,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    lineHeight: 36,
  },
  bodyInput: {
    fontSize: 17,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    lineHeight: 26,
    minHeight: 400,
  },
  bodyViewContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    minHeight: 400,
  },
  bodyTextLine: {
    fontSize: 17,
    color: theme.colors.text,
    lineHeight: 26,
    marginBottom: theme.spacing.xs,
  },
  placeholder: {
    fontSize: 17,
    color: theme.colors.textMuted,
    lineHeight: 26,
  },
  quoteContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  quoteText: {
    fontSize: 17,
    color: theme.colors.text,
    lineHeight: 26,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontStyle: 'italic',
  },
  blockQuoteContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  blockQuoteBorder: {
    width: 3,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.md,
    borderRadius: 2,
  },
  blockQuoteText: {
    flex: 1,
    fontSize: 17,
    color: theme.colors.text,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  statsBar: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  statsText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  selectionToolbar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
  },
  selectionTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    textAlign: 'center',
    paddingBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formattingToolbar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
  },
  toolbarContent: {
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  toolbarBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    minWidth: 60,
    gap: 4,
  },
  toolbarIcon: {
    fontSize: 20,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.bold,
  },
  toolbarLabel: {
    fontSize: theme.typography.fontSize.xs - 1,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  toolbarDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.xs,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  menuContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  menuTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuSection: {
    paddingTop: theme.spacing.md,
  },
  menuSectionTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textMuted,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  menuItemText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
  },
  menuItemHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  menuCancelButton: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.md,
  },
  menuCancelText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
