# NoteNow - OLED Dark Theme

A polished React Native notes app built with Expo, featuring a true-black OLED design for optimal battery life and visual appeal.

## Features

- **True Black OLED Design**: Pure black backgrounds (`#000000`) optimized for OLED displays
- **Offline-First**: SQLite database with React Query for data management
- **Rich Text Editing**: Markdown support with live preview toggle
- **Smart Search**: Debounced search across titles, content, and tags
- **Note Organization**: Pin important notes, add tags for categorization
- **Biometric Security**: Optional app lock with Face ID/Touch ID
- **Export/Import**: Backup notes to JSON, share individual notes as text/markdown
- **Smooth Animations**: React Native Reanimated for polished interactions
- **Accessibility**: Full VoiceOver/TalkBack support with proper contrast ratios

## Tech Stack

- **Expo SDK 54** with TypeScript
- **Expo Router** for file-based navigation
- **SQLite** for offline data storage
- **React Query** for server state management
- **Zustand** for client state
- **React Native Reanimated** for animations
- **Expo Local Authentication** for biometric security
- **React Native Markdown Display** for rich text rendering

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Run on device/emulator**:
   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator
   npm run web     # Web browser
   ```

## Project Structure

```
app/
├── _layout.tsx          # Root layout with providers
├── index.tsx            # Home screen with notes list
├── note/[id].tsx        # Note editor screen
├── settings/index.tsx   # Settings screen
└── components/          # Reusable UI components
    ├── NoteCard.tsx
    ├── SearchBar.tsx
    ├── FAB.tsx
    └── ...

lib/
├── db.ts               # SQLite database setup
├── notesRepo.ts        # Data access layer
├── theme.ts            # OLED dark theme
├── exportImport.ts     # Backup/restore functionality
└── haptics.ts          # Haptic feedback utilities

hooks/
├── useNotes.ts         # React Query hooks for notes
└── useBiometricGate.ts # Biometric authentication

store/
├── uiStore.ts          # UI state (search, focus)
└── settingsStore.ts    # App settings (lock, backup)
```

## Design System

The app uses a carefully crafted OLED-optimized design system:

- **Background**: `#000000` (true black)
- **Surfaces**: `#0B0B0B` (cards, elevated elements)
- **Text**: `#EDEDED` (primary), `#B3B3B3` (secondary)
- **Accent**: `#7AA2FF` (accessible blue on black)
- **Danger**: `#FF5C5C` (delete actions)
- **Success**: `#58D68D` (success states)

## Key Features

### Notes Management
- Create, edit, delete notes with autosave
- Pin important notes to the top
- Add tags for organization
- Search across all content

### Security
- Optional biometric app lock
- Secure storage for sensitive settings
- PIN fallback for biometric authentication

### Export & Sharing
- Export all notes to JSON backup
- Share individual notes as text or markdown
- Import notes from JSON files

### Accessibility
- Dynamic Type support
- High contrast ratios
- Proper accessibility labels
- VoiceOver/TalkBack compatibility

## Development

The app follows modern React Native best practices:

- **TypeScript** for type safety
- **React Query** for optimistic updates and caching
- **Zustand** for lightweight state management
- **Expo Router** for type-safe navigation
- **SQLite** with WAL mode for performance

## Building for Production

1. **Configure app.json** with your bundle identifier
2. **Build for iOS**:
   ```bash
   eas build --platform ios
   ```
3. **Build for Android**:
   ```bash
   eas build --platform android
   ```

## License

MIT License - feel free to use this as a starting point for your own notes app!
