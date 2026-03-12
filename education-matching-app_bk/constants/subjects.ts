// Subject categories and data for the education matching app
export interface Subject {
  id: string;
  name: string;
  icon: string;
  grades?: string[]; // Grade levels this subject is applicable to
}

export interface SubjectCategory {
  id: string;
  name: string;
  icon: string;
  subjects: Subject[];
}

// Popular subjects that appear at the top
export const popularSubjects: Subject[] = [
  { id: 'math', name: '数学', icon: '📐', grades: ['junior_high', 'high_school', 'university_adult'] },
  { id: 'english_lang', name: '英語', icon: '🇬🇧', grades: ['elementary', 'junior_high', 'high_school', 'university_adult'] },
  { id: 'japanese', name: '国語', icon: '📝', grades: ['elementary', 'junior_high', 'high_school'] },
];

// Grade levels
export const gradeLevels = [
  { id: 'all', name: 'すべて' },
  { id: 'elementary', name: '小学生' },
  { id: 'junior_high', name: '中学生' },
  { id: 'high_school', name: '高校生' },
  { id: 'university_adult', name: '大学生・社会人' },
];

// Subject categories with their subjects
export const subjectCategories: SubjectCategory[] = [
  {
    id: 'science_math',
    name: '理数系',
    icon: '🔬',
    subjects: [
      { id: 'arithmetic', name: '算数', icon: '🔢', grades: ['elementary'] },
      { id: 'math', name: '数学', icon: '📐', grades: ['junior_high', 'high_school', 'university_adult'] },
      { id: 'physics', name: '物理', icon: '⚡', grades: ['high_school', 'university_adult'] },
      { id: 'chemistry', name: '化学', icon: '⚗️', grades: ['high_school', 'university_adult'] },
      { id: 'biology', name: '生物', icon: '🧬', grades: ['high_school', 'university_adult'] },
      { id: 'earth_science', name: '地学', icon: '🌍', grades: ['high_school'] },
      { id: 'science', name: '理科', icon: '🔬', grades: ['elementary', 'junior_high'] },
    ],
  },
  {
    id: 'liberal_arts',
    name: '文系',
    icon: '📖',
    subjects: [
      { id: 'japanese', name: '国語', icon: '📝', grades: ['elementary', 'junior_high', 'high_school'] },
      { id: 'kobun', name: '古文', icon: '📜', grades: ['high_school'] },
      { id: 'kanbun', name: '漢文', icon: '📃', grades: ['high_school'] },
      { id: 'gendaibun', name: '現代文', icon: '📄', grades: ['high_school'] },
      { id: 'japanese_history', name: '日本史', icon: '🏯', grades: ['junior_high', 'high_school'] },
      { id: 'world_history', name: '世界史', icon: '🌏', grades: ['junior_high', 'high_school'] },
      { id: 'geography', name: '地理', icon: '🗺️', grades: ['junior_high', 'high_school'] },
      { id: 'social_studies', name: '社会', icon: '🏛️', grades: ['elementary', 'junior_high'] },
    ],
  },
  {
    id: 'languages',
    name: '語学',
    icon: '🌐',
    subjects: [
      { id: 'japanese_lang', name: '日本語(外国人向け)', icon: '🇯🇵', grades: ['university_adult'] },
      { id: 'english_lang', name: '英語', icon: '🇬🇧', grades: ['elementary', 'junior_high', 'high_school', 'university_adult'] },
      { id: 'english_conversation', name: '英会話', icon: '💬', grades: ['elementary', 'junior_high', 'high_school', 'university_adult'] },
      { id: 'toeic', name: 'TOEIC', icon: '📝', grades: ['high_school', 'university_adult'] },
      { id: 'toefl', name: 'TOEFL', icon: '📝', grades: ['high_school', 'university_adult'] },
      { id: 'chinese', name: '中国語', icon: '🇨🇳', grades: ['junior_high', 'high_school', 'university_adult'] },
      { id: 'korean', name: '韓国語', icon: '🇰🇷', grades: ['junior_high', 'high_school', 'university_adult'] },
    ],
  },
  {
    id: 'arts',
    name: '芸術・実技',
    icon: '🎨',
    subjects: [
      { id: 'music', name: '音楽', icon: '🎵', grades: ['elementary', 'junior_high', 'high_school'] },
      { id: 'piano', name: 'ピアノ', icon: '🎹', grades: ['elementary', 'junior_high', 'high_school', 'university_adult'] },
      { id: 'guitar', name: 'ギター', icon: '🎸', grades: ['junior_high', 'high_school', 'university_adult'] },
      { id: 'art', name: '美術', icon: '🖼️', grades: ['elementary', 'junior_high', 'high_school'] },
      { id: 'physical_education', name: '体育', icon: '⚽', grades: ['elementary', 'junior_high', 'high_school'] },
    ],
  },
  {
    id: 'it_programming',
    name: 'IT・プログラミング',
    icon: '💻',
    subjects: [
      { id: 'programming_basic', name: 'プログラミング基礎', icon: '🖥️', grades: ['elementary', 'junior_high'] },
      { id: 'programming', name: 'プログラミング', icon: '💻', grades: ['high_school', 'university_adult'] },
      { id: 'java', name: 'Java', icon: '☕', grades: ['university_adult'] },
      { id: 'python', name: 'Python', icon: '🐍', grades: ['high_school', 'university_adult'] },
      { id: 'react_js', name: 'React/JS', icon: '⚛️', grades: ['university_adult'] },
      { id: 'web_dev', name: 'Web開発', icon: '🌐', grades: ['high_school', 'university_adult'] },
      { id: 'ai_ml', name: 'AI・機械学習', icon: '🤖', grades: ['university_adult'] },
    ],
  },
  {
    id: 'business',
    name: 'ビジネス・資格',
    icon: '💼',
    subjects: [
      { id: 'bookkeeping', name: '簿記', icon: '📊', grades: ['high_school', 'university_adult'] },
      { id: 'accounting', name: '会計', icon: '💰', grades: ['university_adult'] },
      { id: 'marketing', name: 'マーケティング', icon: '📈', grades: ['university_adult'] },
      { id: 'business_japanese', name: 'ビジネス日本語', icon: '🏢', grades: ['university_adult'] },
      { id: 'business_skills', name: 'ビジネススキル', icon: '💼', grades: ['university_adult'] },
    ],
  },
  {
    id: 'exam_prep',
    name: '試験対策',
    icon: '🎯',
    subjects: [
      { id: 'university_exam', name: '大学受験対策', icon: '✏️', grades: ['high_school'] },
      { id: 'high_school_exam', name: '高校受験対策', icon: '🎓', grades: ['junior_high'] },
      { id: 'jlpt', name: 'JLPT対策', icon: '🇯🇵', grades: ['university_adult'] },
    ],
  },
];

// Helper function to get all subjects as a flat array
export const getAllSubjects = (): Subject[] => {
  const allSubjects: Subject[] = [];
  subjectCategories.forEach(category => {
    allSubjects.push(...category.subjects);
  });
  return allSubjects;
};

// Helper function to get subject by name
export const getSubjectByName = (name: string): Subject | undefined => {
  const allSubjects = getAllSubjects();
  return allSubjects.find(subject => subject.name === name);
};
