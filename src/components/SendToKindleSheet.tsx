import { useState, type FormEvent } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Mail,
  Share2,
  X,
} from 'lucide-react';
import type { EpubBook, KindleSettings } from '../types/epub';
import { formatFileSize, validateKindleEmail } from '../utils/libraryLogic';
import {
  buildKindleMailtoHref,
  canShareFilesNatively,
  downloadBooksForKindle,
  shareBooksViaAndroidSheet,
} from '../utils/kindleTransfer';

interface SendToKindleSheetProps {
  books: EpubBook[];
  kindleSettings: KindleSettings;
  onSaveKindleSettings: (next: KindleSettings) => void;
  onMarkSentToKindle: (bookIds: string[], targetEmail: string) => void;
  onClose: () => void;
}

export function SendToKindleSheet({
  books,
  kindleSettings,
  onSaveKindleSettings,
  onMarkSentToKindle,
  onClose,
}: SendToKindleSheetProps) {
  const [emailInput, setEmailInput] = useState(kindleSettings.kindleEmail);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [useConvertSubject, setUseConvertSubject] = useState(
    kindleSettings.defaultSubjectConvert
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const nativeShareAvailable = canShareFilesNatively();
  const totalBytes = books.reduce((sum, b) => sum + b.fileSizeBytes, 0);

  function saveValidatedEmail(): string | null {
    const check = validateKindleEmail(emailInput);
    if (!check.valid) {
      setEmailError(check.error);
      return null;
    }
    setEmailError(null);
    setEmailInput(check.normalized);
    onSaveKindleSettings({
      kindleEmail: check.normalized,
      defaultSubjectConvert: useConvertSubject,
    });
    return check.normalized;
  }

  function handleEmailFormSubmit(e: FormEvent) {
    e.preventDefault();
    const saved = saveValidatedEmail();
    if (saved) {
      setStatusMessage(`Saved Send-to-Kindle address: ${saved}`);
    }
  }

  async function handleAndroidShare() {
    setIsBusy(true);
    setStatusMessage(null);
    try {
      const result = await shareBooksViaAndroidSheet(books);
      setStatusMessage(result.message);
      if (result.ok) {
        onMarkSentToKindle(
          books.map((b) => b.id),
          kindleSettings.kindleEmail || 'Android Kindle App'
        );
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDownloadAndEmail() {
    const validEmail = saveValidatedEmail();
    if (!validEmail) return;

    setIsBusy(true);
    setStatusMessage(null);
    try {
      const downloaded = await downloadBooksForKindle(books);
      onMarkSentToKindle(
        books.map((b) => b.id),
        validEmail
      );
      setStatusMessage(
        `Downloaded ${downloaded.length} EPUB file${downloaded.length > 1 ? 's' : ''} and marked sent to ${validEmail}. Attach the file(s) in your email app to convert to Kindle format.`
      );
      const mailto = buildKindleMailtoHref(validEmail, books, useConvertSubject);
      const a = document.createElement('a');
      a.href = mailto;
      a.click();
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDownloadOnly() {
    setIsBusy(true);
    setStatusMessage(null);
    try {
      const downloaded = await downloadBooksForKindle(books);
      setStatusMessage(
        `Downloaded ${downloaded.join(', ')}. Drop into amazon.com/sendtokindle to convert into Kindle format.`
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCopyEmail() {
    const validEmail = saveValidatedEmail();
    if (!validEmail) return;
    try {
      await navigator.clipboard.writeText(validEmail);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      setStatusMessage(`Your Kindle email: ${validEmail}`);
    }
  }

  function handleMarkSentManually() {
    const target =
      emailInput.trim() && validateKindleEmail(emailInput).valid
        ? validateKindleEmail(emailInput).normalized
        : kindleSettings.kindleEmail || 'Kindle Library';
    onMarkSentToKindle(
      books.map((b) => b.id),
      target
    );
    setStatusMessage(
      `Marked ${books.length === 1 ? `"${books[0].title}"` : `${books.length} books`} as sent to Kindle.`
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kindle-sheet-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs sm:p-4"
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Mobile grab handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <span className="w-10 h-1.5 rounded-full bg-slate-300" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 pt-3 sm:pt-5 pb-4 border-b border-slate-200">
          <div>
            <h2 id="kindle-sheet-title" className="text-lg font-semibold text-slate-950">
              Send to Kindle Library
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Amazon automatically converts EPUB files into Kindle format (KFX) on delivery.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Send to Kindle dialog"
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {/* Selected EPUB Summary */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium text-slate-900">
                {books.length === 1 ? '1 EPUB selected' : `${books.length} EPUBs selected`}
              </span>
              <span className="font-mono tabular-nums">{formatFileSize(totalBytes)}</span>
            </div>
            <ul className="mt-2 space-y-1">
              {books.slice(0, 4).map((b) => (
                <li
                  key={b.id}
                  className="font-serif text-sm text-slate-800 truncate flex items-center justify-between gap-2"
                >
                  <span className="truncate">{b.title}</span>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">
                    {b.fileName}
                  </span>
                </li>
              ))}
              {books.length > 4 && (
                <li className="text-xs text-slate-500">+ {books.length - 4} more books</li>
              )}
            </ul>
          </div>

          {/* Option 1: Android Native Share Sheet -> Kindle App */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-950">
                1. Share directly to Android Kindle app
              </h3>
              <span className="text-xs text-slate-500">
                {nativeShareAvailable ? 'Supported on this device' : 'Android Chrome'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Opens your Android Share Sheet with the EPUB file attached. Choose{' '}
              <strong className="font-medium text-slate-800">Kindle</strong> to upload and convert straight into your Kindle library.
            </p>
            <button
              type="button"
              disabled={isBusy}
              onClick={handleAndroidShare}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Share EPUB to Kindle App</span>
            </button>
          </div>

          {/* Option 2: Send-to-Kindle Email */}
          <form onSubmit={handleEmailFormSubmit} className="space-y-3 pt-4 border-t border-slate-200" noValidate>
            <h3 className="text-sm font-semibold text-slate-950">
              2. Email to your @kindle.com address
            </h3>

            <div>
              <label
                htmlFor="sheet-kindle-email"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Send-to-Kindle Email
              </label>
              <div className="flex gap-2">
                <input
                  id="sheet-kindle-email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="yourname@kindle.com"
                  className="flex-1 min-h-[44px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-3.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  aria-label="Copy Kindle email address"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  {copiedEmail ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              {emailError && (
                <p role="alert" className="mt-1.5 text-xs text-red-600">
                  {emailError}
                </p>
              )}
            </div>

            <label className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useConvertSubject}
                onChange={(e) => setUseConvertSubject(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>Set email subject to &ldquo;Convert&rdquo; for Kindle formatting</span>
            </label>

            <button
              type="button"
              disabled={isBusy}
              onClick={handleDownloadAndEmail}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Download EPUB &amp; Open Email App</span>
            </button>
          </form>

          {/* Option 3: Amazon Web Uploader */}
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <h3 className="text-sm font-semibold text-slate-950">
              3. Amazon Send to Kindle Web Uploader
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={handleDownloadOnly}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Download .epub</span>
              </button>

              <a
                href="https://www.amazon.com/sendtokindle"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors whitespace-nowrap"
              >
                <span>Open amazon.com/sendtokindle</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </a>
            </div>
          </div>

          {statusMessage && (
            <div
              role="status"
              className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-3 text-xs text-emerald-900 leading-relaxed"
            >
              {statusMessage}
            </div>
          )}
        </div>

        {/* Footer confirmation */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 pb-safe">
          <button
            type="button"
            onClick={handleMarkSentManually}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-100/70 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Mark as Sent to Kindle</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
