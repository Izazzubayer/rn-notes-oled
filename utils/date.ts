export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 24 * 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

export const formatFullDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getDateSectionTitle = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const noteDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Today
  if (noteDate.getTime() === today.getTime()) {
    return 'Today';
  }
  
  // Yesterday
  if (noteDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  
  // This week (last 7 days)
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  if (noteDate > weekAgo) {
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
  
  // This year - show month and year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { 
      month: 'long' 
    });
  }
  
  // Different year - show full date
  return date.toLocaleDateString([], { 
    month: 'long', 
    year: 'numeric' 
  });
};

export const groupNotesByDate = (notes: any[]) => {
  const groups: { [key: string]: any[] } = {};
  
  notes.forEach(note => {
    const sectionTitle = getDateSectionTitle(note.updated_at);
    if (!groups[sectionTitle]) {
      groups[sectionTitle] = [];
    }
    groups[sectionTitle].push(note);
  });
  
  // Sort groups by date (most recent first)
  const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
    // Get the first note from each group to determine the date
    const dateA = groups[a][0].updated_at;
    const dateB = groups[b][0].updated_at;
    return dateB - dateA;
  });
  
  return sortedGroups.map(([title, notes]) => ({
    type: 'dateSection',
    title,
    data: notes.sort((a, b) => b.updated_at - a.updated_at) // Sort notes within group by most recent first
  }));
};
