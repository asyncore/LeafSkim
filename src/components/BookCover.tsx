import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  title: string;
  author: string;
  coverUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<NonNullable<BookCoverProps['size']>, string> = {
  sm: 'w-11 h-[60px] rounded-md',
  md: 'w-14 h-[76px] sm:w-16 sm:h-[86px] rounded-lg',
  lg: 'w-20 h-[108px] rounded-xl',
};

export function BookCover({ title, author, coverUrl, size = 'md' }: BookCoverProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  if (coverUrl && !imgFailed) {
    return (
      <div
        className={`${SIZE_CLASSES[size]} relative shrink-0 overflow-hidden bg-slate-200 border border-slate-200/80 shadow-xs`}
      >
        <img
          src={coverUrl}
          alt={`Cover of ${title} by ${author}`}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${SIZE_CLASSES[size]} relative shrink-0 overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-blue-900 border border-slate-300/60 flex flex-col items-center justify-center p-1.5 text-center text-white select-none`}
      aria-hidden="true"
    >
      <BookOpen className="w-3.5 h-3.5 text-slate-300 mb-1 shrink-0" />
      <span className="font-serif text-xs font-semibold leading-tight tracking-tight">
        {initials || 'EP'}
      </span>
    </div>
  );
}
