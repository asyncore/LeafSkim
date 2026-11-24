import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseContainerXml,
  parseOpfPackage,
  extractTextBlocksFromXhtml,
  resolveRelativePath,
  parseEpubArrayBuffer,
} from './epubParser';
import { buildEpubArrayBuffer } from './epubBuilder';
import type { EpubBook } from '../types/epub';

test('parseContainerXml locates the OPF rootfile path', () => {
  const xml = `<?xml version="1.0"?>
    <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
      <rootfiles>
        <rootfile full-path="OEBPS/package.opf" media-type="application/oebps-package+xml" />
      </rootfiles>
    </container>`;
  assert.equal(parseContainerXml(xml), 'OEBPS/package.opf');
});

test('resolveRelativePath resolves sibling and parent paths safely', () => {
  assert.equal(resolveRelativePath('OEBPS/content.opf', 'text/ch1.xhtml'), 'OEBPS/text/ch1.xhtml');
  assert.equal(resolveRelativePath('OEBPS/nested/content.opf', '../images/cover.jpg'), 'OEBPS/images/cover.jpg');
  assert.equal(resolveRelativePath('content.opf', 'chapter1.xhtml#section-2'), 'chapter1.xhtml');
});

test('parseOpfPackage extracts metadata, spine order, and cover href', () => {
  const opf = `<?xml version="1.0"?>
  <package version="3.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:title>Northern Harbor</dc:title>
      <dc:creator>Clara Jensen</dc:creator>
      <dc:language>en</dc:language>
      <dc:subject>Maritime</dc:subject>
    </metadata>
    <manifest>
      <item id="img-cover" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image" />
      <item id="c1" href="ch1.xhtml" media-type="application/xhtml+xml" />
      <item id="c2" href="ch2.xhtml" media-type="application/xhtml+xml" />
    </manifest>
    <spine>
      <itemref idref="c1" />
      <itemref idref="c2" />
    </spine>
  </package>`;

  const pkg = parseOpfPackage(opf, 'Fallback');
  assert.equal(pkg.title, 'Northern Harbor');
  assert.equal(pkg.author, 'Clara Jensen');
  assert.deepEqual(pkg.spineIdRefs, ['c1', 'c2']);
  assert.equal(pkg.coverHref, 'images/cover.jpg');
});

test('extractTextBlocksFromXhtml extracts headings, quotes, paragraphs and decodes entities', () => {
  const html = `<html><head><title>Ch 1</title></head><body>
    <script>alert("bad")</script>
    <h1>Chapter One: Fog &amp; Salt</h1>
    <p>The tide rose before dawn &mdash; slow and silver.</p>
    <blockquote>Keep the lantern trimmed.</blockquote>
  </body></html>`;

  const result = extractTextBlocksFromXhtml(html);
  assert.equal(result.title, 'Chapter One: Fog & Salt');
  assert.equal(result.blocks.length, 3);
  assert.equal(result.blocks[0].type, 'heading');
  assert.equal(result.blocks[1].text, 'The tide rose before dawn \u2014 slow and silver.');
  assert.equal(result.blocks[2].type, 'quote');
});

test('buildEpubArrayBuffer and parseEpubArrayBuffer round-trip a real EPUB ZIP archive', async () => {
  const sampleBook: EpubBook = {
    id: 'test-epub-1',
    fileName: 'sample_notes.epub',
    title: 'Field Notes on Sound',
    author: 'M. K. Rivera',
    language: 'en',
    subject: 'Acoustics',
    description: 'Short notes on quiet rooms.',
    fileSizeBytes: 1024,
    coverUrl: null,
    chapters: [
      {
        id: 'ch-1',
        title: '1. Quiet Rooms',
        excerpt: 'Every library has an acoustic signature that settles the breath.',
        wordCount: 18,
        blocks: [
          { type: 'heading', text: '1. Quiet Rooms' },
          { type: 'paragraph', text: 'Every library has an acoustic signature that settles the breath and slows a hurried afternoon.' },
        ],
      },
      {
        id: 'ch-2',
        title: '2. Timber & Stone',
        excerpt: 'Cedar slats absorb harsh reflections along narrow corridors.',
        wordCount: 14,
        blocks: [
          { type: 'heading', text: '2. Timber & Stone' },
          { type: 'paragraph', text: 'Cedar slats absorb harsh reflections along narrow corridors.' },
        ],
      },
    ],
    totalWords: 32,
    estimatedReadMinutes: 1,
    openingExcerpt: 'Every library has an acoustic signature that settles the breath.',
    isStarred: false,
    starredAt: null,
    addedAt: 1700000000000,
    lastOpenedAt: null,
    currentChapterIndex: 0,
    scrollPercent: 0,
    kindleSentAt: null,
    kindleSentTo: null,
    source: 'local',
  };

  const buffer = await buildEpubArrayBuffer(sampleBook);
  const parsed = await parseEpubArrayBuffer(buffer, 'sample_notes.epub');

  assert.equal(parsed.title, 'Field Notes on Sound');
  assert.equal(parsed.author, 'M. K. Rivera');
  assert.equal(parsed.chapters.length, 2);
  assert.equal(parsed.chapters[0].title, '1. Quiet Rooms');
  assert.equal(parsed.chapters[1].title, '2. Timber & Stone');
  assert.ok(parsed.totalWords >= 20);
});
