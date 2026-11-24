import type { EpubBook, LibraryFilter, SortOption } from '../types/epub';

export interface KindleEmailValidation {
  valid: boolean;
  error: string | null;
  normalized: string;
}

const BASIC_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateKindleEmail(rawInput: string): KindleEmailValidation {
  const normalized = rawInput.trim().toLowerCase();
  if (!normalized) {
    return {
      valid: false,
      error: 'Enter your Send-to-Kindle email address (for example, name@kindle.com).',
      normalized,
    };
  }

  if (!BASIC_EMAIL_REGEX.test(normalized)) {
    return {
      valid: false,
      error: 'Enter a valid email address ending in @kindle.com.',
      normalized,
    };
  }

  const domain = normalized.split('@')[1] ?? '';
  if (domain !== 'kindle.com' && !domain.endsWith('.kindle.com')) {
    return {
      valid: false,
      error: 'Kindle delivery requires an Amazon @kindle.com address.',
      normalized,
    };
  }

  return { valid: true, error: null, normalized };
}

export function filterAndSortBooks(
  books: EpubBook[],
  options: {
    filter: LibraryFilter;
    query: string;
    sort: SortOption;
  }
): EpubBook[] {
  const q = options.query.trim().toLowerCase();

  const filtered = books.filter((book) => {
    if (options.filter === 'starred' && !book.isStarred) return false;
    if (options.filter === 'kindle' && !book.kindleSentAt) return false;
    if (options.filter === 'unreviewed' && (book.isStarred || book.lastOpenedAt !== null)) {
      return false;
    }

    if (!q) return true;
    const haystack = [
      book.title,
      book.author,
      book.subject,
      book.fileName,
      book.openingExcerpt,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (options.sort) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'author':
        return a.author.localeCompare(b.author);
      case 'length':
        return a.totalWords - b.totalWords;
      case 'starred':
        if (a.isStarred !== b.isStarred) return a.isStarred ? -1 : 1;
        return (b.starredAt ?? b.addedAt) - (a.starredAt ?? a.addedAt);
      case 'recent':
      default:
        return Math.max(b.addedAt, b.lastOpenedAt ?? 0) - Math.max(a.addedAt, a.lastOpenedAt ?? 0);
    }
  });

  return sorted;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function getBookProgressPercent(book: EpubBook): number {
  if (book.chapters.length === 0) return 0;
  if (book.lastOpenedAt === null && book.currentChapterIndex === 0 && book.scrollPercent === 0) {
    return 0;
  }
  const chapterWeight = 100 / book.chapters.length;
  const completedBefore = book.currentChapterIndex * chapterWeight;
  const withinCurrent = (Math.min(100, Math.max(0, book.scrollPercent)) / 100) * chapterWeight;
  return Math.min(100, Math.max(1, Math.round(completedBefore + withinCurrent)));
}

export function getAdjacentBookIds(
  orderedBooks: EpubBook[],
  activeBookId: string
): { prevId: string | null; nextId: string | null; index: number; total: number } {
  const index = orderedBooks.findIndex((b) => b.id === activeBookId);
  if (index === -1) {
    return { prevId: null, nextId: null, index: -1, total: orderedBooks.length };
  }
  return {
    prevId: index > 0 ? orderedBooks[index - 1].id : null,
    nextId: index < orderedBooks.length - 1 ? orderedBooks[index + 1].id : null,
    index,
    total: orderedBooks.length,
  };
}

export function formatShortDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
