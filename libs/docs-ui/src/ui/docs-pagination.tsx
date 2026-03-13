import { Link } from "@tanstack/react-router";

export interface FlatPage {
  label: string;
  to: string;
}

interface DocsPaginationProps {
  prev: FlatPage | null;
  next: FlatPage | null;
}

export function DocsPagination({ prev, next }: DocsPaginationProps) {
  if (!prev && !next) return null;

  return (
    <nav className="mt-16 flex items-center justify-between border-t border-white/5 pt-8 gap-4">
      {prev ? (
        <Link
          to={prev.to}
          className="group flex flex-col items-start rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 text-sm transition hover:border-white/10 hover:bg-white/[0.04] no-underline min-w-0"
        >
          <span className="text-xs text-slate-500 mb-1">&larr; Previous</span>
          <span className="font-medium text-slate-300 group-hover:text-cyan-400 truncate">
            {prev.label}
          </span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={next.to}
          className="group flex flex-col items-end rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 text-sm transition hover:border-white/10 hover:bg-white/[0.04] no-underline min-w-0 ml-auto"
        >
          <span className="text-xs text-slate-500 mb-1">Next &rarr;</span>
          <span className="font-medium text-slate-300 group-hover:text-cyan-400 truncate">
            {next.label}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
