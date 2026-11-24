import type { EpubBook } from '../types/epub';
import { createEpubFileFromBook } from './epubBuilder';
import { loadRawEpubBuffer } from './storage';

export function canShareFilesNatively(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false;
  }
  if (typeof navigator.canShare !== 'function') {
    return false;
  }
  try {
    const probe = new File(['probe'], 'probe.epub', { type: 'application/epub+zip' });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export async function prepareEpubFiles(books: EpubBook[]): Promise<File[]> {
  const files: File[] = [];
  for (const book of books) {
    const rawBuffer = await loadRawEpubBuffer(book.id);
    const file = await createEpubFileFromBook(book, rawBuffer);
    files.push(file);
  }
  return files;
}

export async function shareBooksViaAndroidSheet(
  books: EpubBook[]
): Promise<{ ok: boolean; cancelled?: boolean; message: string }> {
  if (books.length === 0) {
    return { ok: false, message: 'Select at least one EPUB book to share.' };
  }

  const files = await prepareEpubFiles(books);

  if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
    try {
      if (navigator.canShare({ files })) {
        await navigator.share({
          files,
          title:
            books.length === 1
              ? `${books[0].title} — Send to Kindle`
              : `${books.length} EPUB books — Send to Kindle`,
          text: 'Send EPUB to Kindle library for automatic Kindle format conversion.',
        });
        return {
          ok: true,
          message:
            books.length === 1
              ? `Shared "${books[0].title}" to your device Share Sheet.`
              : `Shared ${books.length} EPUB files to your device Share Sheet.`,
        };
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { ok: false, cancelled: true, message: 'Share cancelled.' };
      }
      return {
        ok: false,
        message: 'Native file sharing was declined by the browser. Use Download & Email below.',
      };
    }
  }

  return {
    ok: false,
    message:
      'Android Share Sheet is available on mobile Chrome/Edge. On desktop, download the EPUB below to email or upload to Amazon Send to Kindle.',
  };
}

export function triggerFileDownload(file: File): void {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function downloadBooksForKindle(books: EpubBook[]): Promise<string[]> {
  const files = await prepareEpubFiles(books);
  const names: string[] = [];
  for (const file of files) {
    triggerFileDownload(file);
    names.push(file.name);
  }
  return names;
}

export function buildKindleMailtoHref(
  kindleEmail: string,
  books: EpubBook[],
  useConvertSubject: boolean
): string {
  const subject = useConvertSubject
    ? 'Convert'
    : books.length === 1
      ? books[0].title
      : `Send to Kindle (${books.length} books)`;

  const fileList = books.map((b) => `- ${b.title} (${b.fileName})`).join('\n');
  const body = `Attach the downloaded .epub file(s) below so Amazon converts them to Kindle format:\n\n${fileList}\n`;

  return `mailto:${encodeURIComponent(kindleEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
