// Helper functions to get icons for subjects and categories
// Used by SubjectSelectionScreen and SearchFilterScreen

// Helper function to get icon for a subject based on its name
export const getSubjectIcon = (subjectName: string): string => {
  const iconMap: Record<string, string> = {
    '英語': '🇬🇧',
    '国語': '📝',
    '数学': '📐',
    '理科': '🔬',
    '社会': '🏛️',
    '経理': '💵',
    'Webマーケティング': '📈',
    '投資': '💰',
    '一般教養': '📚',
    '情報処理': '🖥️',
    'プログラミング言語': '💻',
    'ゲーム理論': '🎮',
    '動画編集': '🎬',
    '音楽理論': '🎵',
    '英検': '🎯',
    '簿記': '📊',
    '情報処理技術者試験': '🔐',
    'その他': '📝',
  };
  return iconMap[subjectName] || '📚'; // Default icon
};

// Helper function to get icon for a category based on its name
export const getCategoryIcon = (categoryName: string): string => {
  const iconMap: Record<string, string> = {
    '学習教科': '📖',
    'ビジネススキル': '💼',
    'プログラミング・IT': '💻',
    '音楽・クリエイティブ': '🎨',
    '資格対策': '🎯',
  };
  return iconMap[categoryName] || '📚'; // Default icon
};
