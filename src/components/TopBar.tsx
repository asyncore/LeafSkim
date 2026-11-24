import { Upload } from 'lucide-react';
import type { ActiveTab } from '../types/epub';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onTriggerImport: () => void;
  starredCount: number;
  kindleSentCount: number;
  totalCount: number;
}

export function TopBar({
  activeTab,
  onSelectTab,
  onTriggerImport,
  starredCount,
  kindleSentCount,
  totalCount,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 h-[52px] md:h-16 bg-white/92 backdrop-blur-md border-b border-slate-200/90">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('library')}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md px-1 -ml-1 min-h-[44px] flex items-center"
        >
          LeafSkim
        </button>

        {/* Zone 2: Clean single-line text navigation links (desktop) */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          <button
            type="button"
            onClick={() => onSelectTab('library')}
            aria-current={activeTab === 'library' ? 'page' : undefined}
            className={`relative py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm ${
              activeTab === 'library'
                ? 'text-slate-950 font-semibold'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <span>Library</span>{' '}
            <span className="ml-1.5 font-mono text-xs tabular-nums text-slate-400">
              {totalCount}
            </span>
            {activeTab === 'library' && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-full"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('starred')}
            aria-current={activeTab === 'starred' ? 'page' : undefined}
            className={`relative py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm ${
              activeTab === 'starred'
                ? 'text-slate-950 font-semibold'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <span>Starred</span>{' '}
            <span className="ml-1.5 font-mono text-xs tabular-nums text-amber-600">
              {starredCount}
            </span>
            {activeTab === 'starred' && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-full"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('kindle')}
            aria-current={activeTab === 'kindle' ? 'page' : undefined}
            className={`relative py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm ${
              activeTab === 'kindle'
                ? 'text-slate-950 font-semibold'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <span>Kindle Queue</span>{' '}
            <span className="ml-1.5 font-mono text-xs tabular-nums text-slate-400">
              {kindleSentCount}
            </span>
            {activeTab === 'kindle' && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-full"
              />
            )}
          </button>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onTriggerImport}
            className="inline-flex items-center gap-2 min-h-[40px] md:min-h-[44px] px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-700 rounded-xl hover:bg-blue-800 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Import EPUBs</span>
          </button>
        </div>
      </div>
    </header>
  );
}
