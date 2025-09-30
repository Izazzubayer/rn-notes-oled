import { create } from 'zustand';

interface UIStore {
  search: string;
  isSearchFocused: boolean;
  setSearch: (search: string) => void;
  setSearchFocused: (focused: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  search: '',
  isSearchFocused: false,
  setSearch: (search) => set({ search }),
  setSearchFocused: (isSearchFocused) => set({ isSearchFocused }),
}));
