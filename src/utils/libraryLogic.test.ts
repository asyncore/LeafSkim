import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateKindleEmail,
  filterAndSortBooks,
  formatFileSize,
  getBookProgressPercent,
  getAdjacentBookIds,
} from './libraryLogic';
import type { EpubBook } from '../types/epub';

function makeBook(overrides: Partial<EpubBook>): EpubBook {
  return {
    id: 'b1',
    fileName: 'book.epub',
    title: 'Alpha Book',
    author: 'Author One',
    language: 'en',
    subject: 'Fiction',
    description: 'Desc',
    fileSizeBytes: 120000,
    coverUrl: null,
    chapters: [
      { id: 'c1', title: 'Ch 1', excerpt: 'Start', wordCount: 500, blocks: [] },
      { id: 'c2', title: 'Ch 2', excerpt: 'Middle', wordCount: 500, blocks: [] },
    ],
    totalWords: 1000,
    estimatedReadMinutes: 4,
    openingExcerpt: 'Start',
    isStarred: false,
    starredAt: null,
    addedAt: 1000,
    lastOpenedAt: null,
    currentChapterIndex: 0,
    scrollPercent: 0,
    kindleSentAt: null,
    kindleSentTo: null,
    source: 'seed',
    ...overrides,
  };
}

test('validateKindleEmail rejects empty, malformed, and non-kindle domains', () => {
  assert.equal(validateKindleEmail('').valid, false);
  assert.equal(validateKindleEmail('not-an-email').valid, false);
  assert.equal(validateKindleEmail('reader@gmail.com').valid, false);
  const ok = validateKindleEmail('  Reader.One@Kindle.COM ');
  assert.equal(ok.valid, true);
  assert.equal(ok.normalized, 'reader.one@kindle.com');
  assert.equal(validateKindleEmail('alex@free.kindle.com').valid, true);
});

test('filterAndSortBooks filters by starred, kindle, unreviewed and query', () => {
  const books = [
    makeBook({ id: '1', title: 'Zebra Tales', isStarred: true, starredAt: 5000, addedAt: 1000 }),
    makeBook({ id: '2', title: 'Alpine Flora', isStarred: false, kindleSentAt: 3000, lastOpenedAt: 2500, addedAt: 2000 }),
    makeBook({ id: '3', title: 'Coastal Letters', isStarred: false, lastOpenedAt: null, addedAt: 3000 }),
  ];

  assert.deepEqual(
    filterAndSortBooks(books, { filter: 'starred', query: '', sort: 'recent' }).map((b) => b.id),
    ['1']
  );
  assert.deepEqual(
    filterAndSortBooks(books, { filter: 'kindle', query: '', sort: 'recent' }).map((b) => b.id),
    ['2']
  );
  assert.deepEqual(
    filterAndSortBooks(books, { filter: 'unreviewed', query: '', sort: 'recent' }).map((b) => b.id),
    ['3']
  );
  assert.deepEqual(
    filterAndSortBooks(books, { filter: 'all', query: 'alpine', sort: 'title' }).map((b) => b.id),
    ['2']
  );
  assert.deepEqual(
    filterAndSortBooks(books, { filter: 'all', query: '', sort: 'title' }).map((b) => b.id),
    ['2', '3', '1']
  );
});

test('formatFileSize formats bytes, KB, and MB cleanly', () => {
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(184320), '180 KB');
  assert.equal(formatFileSize(2621440), '2.5 MB');
});

test('getBookProgressPercent computes chapter and scroll progress accurately', () => {
  const unopened = makeBook({ lastOpenedAt: null, currentChapterIndex: 0, scrollPercent: 0 });
  assert.equal(getBookProgressPercent(unopened), 0);

  const halfwayCh1 = makeBook({ lastOpenedAt: 500, currentChapterIndex: 0, scrollPercent: 50 });
  assert.equal(getBookProgressPercent(halfwayCh1), 25);

  const ch2Half = makeBook({ lastOpenedAt: 500, currentChapterIndex: 1, scrollPercent: 50 });
  assert.equal(getBookProgressPercent(ch2Half), 75);
});

test('getAdjacentBookIds returns previous and next IDs for rapid book skimming', () => {
  const list = [makeBook({ id: 'a' }), makeBook({ id: 'b' }), makeBook({ id: 'c' })];
  assert.deepEqual(getAdjacentBookIds(list, 'a'), { prevId: null, nextId: 'b', index: 0, total: 3 });
  assert.deepEqual(getAdjacentBookIds(list, 'b'), { prevId: 'a', nextId: 'c', index: 1, total: 3 });
  assert.deepEqual(getAdjacentBookIds(list, 'c'), { prevId: 'b', nextId: null, index: 2, total: 3 });
});
