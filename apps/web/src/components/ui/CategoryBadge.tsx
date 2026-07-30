import {
  getTransactionCategoryColor,
  getTransactionCategoryLabel,
} from "../../lib/transactionCategories";

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export function CategoryBadge({ category, className = "" }: CategoryBadgeProps) {
  const color = getTransactionCategoryColor(category);
  const label = getTransactionCategoryLabel(category);

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-medium ${className}`}
      style={{ color }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
