import JSZip from 'jszip';
import type { EpubBook, EpubChapter } from '../types/epub';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderChapterXhtml(chapter: EpubChapter): string {
  const bodyContent = chapter.blocks
    .map((block) => {
      const safe = escapeXml(block.text);
      if (block.type === 'heading') return `    <h1>${safe}</h1>`;
      if (block.type === 'subheading') return `    <h2>${safe}</h2>`;
      if (block.type === 'quote') return `    <blockquote><p>${safe}</p></blockquote>`;
      return `    <p>${safe}</p>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
  <head>
    <title>${escapeXml(chapter.title)}</title>
  </head>
  <body>
${bodyContent}
  </body>
</html>`;
}

export async function buildEpubArrayBuffer(book: EpubBook): Promise<ArrayBuffer> {
  const zip = new JSZip();

  // EPUB spec requires uncompressed mimetype as first entry
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  const manifestItems = book.chapters
    .map(
      (ch, idx) =>
        `    <item id="ch${idx + 1}" href="chapter-${idx + 1}.xhtml" media-type="application/xhtml+xml"/>`
    )
    .join('\n');

  const spineItems = book.chapters
    .map((_ch, idx) => `    <itemref idref="ch${idx + 1}"/>`)
    .join('\n');

  const navLinks = book.chapters
    .map(
      (ch, idx) =>
        `        <li><a href="chapter-${idx + 1}.xhtml">${escapeXml(ch.title)}</a></li>`
    )
    .join('\n');

  zip.file(
    'OEBPS/nav.xhtml',
    `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head>
    <title>Table of Contents</title>
  </head>
  <body>
    <nav epub:type="toc">
      <h1>Contents</h1>
      <ol>
${navLinks}
      </ol>
    </nav>
  </body>
</html>`
  );

  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${escapeXml(book.id)}</dc:identifier>
    <dc:title>${escapeXml(book.title)}</dc:title>
    <dc:creator>${escapeXml(book.author)}</dc:creator>
    <dc:language>${escapeXml(book.language || 'en')}</dc:language>
    <dc:subject>${escapeXml(book.subject || 'General')}</dc:subject>
    <dc:description>${escapeXml(book.description || book.openingExcerpt)}</dc:description>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
${manifestItems}
  </manifest>
  <spine>
${spineItems}
  </spine>
</package>`
  );

  book.chapters.forEach((chapter, idx) => {
    zip.file(`OEBPS/chapter-${idx + 1}.xhtml`, renderChapterXhtml(chapter));
  });

  return zip.generateAsync({ type: 'arraybuffer', mimeType: 'application/epub+zip' });
}

export async function createEpubFileFromBook(
  book: EpubBook,
  existingRawBuffer?: ArrayBuffer | null
): Promise<File> {
  const safeName = book.fileName.toLowerCase().endsWith('.epub')
    ? book.fileName
    : `${book.fileName}.epub`;
  const buffer = existingRawBuffer ?? (await buildEpubArrayBuffer(book));
  return new File([buffer], safeName, { type: 'application/epub+zip' });
}
