import { Link } from "react-router-dom";

export default function EmptyState({
  title = "Belum ada data di arsip",
  description = "Belum ada entri yang tersimpan di dalam katalog.",
  actionLabel,
  actionTo,
  onAction,
  secondaryLabel,
  onSecondaryAction,
}) {
  return (
    <div className="border-y border-[#D5CFC2] py-6 my-2 text-left">
      <h3 className="font-serif text-lg font-bold text-[#161615] tracking-tight">
        {title}
      </h3>
      <p className="mt-1 max-w-xl text-sm text-[#57534E] leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryLabel) && (
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {actionLabel && actionTo && (
            <Link
              to={actionTo}
              className="inline-flex items-center gap-2 rounded-[2px] bg-[#991B1B] hover:bg-[#7F1D1D] px-4 py-2 text-sm font-medium text-[#F4F1EA] transition-colors"
            >
              {actionLabel}
            </Link>
          )}
          {actionLabel && !actionTo && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-[2px] bg-[#991B1B] hover:bg-[#7F1D1D] px-4 py-2 text-sm font-medium text-[#F4F1EA] transition-colors cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-2 rounded-[2px] border border-[#D5CFC2] bg-[#EFECE4] hover:border-[#161615] px-4 py-2 text-sm font-medium text-[#161615] transition-colors cursor-pointer"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
