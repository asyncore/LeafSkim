export type TextBlockType = 'heading' | 'subheading' | 'paragraph' | 'quote';

export interface TextBlock {
  type: TextBlockType;
  text: string;
}

export interface EpubChapter {
  id: string;
  title: string;
  excerpt: string;
  wordCount: number;
  blocks: TextBlock[];
}

export interface EpubBook {
  id: string;
  fileName: string;
  title: string;
  author: string;
  language: string;
  subject: string;
  description: string;
  fileSizeBytes: number;
  coverUrl: string | null;
  chapters: EpubChapter[];
  totalWords: number;
  estimatedReadMinutes: number;
  openingExcerpt: string;
  isStarred: boolean;
  starredAt: number | null;
  addedAt: number;
  lastOpenedAt: number | null;
  currentChapterIndex: number;
  scrollPercent: number;
  kindleSentAt: number | null;
  kindleSentTo: string | null;
  source: 'seed' | 'local';
}

export type LibraryFilter = 'all' | 'starred' | 'kindle' | 'unreviewed';

export type SortOption = 'recent' | 'title' | 'author' | 'length' | 'starred';

export type ActiveTab = 'library' | 'starred' | 'kindle';

export type ReaderPaperTheme = 'crisp' | 'paper' | 'night';

export type ReaderMode = 'read' | 'skim';

export interface ReaderSettings {
  fontSizePx: number;
  lineHeight: number;
  paperTheme: ReaderPaperTheme;
  defaultMode: ReaderMode;
}

export interface KindleSettings {
  kindleEmail: string;
  defaultSubjectConvert: boolean;
}
