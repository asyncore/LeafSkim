import { BookOpen, Send, Star } from 'lucide-react';
import type { ActiveTab } from '../types/epub';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  starredCount: number;
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  starredCount,
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
    >
      <div className="grid grid-cols-3 h-[58px]">
        <button
          type="button"
          onClick={() => onSelectTab('library')}
          aria-current={activeTab === 'library' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'library' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-5 h-5" strokeWidth={activeTab === 'library' ? 2.4 : 1.9} />
          <span className="text-[11px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
            Library
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('starred')}
          aria-current={activeTab === 'starred' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'starred' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Star
            className={`w-5 h-5 ${
              activeTab === 'starred' ? 'fill-amber-500 text-amber-600' : ''
            }`}
            strokeWidth={activeTab === 'starred' ? 2.4 : 1.9}
          />
          <span className="text-[11px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
            Starred ({starredCount})
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('kindle')}
          aria-current={activeTab === 'kindle' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'kindle' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Send className="w-5 h-5" strokeWidth={activeTab === 'kindle' ? 2.4 : 1.9} />
          <span className="text-[11px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
            Kindle
          </span>
        </button>
      </div>
    </nav>
  );
}
