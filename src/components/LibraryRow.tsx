import { CheckCircle2, Send, Star, Trash2 } from 'lucide-react';
import type { EpubBook } from '../types/epub';
import {
  formatFileSize,
  formatShortDate,
  getBookProgressPercent,
} from '../utils/libraryLogic';
import { BookCover } from './BookCover';

interface LibraryRowProps {
  book: EpubBook;
  onOpenReader: (bookId: string, mode?: 'read' | 'skim') => void;
  onToggleStar: (bookId: string) => void;
  onOpenKindle: (book: EpubBook) => void;
  onDeleteBook: (bookId: string) => void;
}

export function LibraryRow({
  book,
  onOpenReader,
  onToggleStar,
  onOpenKindle,
  onDeleteBook,
}: LibraryRowProps) {
  const progressPct = getBookProgressPercent(book);

  return (
    <article className="group bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 transition-colors hover:border-slate-300">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Main clickable area opens Reading Mode */}
        <button
          type="button"
          onClick={() => onOpenReader(book.id, 'read')}
          className="flex flex-1 min-w-0 items-start gap-3.5 sm:gap-4 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl"
        >
          <BookCover
            title={book.title}
            author={book.author}
            coverUrl={book.coverUrl}
            size="md"
          />

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-serif text-base sm:text-lg font-semibold text-slate-950 leading-snug group-hover:text-blue-800 transition-colors truncate">
              {book.title}
            </h3>

            {/* Unboxed metadata line with clean typographic separators */}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-[13px] text-slate-600">
              <span className="font-medium text-slate-700 truncate max-w-[160px] sm:max-w-none">
                {book.author}
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="font-mono text-xs tabular-nums text-slate-500">
                {book.chapters.length} ch
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="font-mono text-xs tabular-nums text-slate-500">
                {book.estimatedReadMinutes} min
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="font-mono text-xs tabular-nums text-slate-500">
                {formatFileSize(book.fileSizeBytes)}
              </span>
            </div>

            {/* Opening excerpt for fast skimming directly in List Mode */}
            <p className="mt-2 font-serif text-sm text-slate-600 leading-relaxed line-clamp-2">
              {book.openingExcerpt}
            </p>

            {/* Quiet status row (progress + Kindle sent status, zero pills) */}
            {(progressPct > 0 || book.kindleSentAt !== null) && (
              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {progressPct > 0 && (
                  <span className="inline-flex items-center gap-2 text-slate-500">
                    <span className="h-1 w-14 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full bg-blue-700 rounded-full"
                        style={{ width: `${progressPct}%` }}
                      />
                    </span>
                    <span className="font-mono tabular-nums">
                      Ch {book.currentChapterIndex + 1}/{book.chapters.length} ({progressPct}%)
                    </span>
                  </span>
                )}

                {book.kindleSentAt !== null && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Sent to Kindle {formatShortDate(book.kindleSentAt)}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </button>

        {/* Right-aligned ergonomic 44x44 Star button (+ desktop secondary actions) */}
        <div className="flex flex-col items-end justify-between shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onToggleStar(book.id)}
            aria-pressed={book.isStarred}
            aria-label={book.isStarred ? `Unstar ${book.title}` : `Star ${book.title}`}
            title={book.isStarred ? 'Remove star' : 'Star book'}
            className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              book.isStarred
                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100'
            }`}
          >
            <Star
              className={`w-5 h-5 transition-transform ${
                book.isStarred ? 'fill-amber-500 text-amber-600 scale-105' : ''
              }`}
            />
          </button>

          <div className="hidden sm:flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onOpenReader(book.id, 'skim')}
              aria-label={`Quick skim ${book.title}`}
              className="inline-flex items-center justify-center min-h-[40px] px-2.5 text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              Skim
            </button>

            <button
              type="button"
              onClick={() => onOpenKindle(book)}
              aria-label={`Send ${book.title} to Kindle`}
              title="Send to Kindle"
              className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                book.kindleSentAt
                  ? 'text-emerald-700 hover:bg-emerald-50'
                  : 'text-slate-500 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Send className="w-[18px] h-[18px]" />
            </button>

            {book.source === 'local' && (
              <button
                type="button"
                onClick={() => onDeleteBook(book.id)}
                aria-label={`Remove ${book.title}`}
                title="Remove from library"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <Trash2 className="w-[18px] h-[18px]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-only clean bottom action strip so book excerpts never get squeezed */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex sm:hidden items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpenReader(book.id, 'skim')}
          aria-label={`Skim chapters of ${book.title}`}
          className="min-h-[40px] px-3 text-xs font-medium text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        >
          Skim Chapters
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onOpenKindle(book)}
            aria-label={`Send ${book.title} to Kindle mobile`}
            className={`min-h-[40px] inline-flex items-center gap-1.5 px-3 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              book.kindleSentAt
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <Send className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{book.kindleSentAt ? 'Resend' : 'Send to Kindle'}</span>
          </button>

          {book.source === 'local' && (
            <button
              type="button"
              onClick={() => onDeleteBook(book.id)}
              aria-label={`Delete ${book.title}`}
              className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
