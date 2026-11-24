import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  List,
  Minus,
  Plus,
  Send,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import type {
  EpubBook,
  ReaderMode,
  ReaderPaperTheme,
  ReaderSettings,
} from '../types/epub';

interface ReaderViewProps {
  book: EpubBook;
  initialMode?: ReaderMode;
  settings: ReaderSettings;
  adjacentBooks: {
    prevId: string | null;
    nextId: string | null;
    index: number;
    total: number;
  };
  onUpdateSettings: (next: ReaderSettings) => void;
  onClose: () => void;
  onToggleStar: (bookId: string) => void;
  onOpenKindle: (book: EpubBook) => void;
  onChangeChapter: (bookId: string, chapterIndex: number) => void;
  onUpdateScroll: (bookId: string, scrollPercent: number) => void;
  onSelectBook: (bookId: string, mode: ReaderMode) => void;
}

const PAPER_STYLES: Record<
  ReaderPaperTheme,
  {
    shell: string;
    bar: string;
    heading: string;
    prose: string;
    muted: string;
    card: string;
    quote: string;
    divider: string;
    buttonHover: string;
  }
> = {
  crisp: {
    shell: 'bg-white text-slate-900',
    bar: 'bg-white/95 border-slate-200 text-slate-900',
    heading: 'text-slate-950',
    prose: 'text-slate-800',
    muted: 'text-slate-500',
    card: 'bg-slate-50 border-slate-200 hover:border-slate-300',
    quote: 'bg-slate-50 border-slate-200 text-slate-700',
    divider: 'border-slate-200',
    buttonHover: 'hover:bg-slate-100',
  },
  paper: {
    shell: 'bg-[#F5F1E8] text-[#1F1C17]',
    bar: 'bg-[#F5F1E8]/95 border-[#E2DACB] text-[#1F1C17]',
    heading: 'text-[#181510]',
    prose: 'text-[#2B261F]',
    muted: 'text-[#6B6256]',
    card: 'bg-[#EFE9DC] border-[#DDD3C1] hover:border-[#C7B9A1]',
    quote: 'bg-[#ECE5D7] border-[#D9CEBA] text-[#3B342A]',
    divider: 'border-[#E2DACB]',
    buttonHover: 'hover:bg-[#E9E1D2]',
  },
  night: {
    shell: 'bg-[#12151B] text-slate-100',
    bar: 'bg-[#12151B]/95 border-slate-800 text-slate-100',
    heading: 'text-white',
    prose: 'text-slate-200 tracking-[0.01em]',
    muted: 'text-slate-400',
    card: 'bg-[#1A1F28] border-slate-800 hover:border-slate-700',
    quote: 'bg-[#1A1F28] border-slate-700 text-slate-300',
    divider: 'border-slate-800',
    buttonHover: 'hover:bg-slate-800',
  },
};

export function ReaderView({
  book,
  initialMode,
  settings,
  adjacentBooks,
  onUpdateSettings,
  onClose,
  onToggleStar,
  onOpenKindle,
  onChangeChapter,
  onUpdateScroll,
  onSelectBook,
}: ReaderViewProps) {
  const [mode, setMode] = useState<ReaderMode>(initialMode ?? settings.defaultMode);
  const [showControls, setShowControls] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const chapterIndex = Math.min(
    Math.max(0, book.currentChapterIndex),
    Math.max(0, book.chapters.length - 1)
  );
  const chapter = book.chapters[chapterIndex];
  const theme = PAPER_STYLES[settings.paperTheme];

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode, book.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [book.id, chapterIndex, mode]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === 'Escape') {
        if (showControls) setShowControls(false);
        else if (showToc) setShowToc(false);
        else onClose();
      } else if (e.key === 'ArrowRight' && mode === 'read' && chapterIndex < book.chapters.length - 1) {
        onChangeChapter(book.id, chapterIndex + 1);
      } else if (e.key === 'ArrowLeft' && mode === 'read' && chapterIndex > 0) {
        onChangeChapter(book.id, chapterIndex - 1);
      } else if (e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        onToggleStar(book.id);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [book.id, book.chapters.length, chapterIndex, mode, onChangeChapter, onClose, onToggleStar, showControls, showToc]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || mode !== 'read') return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      onUpdateScroll(book.id, 100);
      return;
    }
    const pct = Math.min(100, Math.max(0, Math.round((el.scrollTop / maxScroll) * 100)));
    onUpdateScroll(book.id, pct);
  }

  function handleSwitchMode(nextMode: ReaderMode) {
    setMode(nextMode);
    onUpdateSettings({ ...settings, defaultMode: nextMode });
  }

  return (
    <div
      data-testid="reader-view"
      className={`fixed inset-0 z-50 flex flex-col ${theme.shell} transition-colors duration-150`}
    >
      {/* Compact Top Reading Bar (52px mobile, 58px desktop) */}
      <header
        className={`shrink-0 h-[52px] md:h-[58px] border-b backdrop-blur-md ${theme.bar}`}
      >
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-2 px-2 sm:px-5">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <button
              type="button"
              onClick={onClose}
              aria-label="Back to library"
              className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl transition-colors cursor-pointer shrink-0 ${theme.buttonHover}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-sm sm:text-base font-semibold truncate leading-tight">
                {book.title}
              </h1>
              <p className={`text-[11px] sm:text-xs truncate ${theme.muted}`}>
                {book.author}
                {book.kindleSentAt ? ' · Sent to Kindle' : ''}
              </p>
            </div>
          </div>

          {/* Read / Skim segmented toggle */}
          <div
            role="tablist"
            aria-label="Reading mode"
            className={`hidden sm:inline-flex items-center p-0.5 rounded-xl border ${theme.divider}`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'read'}
              onClick={() => handleSwitchMode('read')}
              className={`min-h-[34px] px-3 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'read'
                  ? 'bg-blue-700 text-white'
                  : `${theme.muted} hover:text-current`
              }`}
            >
              Read
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'skim'}
              onClick={() => handleSwitchMode('skim')}
              className={`min-h-[34px] px-3 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'skim'
                  ? 'bg-blue-700 text-white'
                  : `${theme.muted} hover:text-current`
              }`}
            >
              Skim
            </button>
          </div>

          {/* Primary Reader Actions: Star (Always Visible!), Send to Kindle, TOC, Settings */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleStar(book.id)}
              aria-pressed={book.isStarred}
              aria-label={
                book.isStarred
                  ? `Unstar ${book.title} in reader`
                  : `Star ${book.title} in reader`
              }
              title={book.isStarred ? 'Starred (press S to toggle)' : 'Star this book (press S)'}
              className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 ${
                book.isStarred
                  ? 'bg-amber-500/15 text-amber-500'
                  : `${theme.muted} ${theme.buttonHover}`
              }`}
            >
              <Star
                className={`w-5 h-5 ${book.isStarred ? 'fill-amber-500 text-amber-500' : ''}`}
              />
            </button>

            <button
              type="button"
              onClick={() => onOpenKindle(book)}
              aria-label={`Send ${book.title} to Kindle from reader`}
              title="Send to Kindle"
              className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                book.kindleSentAt
                  ? 'text-emerald-500'
                  : `${theme.muted} ${theme.buttonHover}`
              }`}
            >
              {book.kindleSentAt ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Send className="w-[18px] h-[18px]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowToc((prev) => !prev);
                setShowControls(false);
              }}
              aria-expanded={showToc}
              aria-label="Table of contents"
              className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl transition-colors cursor-pointer ${theme.buttonHover}`}
            >
              <List className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowControls((prev) => !prev);
                setShowToc(false);
              }}
              aria-expanded={showControls}
              aria-label="Reader display settings"
              className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl transition-colors cursor-pointer ${theme.buttonHover}`}
            >
              <SlidersHorizontal className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </header>

      {/* Collapsible Typography & Theme Panel */}
      {showControls && (
        <div
          className={`shrink-0 border-b px-4 py-3.5 ${theme.bar}`}
          aria-label="Reader appearance controls"
        >
          <div className="mx-auto max-w-2xl flex flex-wrap items-center justify-between gap-4">
            {/* Mobile Read/Skim switch inside controls as well */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className={`text-xs font-medium ${theme.muted}`}>View</span>
              <div className={`inline-flex p-0.5 rounded-lg border ${theme.divider}`}>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('read')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                    mode === 'read' ? 'bg-blue-700 text-white' : theme.muted
                  }`}
                >
                  Read
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('skim')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                    mode === 'skim' ? 'bg-blue-700 text-white' : theme.muted
                  }`}
                >
                  Skim
                </button>
              </div>
            </div>

            {/* Font size controls */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${theme.muted}`}>Text size</span>
              <button
                type="button"
                aria-label="Decrease font size"
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    fontSizePx: Math.max(15, settings.fontSizePx - 1),
                  })
                }
                className={`min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg border ${theme.divider} ${theme.buttonHover} cursor-pointer`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs tabular-nums w-9 text-center">
                {settings.fontSizePx}px
              </span>
              <button
                type="button"
                aria-label="Increase font size"
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    fontSizePx: Math.min(24, settings.fontSizePx + 1),
                  })
                }
                className={`min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg border ${theme.divider} ${theme.buttonHover} cursor-pointer`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Paper Theme Switch */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${theme.muted}`}>Surface</span>
              {(['crisp', 'paper', 'night'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, paperTheme: t })}
                  className={`min-h-[40px] px-3 text-xs font-medium rounded-lg border capitalize transition-colors cursor-pointer ${
                    settings.paperTheme === t
                      ? 'border-blue-600 bg-blue-700 text-white'
                      : `${theme.divider} ${theme.buttonHover}`
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Scrollable Content Area */}
      <div className="relative flex-1 min-h-0 flex overflow-hidden">
        {/* Table of Contents Drawer */}
        {showToc && (
          <aside
            aria-label="Chapters"
            className={`absolute inset-y-0 left-0 z-20 w-72 max-w-[85vw] border-r shadow-lg overflow-y-auto ${theme.bar}`}
          >
            <div className={`flex items-center justify-between px-4 py-3 border-b ${theme.divider}`}>
              <h2 className="text-sm font-semibold">Contents ({book.chapters.length})</h2>
              <button
                type="button"
                onClick={() => setShowToc(false)}
                aria-label="Close table of contents"
                className={`min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg cursor-pointer ${theme.buttonHover}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="p-2 space-y-1">
              {book.chapters.map((ch, idx) => (
                <li key={ch.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeChapter(book.id, idx);
                      setMode('read');
                      setShowToc(false);
                    }}
                    className={`w-full min-h-[44px] px-3 py-2.5 text-left rounded-xl transition-colors cursor-pointer ${
                      idx === chapterIndex
                        ? 'bg-blue-700 text-white font-medium'
                        : `${theme.buttonHover}`
                    }`}
                  >
                    <p className="font-serif text-sm leading-snug">{ch.title}</p>
                    <p
                      className={`mt-0.5 font-mono text-[11px] tabular-nums ${
                        idx === chapterIndex ? 'text-blue-100' : theme.muted
                      }`}
                    >
                      {ch.wordCount} words
                    </p>
                  </button>
                </li>
              ))}
            </ol>
          </aside>
        )}

        <main
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-5 sm:px-8 py-7 sm:py-10"
        >
          {/* Mobile inline Read / Skim toggle right above content */}
          <div className="mx-auto max-w-[65ch] mb-6 flex items-center justify-between gap-3 sm:hidden">
            <div className={`inline-flex p-0.5 rounded-xl border ${theme.divider}`}>
              <button
                type="button"
                onClick={() => handleSwitchMode('read')}
                className={`min-h-[38px] px-4 text-xs font-medium rounded-lg cursor-pointer ${
                  mode === 'read' ? 'bg-blue-700 text-white' : theme.muted
                }`}
              >
                Read
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('skim')}
                className={`min-h-[38px] px-4 text-xs font-medium rounded-lg cursor-pointer ${
                  mode === 'skim' ? 'bg-blue-700 text-white' : theme.muted
                }`}
              >
                Skim Chapters
              </button>
            </div>

            <span className={`font-mono text-xs tabular-nums ${theme.muted}`}>
              Book {adjacentBooks.index + 1}/{adjacentBooks.total}
            </span>
          </div>

          {mode === 'skim' ? (
            <div className="mx-auto max-w-[68ch]">
              <div className="mb-6">
                <p className={`text-xs font-medium ${theme.muted}`}>
                  Chapter Skim Outline · {book.chapters.length} chapters · {book.estimatedReadMinutes} min full read
                </p>
                <h2 className={`mt-1.5 font-serif text-2xl sm:text-3xl font-semibold ${theme.heading}`}>
                  {book.title}
                </h2>
                <p className={`mt-2 text-sm leading-relaxed ${theme.muted}`}>
                  {book.description}
                </p>
              </div>

              <div className="space-y-3.5">
                {book.chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      onChangeChapter(book.id, idx);
                      setMode('read');
                    }}
                    className={`w-full text-left rounded-2xl border p-4 sm:p-5 transition-colors cursor-pointer ${theme.card}`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className={`font-serif text-base sm:text-lg font-semibold ${theme.heading}`}>
                        {ch.title}
                      </h3>
                      <span className={`font-mono text-xs tabular-nums shrink-0 ${theme.muted}`}>
                        {ch.wordCount} w
                      </span>
                    </div>
                    <p className={`mt-2 font-serif text-sm sm:text-[15px] leading-relaxed ${theme.prose}`}>
                      {ch.excerpt}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600">
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Read chapter {idx + 1}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <article className="mx-auto max-w-[65ch]">
              <div className={`mb-6 flex items-center justify-between text-xs ${theme.muted}`}>
                <span className="font-mono tabular-nums">
                  Chapter {chapterIndex + 1} of {book.chapters.length}
                </span>
                <span className="font-mono tabular-nums">{chapter?.wordCount ?? 0} words</span>
              </div>

              <div
                className="font-serif space-y-5"
                style={{
                  fontSize: `${settings.fontSizePx}px`,
                  lineHeight: settings.lineHeight,
                }}
              >
                {chapter?.blocks.map((block, idx) => {
                  if (block.type === 'heading') {
                    return (
                      <h2
                        key={idx}
                        className={`text-2xl sm:text-3xl font-semibold leading-tight tracking-tight mb-4 ${theme.heading}`}
                      >
                        {block.text}
                      </h2>
                    );
                  }
                  if (block.type === 'subheading') {
                    return (
                      <h3
                        key={idx}
                        className={`text-xl font-semibold leading-snug pt-2 ${theme.heading}`}
                      >
                        {block.text}
                      </h3>
                    );
                  }
                  if (block.type === 'quote') {
                    return (
                      <blockquote
                        key={idx}
                        className={`my-6 rounded-xl border px-5 py-4 italic ${theme.quote}`}
                      >
                        {block.text}
                      </blockquote>
                    );
                  }
                  return (
                    <p key={idx} className={theme.prose}>
                      {block.text}
                    </p>
                  );
                })}
              </div>

              {/* End-of-chapter quick actions */}
              <div className={`mt-12 pt-6 border-t ${theme.divider} flex flex-wrap items-center justify-between gap-3`}>
                <button
                  type="button"
                  onClick={() => onToggleStar(book.id)}
                  className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-colors cursor-pointer ${
                    book.isStarred
                      ? 'border-amber-400 bg-amber-500/15 text-amber-600'
                      : `${theme.divider} ${theme.buttonHover}`
                  }`}
                >
                  <Star
                    className={`w-4 h-4 ${book.isStarred ? 'fill-amber-500 text-amber-500' : ''}`}
                  />
                  <span>{book.isStarred ? 'Starred Favorite' : 'Star This Book'}</span>
                </button>

                {chapterIndex < book.chapters.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => onChangeChapter(book.id, chapterIndex + 1)}
                    className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-blue-700 text-white hover:bg-blue-800 transition-colors cursor-pointer"
                  >
                    <span>Next Chapter</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenKindle(book)}
                    className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-blue-700 text-white hover:bg-blue-800 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send to Kindle</span>
                  </button>
                )}
              </div>
            </article>
          )}
        </main>
      </div>

      {/* Compact Thumb-Zone Bottom Bar: Chapter Nav + Rapid Book-to-Book Skimming */}
      <footer
        className={`shrink-0 border-t backdrop-blur-md pb-safe ${theme.bar}`}
      >
        <div className="mx-auto max-w-5xl h-[56px] px-2 sm:px-5 flex items-center justify-between gap-2">
          {/* Chapter navigation */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={chapterIndex <= 0}
              onClick={() => {
                setMode('read');
                onChangeChapter(book.id, chapterIndex - 1);
              }}
              aria-label="Previous chapter"
              className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${theme.buttonHover}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className={`font-mono text-xs tabular-nums px-1.5 whitespace-nowrap ${theme.muted}`}>
              Ch {chapterIndex + 1}/{book.chapters.length}
            </span>

            <button
              type="button"
              disabled={chapterIndex >= book.chapters.length - 1}
              onClick={() => {
                setMode('read');
                onChangeChapter(book.id, chapterIndex + 1);
              }}
              aria-label="Next chapter"
              className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${theme.buttonHover}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Book-to-Book Rapid Skim Navigation */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!adjacentBooks.prevId}
              onClick={() => adjacentBooks.prevId && onSelectBook(adjacentBooks.prevId, mode)}
              className={`min-h-[44px] px-3 inline-flex items-center gap-1 text-xs font-medium rounded-xl border transition-colors whitespace-nowrap cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${theme.divider} ${theme.buttonHover}`}
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Prev Book</span>
            </button>

            <button
              type="button"
              disabled={!adjacentBooks.nextId}
              onClick={() => adjacentBooks.nextId && onSelectBook(adjacentBooks.nextId, mode)}
              className={`min-h-[44px] px-3 inline-flex items-center gap-1 text-xs font-medium rounded-xl border transition-colors whitespace-nowrap cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${theme.divider} ${theme.buttonHover}`}
            >
              <span>Next Book</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
