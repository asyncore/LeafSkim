import { useEffect, useState, type FormEvent } from 'react';
import { Check, FolderOpen, Mail, Send, Star } from 'lucide-react';
import type { EpubBook, KindleSettings } from '../types/epub';
import { validateKindleEmail } from '../utils/libraryLogic';

interface KindleSidebarProps {
  starredBooks: EpubBook[];
  kindleSettings: KindleSettings;
  onSaveKindleSettings: (next: KindleSettings) => void;
  onOpenKindleBatch: (books: EpubBook[]) => void;
  onOpenReader: (bookId: string) => void;
  onTriggerFolderImport: () => void;
}

export function KindleSidebar({
  starredBooks,
  kindleSettings,
  onSaveKindleSettings,
  onOpenKindleBatch,
  onOpenReader,
  onTriggerFolderImport,
}: KindleSidebarProps) {
  const [emailDraft, setEmailDraft] = useState(kindleSettings.kindleEmail);
  const [error, setError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    setEmailDraft(kindleSettings.kindleEmail);
  }, [kindleSettings.kindleEmail]);

  const unsentStarred = starredBooks.filter((b) => !b.kindleSentAt);

  function handleSaveEmail(e: FormEvent) {
    e.preventDefault();
    const check = validateKindleEmail(emailDraft);
    if (!check.valid) {
      setError(check.error);
      setSavedToast(false);
      return;
    }
    setError(null);
    setEmailDraft(check.normalized);
    onSaveKindleSettings({ ...kindleSettings, kindleEmail: check.normalized });
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 2500);
  }

  return (
    <aside className="hidden lg:flex lg:w-[320px] xl:w-[340px] shrink-0 flex-col gap-6">
      {/* Starred & Kindle Queue Summary */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-950">Starred for Kindle</h2>
          <span className="font-mono text-xs tabular-nums text-slate-500">
            {starredBooks.length} starred
          </span>
        </div>

        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
          Star books while skimming, then transfer your keepers to Kindle format in one batch.
        </p>

        {starredBooks.length === 0 ? (
          <div className="mt-4 py-6 text-center border border-dashed border-slate-200 rounded-xl px-3">
            <Star className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs text-slate-500">
              No starred EPUBs yet. Tap the star icon on any book in list or reading mode.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {starredBooks.slice(0, 5).map((book) => (
              <li key={book.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenReader(book.id)}
                    aria-label={`Open ${book.title}`}
                    className="min-w-0 flex-1 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                  >
                    <p className="font-serif text-sm font-semibold text-slate-900 truncate group-hover:text-blue-700">
                      {book.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {book.author}
                      {book.kindleSentAt ? ' · Sent' : ' · Ready'}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenKindleBatch([book])}
                    aria-label={`Send ${book.title} to Kindle from sidebar`}
                    className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          disabled={starredBooks.length === 0}
          onClick={() =>
            onOpenKindleBatch(unsentStarred.length > 0 ? unsentStarred : starredBooks)
          }
          className="mt-4 w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
        >
          <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            {unsentStarred.length > 0
              ? `Send ${unsentStarred.length} Ready to Kindle`
              : starredBooks.length > 0
                ? `Send ${starredBooks.length} Starred to Kindle`
                : 'Star Books to Send'}
          </span>
        </button>
      </section>

      {/* Send-to-Kindle Email Configuration */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-950">Kindle Delivery Address</h2>
        </div>

        <form onSubmit={handleSaveEmail} className="mt-3 space-y-2.5" noValidate>
          <div>
            <label htmlFor="sidebar-kindle-email" className="sr-only">
              Send-to-Kindle email address
            </label>
            <input
              id="sidebar-kindle-email"
              type="email"
              value={emailDraft}
              onChange={(e) => {
                setEmailDraft(e.target.value);
                if (error) setError(null);
              }}
              placeholder="yourname@kindle.com"
              className="w-full min-h-[42px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
            {error && (
              <p role="alert" className="mt-1.5 text-xs text-red-600">
                {error}
              </p>
            )}
            {savedToast && (
              <p className="mt-1.5 text-xs text-emerald-700 inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Saved Kindle address</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full min-h-[40px] px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Save Kindle Address
          </button>
        </form>
      </section>

      {/* Local Folder Scan Shortcut */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-slate-950">Local Device Folder</h2>
        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
          Scan an entire Downloads or Books folder from your device—all files stay stored privately in your browser.
        </p>
        <button
          type="button"
          onClick={onTriggerFolderImport}
          className="mt-3.5 w-full min-h-[42px] inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
        >
          <FolderOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Scan Local Folder</span>
        </button>
      </section>
    </aside>
  );
}
