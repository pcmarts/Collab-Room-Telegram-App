import { cn } from "@/lib/utils";

type StatTone = "default" | "brand" | "success" | "warm" | "muted";

interface Stat {
  value: number | string;
  label: string;
  tone?: StatTone;
  delta?: string;
}

interface AdminStatStripProps {
  stats: Stat[];
  className?: string;
}

const VALUE_TONE: Record<StatTone, string> = {
  default: "text-text",
  brand: "text-brand",
  success: "text-success",
  warm: "text-warm-accent",
  muted: "text-text-subtle",
};

/**
 * AdminStatStrip — horizontal strip of big numbers with small labels.
 * Tabular numerals (reinforces the operations-console feel). No cards.
 */
export function AdminStatStrip({ stats, className }: AdminStatStripProps) {
  return (
    <dl
      className={cn(
        "grid grid-cols-3 gap-px overflow-hidden rounded-md border border-hairline bg-hairline",
        className,
      )}
    >
      {stats.map((stat, i) => (
        <div
          key={`${stat.label}-${i}`}
          className="flex flex-col gap-0.5 bg-background px-4 py-3"
        >
          <dd
            className={cn(
              "font-mono text-2xl font-semibold leading-none tabular tracking-tight",
              VALUE_TONE[stat.tone ?? "default"],
            )}
          >
            {stat.value}
          </dd>
          <dt className="mt-1 text-xs uppercase tracking-[0.12em] text-text-subtle">
            {stat.label}
          </dt>
          {stat.delta ? (
            <span className="text-xs tabular text-text-subtle">{stat.delta}</span>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
