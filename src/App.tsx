import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  AlertCircle,
  BookOpen,
  FolderOpen,
  Search,
  Send,
  Star,
  Upload,
  X,
} from 'lucide-react';
import type {
  ActiveTab,
  EpubBook,
  KindleSettings,
  LibraryFilter,
  ReaderMode,
  ReaderSettings,
  SortOption,
} from './types/epub';
import { parseEpubArrayBuffer } from './utils/epubParser';
import { filterAndSortBooks, getAdjacentBookIds } from './utils/libraryLogic';
import {
  DEFAULT_KINDLE_SETTINGS,
  DEFAULT_READER_SETTINGS,
  deleteBookFromStorage,
  loadKindleSettings,
  loadLibraryBooks,
  loadReaderSettings,
  saveBook,
  saveKindleSettings,
  saveRawEpubBuffer,
  saveReaderSettings,
} from './utils/storage';
import { TopBar } from './components/TopBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LibraryRow } from './components/LibraryRow';
import { KindleSidebar } from './components/KindleSidebar';
import { ReaderView } from './components/ReaderView';
import { SendToKindleSheet } from './components/SendToKindleSheet';
import { KindleQueueView } from './components/KindleQueueView';

export default function App() {
  const [books, setBooks] = useState<EpubBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [sort, setSort] = useState<SortOption>('recent');
  const [query, setQuery] = useState('');

  const [readerState, setReaderState] = useState<{
    bookId: string;
    mode: ReaderMode;
  } | null>(null);
  const [kindleTargetBooks, setKindleTargetBooks] = useState<EpubBook[] | null>(null);

  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS);
  const [kindleSettings, setKindleSettings] = useState<KindleSettings>(DEFAULT_KINDLE_SETTINGS);

  const [isImporting, setIsImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<{
    tone: 'info' | 'error';
    message: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;
    setReaderSettings(loadReaderSettings());
    setKindleSettings(loadKindleSettings());

    loadLibraryBooks().then((loaded) => {
      if (!mounted) return;
      setBooks(loaded);
      setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const starredBooks = useMemo(
    () =>
      books
        .filter((b) => b.isStarred)
        .sort((a, b) => (b.starredAt ?? b.addedAt) - (a.starredAt ?? a.addedAt)),
    [books]
  );

  const kindleSentCount = useMemo(
    () => books.filter((b) => b.kindleSentAt !== null).length,
    [books]
  );

  const effectiveFilter: LibraryFilter = activeTab === 'starred' ? 'starred' : filter;

  const visibleBooks = useMemo(
    () =>
      filterAndSortBooks(books, {
        filter: effectiveFilter,
        query,
        sort,
      }),
    [books, effectiveFilter, query, sort]
  );

  const activeReaderBook = useMemo(
    () => (readerState ? books.find((b) => b.id === readerState.bookId) ?? null : null),
    [books, readerState]
  );

  const adjacentBooks = useMemo(() => {
    if (!activeReaderBook) {
      return { prevId: null, nextId: null, index: -1, total: 0 };
    }
    const ordered = visibleBooks.some((b) => b.id === activeReaderBook.id)
      ? visibleBooks
      : books;
    return getAdjacentBookIds(ordered, activeReaderBook.id);
  }, [activeReaderBook, books, visibleBooks]);

  const handleUpdateReaderSettings = useCallback((next: ReaderSettings) => {
    setReaderSettings(next);
    saveReaderSettings(next);
  }, []);

  const handleSaveKindleSettings = useCallback((next: KindleSettings) => {
    setKindleSettings(next);
    saveKindleSettings(next);
  }, []);

  const handleToggleStar = useCallback((bookId: string) => {
    setBooks((prev) =>
      prev.map((book) => {
        if (book.id !== bookId) return book;
        const nextStarred = !book.isStarred;
        const updated: EpubBook = {
          ...book,
          isStarred: nextStarred,
          starredAt: nextStarred ? Date.now() : null,
        };
        void saveBook(updated);
        return updated;
      })
    );
  }, []);

  const handleOpenReader = useCallback(
    (bookId: string, mode: ReaderMode = readerSettings.defaultMode) => {
      const now = Date.now();
      setBooks((prev) =>
        prev.map((book) => {
          if (book.id !== bookId) return book;
          const updated: EpubBook = { ...book, lastOpenedAt: now };
          void saveBook(updated);
          return updated;
        })
      );
      setReaderState({ bookId, mode });
    },
    [readerSettings.defaultMode]
  );

  const handleChangeChapter = useCallback((bookId: string, chapterIndex: number) => {
    setBooks((prev) =>
      prev.map((book) => {
        if (book.id !== bookId) return book;
        const clamped = Math.min(Math.max(0, chapterIndex), Math.max(0, book.chapters.length - 1));
        const updated: EpubBook = {
          ...book,
          currentChapterIndex: clamped,
          scrollPercent: 0,
          lastOpenedAt: Date.now(),
        };
        void saveBook(updated);
        return updated;
      })
    );
  }, []);

  const handleUpdateScroll = useCallback((bookId: string, scrollPercent: number) => {
    setBooks((prev) =>
      prev.map((book) => {
        if (book.id !== bookId) return book;
        if (Math.abs(book.scrollPercent - scrollPercent) < 8 && scrollPercent < 95) {
          return book;
        }
        const updated: EpubBook = { ...book, scrollPercent };
        void saveBook(updated);
        return updated;
      })
    );
  }, []);

  const handleMarkSentToKindle = useCallback((bookIds: string[], targetEmail: string) => {
    const idSet = new Set(bookIds);
    const now = Date.now();
    setBooks((prev) =>
      prev.map((book) => {
        if (!idSet.has(book.id)) return book;
        const updated: EpubBook = {
          ...book,
          kindleSentAt: now,
          kindleSentTo: targetEmail,
        };
        void saveBook(updated);
        return updated;
      })
    );
  }, []);

  const handleClearKindleSent = useCallback((bookId: string) => {
    setBooks((prev) =>
      prev.map((book) => {
        if (book.id !== bookId) return book;
        const updated: EpubBook = {
          ...book,
          kindleSentAt: null,
          kindleSentTo: null,
        };
        void saveBook(updated);
        return updated;
      })
    );
  }, []);

  const handleDeleteBook = useCallback((bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    void deleteBookFromStorage(bookId);
  }, []);

  const importFiles = useCallback(async (fileList: File[]) => {
    const epubFiles = fileList.filter((f) => f.name.toLowerCase().endsWith('.epub'));
    if (epubFiles.length === 0) {
      setImportNotice({
        tone: 'error',
        message: 'No .epub files were found in that selection. Choose one or more .epub files.',
      });
      return;
    }

    setIsImporting(true);
    setImportNotice(null);

    const parsedBooks: EpubBook[] = [];
    const failedNames: string[] = [];

    for (const file of epubFiles) {
      try {
        const buffer = await file.arrayBuffer();
        const book = await parseEpubArrayBuffer(buffer, file.name, file.size);
        await saveBook(book);
        await saveRawEpubBuffer(book.id, buffer);
        parsedBooks.push(book);
      } catch {
        failedNames.push(file.name);
      }
    }

    if (parsedBooks.length > 0) {
      setBooks((prev) => [...parsedBooks, ...prev]);
      setActiveTab('library');
      setFilter('all');
    }

    if (failedNames.length > 0 && parsedBooks.length === 0) {
      setImportNotice({
        tone: 'error',
        message: `Could not read ${failedNames.join(', ')}. Make sure the file is a valid DRM-free EPUB.`,
      });
    } else if (failedNames.length > 0) {
      setImportNotice({
        tone: 'info',
        message: `Imported ${parsedBooks.length} EPUB${parsedBooks.length > 1 ? 's' : ''}. Skipped ${failedNames.length} unreadable file(s).`,
      });
    } else {
      setImportNotice({
        tone: 'info',
        message:
          parsedBooks.length === 1
            ? `Added "${parsedBooks[0].title}" to your local library.`
            : `Imported ${parsedBooks.length} local EPUB books from your device.`,
      });
    }

    setIsImporting(false);
  }, []);

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (files.length > 0) {
      void importFiles(files);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      void importFiles(files);
    }
  }

  function handleSelectTab(tab: ActiveTab) {
    setActiveTab(tab);
    if (tab === 'library' && filter === 'starred') {
      setFilter('all');
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!isDragging) setIsDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setIsDragging(false);
      }}
      onDrop={handleDrop}
      className="min-h-screen bg-[#F7F8FA] text-slate-900 flex flex-col"
    >
      {/* Hidden native Android/Desktop local EPUB pickers */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".epub,application/epub+zip"
        multiple
        onChange={handleFileInputChange}
        className="sr-only"
        aria-label="Choose local EPUB files"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory is supported on Android Chrome & desktop browsers
        webkitdirectory=""
        onChange={handleFileInputChange}
        className="sr-only"
        aria-label="Scan local folder for EPUB files"
      />

      <TopBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onTriggerImport={() => fileInputRef.current?.click()}
        starredCount={starredBooks.length}
        kindleSentCount={kindleSentCount}
        totalCount={books.length}
      />

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-40 bg-blue-950/35 backdrop-blur-xs flex items-center justify-center p-6 pointer-events-none">
          <div className="bg-white rounded-3xl border-2 border-dashed border-blue-600 px-10 py-10 text-center shadow-xl max-w-md">
            <Upload className="w-8 h-8 text-blue-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-950">Drop .epub files here</p>
            <p className="mt-1 text-sm text-slate-600">
              Parsed privately on your device—no cloud upload required.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 md:pb-12">
        {/* Import Feedback Banner */}
        {importNotice && (
          <div
            role={importNotice.tone === 'error' ? 'alert' : 'status'}
            className={`mb-5 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
              importNotice.tone === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-blue-50 border-blue-200 text-blue-950'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {importNotice.tone === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" aria-hidden="true" />
              ) : (
                <BookOpen className="w-4 h-4 shrink-0 text-blue-700" aria-hidden="true" />
              )}
              <span className="truncate sm:whitespace-normal">{importNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setImportNotice(null)}
              aria-label="Dismiss notice"
              className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg hover:bg-black/5 shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'kindle' ? (
          <div className="max-w-4xl">
            <KindleQueueView
              books={books}
              kindleSettings={kindleSettings}
              onSaveKindleSettings={handleSaveKindleSettings}
              onOpenKindleBatch={(selected) => setKindleTargetBooks(selected)}
              onClearKindleSent={handleClearKindleSent}
              onOpenReader={(id) => handleOpenReader(id, 'read')}
            />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            {/* Primary Library / Starred Column */}
            <div className="flex-1 min-w-0">
              {/* Page Title & Starred Batch Row */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-950">
                    {activeTab === 'starred' ? 'Starred EPUBs' : 'Local EPUB Library'}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    {activeTab === 'starred'
                      ? 'Your starred favorites from skimming—ready to read or convert to Kindle.'
                      : 'Skim opening passages, star keepers in one tap, or open any book to read.'}
                  </p>
                </div>

                {activeTab === 'starred' && starredBooks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setKindleTargetBooks(starredBooks)}
                    className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Send All Starred ({starredBooks.length})</span>
                  </button>
                )}
              </div>

              {/* Search, Sort, and Mobile Folder Scan Bar */}
              <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <div className="relative flex-1">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <label htmlFor="library-search" className="sr-only">
                    Search local EPUBs by title, author, or excerpt
                  </label>
                  <input
                    id="library-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search title, author, or passage..."
                    className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="lg:hidden min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-50 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                    <span>Scan Folder</span>
                  </button>

                  <div className="relative">
                    <label htmlFor="library-sort" className="sr-only">
                      Sort books
                    </label>
                    <select
                      id="library-sort"
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortOption)}
                      className="w-full min-h-[44px] pl-3 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-200/90 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                    >
                      <option value="recent">Sort: Recent</option>
                      <option value="starred">Sort: Starred First</option>
                      <option value="title">Sort: Title A–Z</option>
                      <option value="author">Sort: Author</option>
                      <option value="length">Sort: Shortest</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Interactive Filter Bar (Library Tab Only) */}
              {activeTab === 'library' && (
                <div
                  role="tablist"
                  aria-label="Filter library"
                  className="mt-3 grid grid-cols-4 sm:inline-flex items-center gap-1 p-1 bg-slate-200/65 rounded-xl w-full sm:w-fit"
                >
                  {(
                    [
                      { id: 'all', label: `All (${books.length})` },
                      { id: 'starred', label: `Starred (${starredBooks.length})` },
                      {
                        id: 'unreviewed',
                        label: `New (${books.filter((b) => !b.isStarred && b.lastOpenedAt === null).length})`,
                      },
                      { id: 'kindle', label: `Kindle (${kindleSentCount})` },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={filter === item.id}
                      onClick={() => setFilter(item.id)}
                      className={`min-h-[38px] px-2 sm:px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer text-center ${
                        filter === item.id
                          ? 'bg-white text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Library List */}
              <div className="mt-5">
                {isLoading || isImporting ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      {isImporting ? 'Parsing local EPUB archive...' : 'Loading local library...'}
                    </p>
                  </div>
                ) : visibleBooks.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl px-6 py-12 text-center">
                    {activeTab === 'starred' || effectiveFilter === 'starred' ? (
                      <>
                        <Star className="w-7 h-7 text-slate-300 mx-auto mb-2.5" />
                        <h2 className="text-base font-semibold text-slate-900">
                          No starred EPUBs match
                        </h2>
                        <p className="mt-1 text-sm text-slate-600 max-w-sm mx-auto">
                          Tap the star button on any book in your library or while skimming in Reading Mode.
                        </p>
                        {activeTab === 'starred' && (
                          <button
                            type="button"
                            onClick={() => handleSelectTab('library')}
                            className="mt-4 min-h-[44px] px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                          >
                            Browse All EPUBs
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-7 h-7 text-slate-300 mx-auto mb-2.5" />
                        <h2 className="text-base font-semibold text-slate-900">
                          No matching EPUB files
                        </h2>
                        <p className="mt-1 text-sm text-slate-600 max-w-sm mx-auto">
                          Try clearing your search filter or import .epub files from your device storage.
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-2">
                          {query && (
                            <button
                              type="button"
                              onClick={() => setQuery('')}
                              className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                            >
                              Clear Search
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="min-h-[44px] px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors cursor-pointer"
                          >
                            Import EPUBs
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div data-testid="epub-list" className="space-y-3">
                    {visibleBooks.map((book) => (
                      <LibraryRow
                        key={book.id}
                        book={book}
                        onOpenReader={handleOpenReader}
                        onToggleStar={handleToggleStar}
                        onOpenKindle={(b) => setKindleTargetBooks([b])}
                        onDeleteBook={handleDeleteBook}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Right Rail: Starred Queue & Kindle Address */}
            <KindleSidebar
              starredBooks={starredBooks}
              kindleSettings={kindleSettings}
              onSaveKindleSettings={handleSaveKindleSettings}
              onOpenKindleBatch={(selected) => setKindleTargetBooks(selected)}
              onOpenReader={(id) => handleOpenReader(id, 'read')}
              onTriggerFolderImport={() => folderInputRef.current?.click()}
            />
          </div>
        )}
      </main>

      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        starredCount={starredBooks.length}
      />

      {/* Distraction-Free Reading & Skimming Mode */}
      {activeReaderBook && readerState && (
        <ReaderView
          book={activeReaderBook}
          initialMode={readerState.mode}
          settings={readerSettings}
          adjacentBooks={adjacentBooks}
          onUpdateSettings={handleUpdateReaderSettings}
          onClose={() => setReaderState(null)}
          onToggleStar={handleToggleStar}
          onOpenKindle={(b) => setKindleTargetBooks([b])}
          onChangeChapter={handleChangeChapter}
          onUpdateScroll={handleUpdateScroll}
          onSelectBook={(nextId, nextMode) => handleOpenReader(nextId, nextMode)}
        />
      )}

      {/* Send to Kindle Sheet / Modal */}
      {kindleTargetBooks && kindleTargetBooks.length > 0 && (
        <SendToKindleSheet
          books={kindleTargetBooks}
          kindleSettings={kindleSettings}
          onSaveKindleSettings={handleSaveKindleSettings}
          onMarkSentToKindle={handleMarkSentToKindle}
          onClose={() => setKindleTargetBooks(null)}
        />
      )}
    </div>
  );
}
