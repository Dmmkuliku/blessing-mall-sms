import { formatTZS } from "@/lib/format";

type MoneyProps = {
  amount: number | null | undefined;
  className?: string;
};

export function Money({ amount, className = "" }: MoneyProps) {
  return (
    <span className={`tabular-nums tracking-tight ${className}`}>
      {formatTZS(amount)}
    </span>
  );
}
