type LowStockBadgeProps = {
  stockQty: number;
  reorderLevel: number;
  className?: string;
};

export function LowStockBadge({
  stockQty,
  reorderLevel,
  className = "",
}: LowStockBadgeProps) {
  const low = stockQty <= reorderLevel;
  const critical = stockQty <= Math.max(1, reorderLevel * 0.35);

  if (!low) {
    return (
      <span
        className={`inline-flex rounded-md bg-mint px-2 py-0.5 text-xs font-medium text-forest ${className}`}
      >
        In stock
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
        critical
          ? "bg-red-50 text-danger"
          : "bg-amber-50 text-warning"
      } ${className}`}
    >
      {critical ? "Reorder urgently" : "Reorder soon"}
    </span>
  );
}
