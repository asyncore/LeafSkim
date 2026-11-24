import { useEffect, useState, type FormEvent } from 'react';
import { Check, CheckCircle2, Mail, RotateCcw, Send, Star } from 'lucide-react';
import type { EpubBook, KindleSettings } from '../types/epub';
import {
  formatFileSize,
  formatShortDate,
  validateKindleEmail,
} from '../utils/libraryLogic';
import { BookCover } from './BookCover';

interface KindleQueueViewProps {
  books: EpubBook[];
  kindleSettings: KindleSettings;
  onSaveKindleSettings: (next: KindleSettings) => void;
  onOpenKindleBatch: (books: EpubBook[]) => void;
  onClearKindleSent: (bookId: string) => void;
  onOpenReader: (bookId: string) => void;
}

export function KindleQueueView({
  books,
  kindleSettings,
  onSaveKindleSettings,
  onOpenKindleBatch,
  onClearKindleSent,
  onOpenReader,
}: KindleQueueViewProps) {
  const [emailDraft, setEmailDraft] = useState(kindleSettings.kindleEmail);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEmailDraft(kindleSettings.kindleEmail);
  }, [kindleSettings.kindleEmail]);

  const starredReady = books.filter((b) => b.isStarred && !b.kindleSentAt);
  const sentBooks = books
    .filter((b) => b.kindleSentAt !== null)
    .sort((a, b) => (b.kindleSentAt ?? 0) - (a.kindleSentAt ?? 0));

  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const selectedReadyBooks = starredReady.filter((b) => selectedIds[b.id] !== false);

  function toggleSelection(bookId: string) {
    setSelectedIds((prev) => ({
      ...prev,
      [bookId]: prev[bookId] === false ? true : false,
    }));
  }

  function handleSaveEmail(e: FormEvent) {
    e.preventDefault();
    const check = validateKindleEmail(emailDraft);
    if (!check.valid) {
      setError(check.error);
      setSaved(false);
      return;
    }
    setError(null);
    setEmailDraft(check.normalized);
    onSaveKindleSettings({ ...kindleSettings, kindleEmail: check.normalized });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Kindle Delivery Configuration Card */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              Kindle Delivery Queue
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Send your starred local EPUBs to your Kindle library for automatic Kindle format conversion.
            </p>
          </div>
          <div className="font-mono text-xs tabular-nums text-slate-500">
            {starredReady.length} ready · {sentBooks.length} sent
          </div>
        </div>

        <form
          onSubmit={handleSaveEmail}
          className="mt-5 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-start gap-3"
          noValidate
        >
          <div className="flex-1">
            <label
              htmlFor="queue-kindle-email"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Send-to-Kindle Email Address
            </label>
            <div className="relative">
              <Mail
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="queue-kindle-email"
                type="email"
                value={emailDraft}
                onChange={(e) => {
                  setEmailDraft(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="yourname@kindle.com"
                className="w-full min-h-[44px] pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            {error && (
              <p role="alert" className="mt-1.5 text-xs text-red-600">
                {error}
              </p>
            )}
            {saved && (
              <p className="mt-1.5 text-xs text-emerald-700 inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Kindle address saved locally.</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="sm:mt-6 min-h-[44px] px-5 py-2.5 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            Save Address
          </button>
        </form>
      </section>

      {/* Starred Books Ready to Send */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Starred &amp; Ready to Convert
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Uncheck any book you want to hold back from this batch.
            </p>
          </div>

          <button
            type="button"
            disabled={selectedReadyBooks.length === 0}
            onClick={() => onOpenKindleBatch(selectedReadyBooks)}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-blue-700 text-white hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Send Selected ({selectedReadyBooks.length})
            </span>
          </button>
        </div>

        {starredReady.length === 0 ? (
          <div className="mt-5 py-10 text-center border border-dashed border-slate-200 rounded-xl px-4">
            <Star className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">
              All starred books are already sent, or none are starred yet.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Star any EPUB while skimming in Library or Reading Mode to queue it here.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {starredReady.map((book) => {
              const checked = selectedIds[book.id] !== false;
              return (
                <li key={book.id} className="py-3.5 first:pt-1 last:pb-0 flex items-center gap-3.5">
                  <label className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelection(book.id)}
                      aria-label={`Select ${book.title} for Kindle batch`}
                      className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                    />
                  </label>

                  <BookCover
                    title={book.title}
                    author={book.author}
                    coverUrl={book.coverUrl}
                    size="sm"
                  />

                  <button
                    type="button"
                    onClick={() => onOpenReader(book.id)}
                    className="min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <p className="font-serif text-sm sm:text-base font-semibold text-slate-900 truncate hover:text-blue-700">
                      {book.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {book.author} · {formatFileSize(book.fileSizeBytes)} · {book.chapters.length} ch
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenKindleBatch([book])}
                    aria-label={`Send ${book.title} to Kindle now`}
                    className="min-h-[44px] px-3.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Send
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Sent History */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-950">Sent to Kindle</h2>
        {sentBooks.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Books you share or email to Kindle will appear here with their delivery date.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {sentBooks.map((book) => (
              <li
                key={book.id}
                className="py-3.5 first:pt-1 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <BookCover
                    title={book.title}
                    author={book.author}
                    coverUrl={book.coverUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-sm sm:text-base font-semibold text-slate-900 truncate">
                      {book.title}
                    </p>
                    <p className="text-xs text-emerald-700 inline-flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        Sent {book.kindleSentAt ? formatShortDate(book.kindleSentAt) : ''}
                        {book.kindleSentTo ? ` to ${book.kindleSentTo}` : ''}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenKindleBatch([book])}
                    className="min-h-[40px] px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Resend
                  </button>
                  <button
                    type="button"
                    onClick={() => onClearKindleSent(book.id)}
                    aria-label={`Clear sent status for ${book.title}`}
                    title="Clear sent status"
                    className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
