import JSZip from 'jszip';
import type { EpubBook, EpubChapter, TextBlock } from '../types/epub';

export interface ParsedOpfPackage {
  title: string;
  author: string;
  language: string;
  subject: string;
  description: string;
  manifest: Record<string, { href: string; mediaType: string; properties?: string }>;
  spineIdRefs: string[];
  coverHref: string | null;
}

const ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '\u2014',
  ndash: '\u2013',
  hellip: '\u2026',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201C',
  rdquo: '\u201D',
  copy: '\u00A9',
};

export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (_match, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    }
    if (entity.startsWith('#')) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    }
    return ENTITY_MAP[entity] ?? '';
  });
}

export function cleanText(raw: string): string {
  return decodeHtmlEntities(raw.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseAttributes(tagStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /([a-zA-Z0-9_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(tagStr)) !== null) {
    attrs[match[1].toLowerCase()] = decodeHtmlEntities(match[2] ?? match[3] ?? '');
  }
  return attrs;
}

export function resolveRelativePath(baseFilePath: string, relativeHref: string): string {
  const cleanHref = relativeHref.split('#')[0].split('?')[0];
  if (!cleanHref) return '';
  const decodedHref = (() => {
    try {
      return decodeURIComponent(cleanHref);
    } catch {
      return cleanHref;
    }
  })();

  if (decodedHref.startsWith('/')) {
    return decodedHref.replace(/^\/+/, '');
  }

  const baseSegments = baseFilePath.split('/').slice(0, -1);
  const relSegments = decodedHref.split('/');
  const combined: string[] = [...baseSegments];

  for (const seg of relSegments) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      combined.pop();
    } else {
      combined.push(seg);
    }
  }
  return combined.join('/');
}

export function parseContainerXml(containerXml: string): string | null {
  const rootfileMatch = containerXml.match(/<rootfile\b([^>]*)\/?>/i);
  if (!rootfileMatch) return null;
  const attrs = parseAttributes(rootfileMatch[1]);
  return attrs['full-path'] ?? null;
}

function extractFirstTagText(xml: string, tagPattern: string): string {
  const regex = new RegExp(`<${tagPattern}\\b[^>]*>([\\s\\S]*?)<\\/${tagPattern}>`, 'i');
  const match = xml.match(regex);
  return match ? cleanText(match[1]) : '';
}

export function parseOpfPackage(opfXml: string, fallbackTitle: string): ParsedOpfPackage {
  const title = extractFirstTagText(opfXml, '(?:dc:)?title') || fallbackTitle;
  const author = extractFirstTagText(opfXml, '(?:dc:)?creator') || 'Unknown Author';
  const language = extractFirstTagText(opfXml, '(?:dc:)?language') || 'en';
  const subject = extractFirstTagText(opfXml, '(?:dc:)?subject') || 'General';
  const description = extractFirstTagText(opfXml, '(?:dc:)?description') || '';

  const manifest: ParsedOpfPackage['manifest'] = {};
  const itemRegex = /<item\b([^>]*)\/?>/gi;
  let itemMatch: RegExpExecArray | null;
  while ((itemMatch = itemRegex.exec(opfXml)) !== null) {
    const attrs = parseAttributes(itemMatch[1]);
    if (attrs.id && attrs.href) {
      manifest[attrs.id] = {
        href: attrs.href,
        mediaType: attrs['media-type'] ?? '',
        properties: attrs.properties,
      };
    }
  }

  const spineIdRefs: string[] = [];
  const spineMatch = opfXml.match(/<spine\b[^>]*>([\s\S]*?)<\/spine>/i);
  if (spineMatch) {
    const itemrefRegex = /<itemref\b([^>]*)\/?>/gi;
    let refMatch: RegExpExecArray | null;
    while ((refMatch = itemrefRegex.exec(spineMatch[1])) !== null) {
      const attrs = parseAttributes(refMatch[1]);
      if (attrs.idref && attrs.linear !== 'no') {
        spineIdRefs.push(attrs.idref);
      }
    }
  }

  // Locate cover image: EPUB 3 cover-image property, EPUB 2 meta name="cover", or manifest heuristic
  let coverHref: string | null = null;

  for (const item of Object.values(manifest)) {
    if (item.properties?.split(/\s+/).includes('cover-image')) {
      coverHref = item.href;
      break;
    }
  }

  if (!coverHref) {
    const metaRegex = /<meta\b([^>]*)\/?>/gi;
    let metaMatch: RegExpExecArray | null;
    while ((metaMatch = metaRegex.exec(opfXml)) !== null) {
      const attrs = parseAttributes(metaMatch[1]);
      if (attrs.name === 'cover' && attrs.content && manifest[attrs.content]) {
        coverHref = manifest[attrs.content].href;
        break;
      }
    }
  }

  if (!coverHref) {
    for (const [id, item] of Object.entries(manifest)) {
      if (
        item.mediaType.startsWith('image/') &&
        (id.toLowerCase().includes('cover') || item.href.toLowerCase().includes('cover'))
      ) {
        coverHref = item.href;
        break;
      }
    }
  }

  return {
    title,
    author,
    language,
    subject,
    description,
    manifest,
    spineIdRefs,
    coverHref,
  };
}

export function extractTextBlocksFromXhtml(xhtml: string): { title: string | null; blocks: TextBlock[] } {
  const withoutScripts = xhtml
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

  const headTitle = extractFirstTagText(withoutScripts, 'title');
  const bodyMatch = withoutScripts.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : withoutScripts;

  const blocks: TextBlock[] = [];
  let detectedHeading: string | null = null;

  const blockRegex = /<(h1|h2|h3|h4|p|blockquote|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(body)) !== null) {
    const tag = match[1].toLowerCase();
    const text = cleanText(match[2]);
    if (!text) continue;

    if (tag === 'h1' || tag === 'h2') {
      if (!detectedHeading) detectedHeading = text;
      blocks.push({ type: 'heading', text });
    } else if (tag === 'h3' || tag === 'h4') {
      if (!detectedHeading) detectedHeading = text;
      blocks.push({ type: 'subheading', text });
    } else if (tag === 'blockquote') {
      blocks.push({ type: 'quote', text });
    } else {
      blocks.push({ type: 'paragraph', text });
    }
  }

  if (blocks.length === 0) {
    const fallbackParagraphs = cleanText(body)
      .split(/(?<=\.)\s+(?=[A-Z])/)
      .filter(Boolean);
    for (const para of fallbackParagraphs) {
      if (para.length > 2) {
        blocks.push({ type: 'paragraph', text: para });
      }
    }
  }

  const chapterTitle =
    detectedHeading || (headTitle && headTitle.toLowerCase() !== 'unknown' ? headTitle : null);

  return { title: chapterTitle, blocks };
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function computeReadingStats(chapters: EpubChapter[]): {
  totalWords: number;
  estimatedReadMinutes: number;
  openingExcerpt: string;
} {
  const totalWords = chapters.reduce((acc, ch) => acc + ch.wordCount, 0);
  const estimatedReadMinutes = Math.max(1, Math.round(totalWords / 230));

  let openingExcerpt = '';
  for (const ch of chapters) {
    if (ch.excerpt && ch.excerpt.length >= 24) {
      openingExcerpt = ch.excerpt;
      break;
    }
  }
  if (!openingExcerpt && chapters.length > 0) {
    openingExcerpt = chapters[0].excerpt || chapters[0].title;
  }

  return {
    totalWords,
    estimatedReadMinutes,
    openingExcerpt,
  };
}

export function stripEpubExtension(fileName: string): string {
  return fileName.replace(/\.epub$/i, '').replace(/[_-]+/g, ' ').trim() || 'Untitled EPUB';
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export async function parseEpubArrayBuffer(
  buffer: ArrayBuffer,
  fileName: string,
  fileSizeBytes?: number
): Promise<EpubBook> {
  const zip = await JSZip.loadAsync(buffer);
  const fallbackTitle = stripEpubExtension(fileName);

  const containerEntry = zip.file('META-INF/container.xml');
  if (!containerEntry) {
    throw new Error('This file is missing META-INF/container.xml and does not appear to be a valid EPUB.');
  }

  const containerXml = await containerEntry.async('string');
  const opfPath = parseContainerXml(containerXml);
  if (!opfPath) {
    throw new Error('Could not find the package rootfile in META-INF/container.xml.');
  }

  const opfEntry = zip.file(opfPath);
  if (!opfEntry) {
    throw new Error(`Could not open OPF package at ${opfPath}.`);
  }

  const opfXml = await opfEntry.async('string');
  const pkg = parseOpfPackage(opfXml, fallbackTitle);

  let coverUrl: string | null = null;
  if (pkg.coverHref) {
    const resolvedCover = resolveRelativePath(opfPath, pkg.coverHref);
    const coverFile = zip.file(resolvedCover);
    if (coverFile) {
      const coverBytes = await coverFile.async('uint8array');
      const ext = resolvedCover.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const mime =
        ext === 'png'
          ? 'image/png'
          : ext === 'webp'
            ? 'image/webp'
            : ext === 'svg'
              ? 'image/svg+xml'
              : 'image/jpeg';
      coverUrl = `data:${mime};base64,${uint8ArrayToBase64(coverBytes)}`;
    }
  }

  const chapters: EpubChapter[] = [];
  for (let i = 0; i < pkg.spineIdRefs.length; i++) {
    const idref = pkg.spineIdRefs[i];
    const manifestItem = pkg.manifest[idref];
    if (!manifestItem) continue;

    const chapterPath = resolveRelativePath(opfPath, manifestItem.href);
    const chapterFile = zip.file(chapterPath);
    if (!chapterFile) continue;

    const xhtml = await chapterFile.async('string');
    const extracted = extractTextBlocksFromXhtml(xhtml);
    if (extracted.blocks.length === 0) continue;

    const firstParagraph =
      extracted.blocks.find((b) => b.type === 'paragraph' && b.text.length > 20)?.text ??
      extracted.blocks.find((b) => b.type === 'paragraph')?.text ??
      extracted.blocks[0].text;

    const wordCount = extracted.blocks.reduce((sum, block) => sum + countWords(block.text), 0);
    if (wordCount === 0) continue;

    chapters.push({
      id: `ch-${chapters.length + 1}`,
      title: extracted.title || `Section ${chapters.length + 1}`,
      excerpt: firstParagraph.slice(0, 240),
      wordCount,
      blocks: extracted.blocks,
    });
  }

  if (chapters.length === 0) {
    throw new Error('No readable text chapters were found inside this EPUB archive.');
  }

  const stats = computeReadingStats(chapters);
  const now = Date.now();
  const id = `local-${now}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    fileName,
    title: pkg.title,
    author: pkg.author,
    language: pkg.language,
    subject: pkg.subject,
    description: pkg.description || stats.openingExcerpt,
    fileSizeBytes: fileSizeBytes ?? buffer.byteLength,
    coverUrl,
    chapters,
    totalWords: stats.totalWords,
    estimatedReadMinutes: stats.estimatedReadMinutes,
    openingExcerpt: stats.openingExcerpt,
    isStarred: false,
    starredAt: null,
    addedAt: now,
    lastOpenedAt: null,
    currentChapterIndex: 0,
    scrollPercent: 0,
    kindleSentAt: null,
    kindleSentTo: null,
    source: 'local',
  };
}
