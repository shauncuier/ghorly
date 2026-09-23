import { cn } from "@/lib/cn";
import { formatBdt, formatCompact, toBn } from "@/lib/format";
import type { SeriesPoint } from "@/lib/types";

/**
 * Hand-rolled SVG charts.
 *
 * Recharts would work, but every tick, tooltip and legend in this product has
 * to read `৳১২.৫ লাখ` — so you end up writing custom formatters and custom
 * `content` renderers for all of it anyway, through an awkward indirection,
 * and `ResponsiveContainer` measures 0×0 during SSR on top of that.
 *
 * These render as a fixed `viewBox` with `width="100%"`, so they scale
 * responsively with zero JS measurement and zero hydration risk — and they can
 * stay server components. Each carries `role="img"` with a Bangla label plus a
 * visually-hidden data table, so the numbers are reachable without the picture.
 */

const W = 720;
const H = 260;
const PAD = { top: 16, right: 12, bottom: 30, left: 52 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

/** Round a maximum up to a clean number so gridlines land on readable values. */
function niceMax(max: number): number {
  if (max <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(max));
  const norm = max / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

function gridLines(max: number, count = 4) {
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i);
}

function ChartShell({
  label,
  children,
  data,
  valueFormatter,
  className,
}: {
  label: string;
  children: React.ReactNode;
  data: { label: string; value: number }[];
  valueFormatter: (n: number) => string;
  className?: string;
}) {
  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={label}
        className="overflow-visible"
      >
        {children}
      </svg>

      {/* The same numbers, reachable without seeing the chart. */}
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{valueFormatter(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Grid({ max, format }: { max: number; format: (n: number) => string }) {
  return (
    <g aria-hidden="true">
      {gridLines(max).map((v, i) => {
        const y = PAD.top + PLOT_H - (v / max) * PLOT_H;
        return (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y}
              y2={y}
              stroke="var(--border-subtle)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 10}
              y={y + 4}
              textAnchor="end"
              className="fill-[var(--text-tertiary)] text-[11px]"
            >
              {format(v)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function XLabels({ points }: { points: { label: string }[] }) {
  const band = PLOT_W / points.length;
  // Every other label below ~8 points, so Bangla month names don't collide.
  const stride = points.length > 8 ? 2 : 1;
  return (
    <g aria-hidden="true">
      {points.map((p, i) =>
        i % stride === 0 ? (
          <text
            key={p.label + i}
            x={PAD.left + band * i + band / 2}
            y={H - 8}
            textAnchor="middle"
            className="fill-[var(--text-tertiary)] text-[11px]"
          >
            {p.label}
          </text>
        ) : null,
      )}
    </g>
  );
}

/* ==========================================================================
   Area — revenue over time
   ========================================================================== */

export function AreaChart({
  data,
  label,
  className,
}: {
  data: SeriesPoint[];
  label: string;
  className?: string;
}) {
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const band = PLOT_W / data.length;

  const points = data.map((d, i) => ({
    x: PAD.left + band * i + band / 2,
    y: PAD.top + PLOT_H - (d.value / max) * PLOT_H,
  }));

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x} ${PAD.top + PLOT_H} L${points[0].x} ${PAD.top + PLOT_H} Z`;

  return (
    <ChartShell
      label={label}
      data={data}
      valueFormatter={(n) => formatBdt(n, { compact: true })}
      className={className}
    >
      <Grid max={max} format={(v) => formatCompact(v)} />
      {/* Flat tint rather than a gradient — one accent, restrained. */}
      <path d={area} fill="var(--teal-500)" fillOpacity={0.1} />
      <path
        d={line}
        fill="none"
        stroke="var(--teal-600)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="var(--teal-600)" />
      ))}
      <XLabels points={data} />
    </ChartShell>
  );
}

/* ==========================================================================
   Bar — bookings per month
   ========================================================================== */

export function BarChart({
  data,
  label,
  className,
}: {
  data: SeriesPoint[];
  label: string;
  className?: string;
}) {
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const band = PLOT_W / data.length;
  const barW = Math.min(band * 0.55, 30);

  return (
    <ChartShell
      label={label}
      data={data}
      valueFormatter={(n) => toBn(n)}
      className={className}
    >
      <Grid max={max} format={(v) => toBn(Math.round(v))} />
      {data.map((d, i) => {
        const h = (d.value / max) * PLOT_H;
        const x = PAD.left + band * i + (band - barW) / 2;
        const y = PAD.top + PLOT_H - h;
        const last = i === data.length - 1;
        return (
          <rect
            key={d.label + i}
            x={x}
            y={y}
            width={barW}
            height={Math.max(h, 1)}
            rx={4}
            fill={last ? "var(--teal-600)" : "var(--teal-200)"}
          />
        );
      })}
      <XLabels points={data} />
    </ChartShell>
  );
}

/* ==========================================================================
   Line — two series, user growth
   ========================================================================== */

export function LineChart({
  data,
  label,
  seriesLabels,
  className,
}: {
  data: { label: string; customers: number; providers: number }[];
  label: string;
  seriesLabels: [string, string];
  className?: string;
}) {
  const max = niceMax(Math.max(...data.flatMap((d) => [d.customers, d.providers])));
  const band = PLOT_W / data.length;

  function path(key: "customers" | "providers") {
    return data
      .map((d, i) => {
        const x = PAD.left + band * i + band / 2;
        const y = PAD.top + PLOT_H - (d[key] / max) * PLOT_H;
        return `${i === 0 ? "M" : "L"}${x} ${y}`;
      })
      .join(" ");
  }

  return (
    <div className={className}>
      <div className="mb-3 flex items-center gap-5">
        {[
          { name: seriesLabels[0], color: "var(--teal-600)" },
          { name: seriesLabels[1], color: "var(--ink-400)" },
        ].map((s) => (
          <span key={s.name} className="flex items-center gap-2 text-xs text-fg-secondary">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full"
              style={{ background: s.color }}
            />
            {s.name}
          </span>
        ))}
      </div>

      <ChartShell
        label={label}
        data={data.map((d) => ({ label: d.label, value: d.customers }))}
        valueFormatter={(n) => toBn(n)}
      >
        <Grid max={max} format={(v) => toBn(Math.round(v))} />
        <path
          d={path("customers")}
          fill="none"
          stroke="var(--teal-600)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={path("providers")}
          fill="none"
          stroke="var(--ink-400)"
          strokeWidth={2}
          strokeDasharray="4 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <XLabels points={data} />
      </ChartShell>
    </div>
  );
}

/* ==========================================================================
   Donut — bookings by category
   ========================================================================== */

/** Six desaturated ink/teal steps — deliberately not six different hues. */
const DONUT_COLORS = [
  "var(--teal-600)",
  "var(--teal-400)",
  "var(--teal-200)",
  "var(--ink-400)",
  "var(--ink-300)",
  "var(--ink-200)",
];

export function DonutChart({
  data,
  label,
  className,
}: {
  data: SeriesPoint[];
  label: string;
  className?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 70;
  const STROKE = 22;
  const C = 2 * Math.PI * R;

  // Arc lengths and their cumulative offsets, computed before render rather
  // than accumulated inside the map — mutating during render is a real bug
  // under the React Compiler, not just a lint preference.
  const segments = data.reduce<{ label: string; len: number; offset: number }[]>(
    (acc, d) => {
      const prev = acc[acc.length - 1];
      const offset = prev ? prev.offset + prev.len : 0;
      acc.push({ label: d.label, len: (d.value / total) * C, offset });
      return acc;
    },
    [],
  );

  return (
    <div className={cn("flex flex-col items-center gap-5 sm:flex-row", className)}>
      <svg
        viewBox="0 0 180 180"
        width={180}
        height={180}
        role="img"
        aria-label={label}
        className="shrink-0"
      >
        <g transform="rotate(-90 90 90)">
          {segments.map((s, i) => (
            <circle
              key={s.label}
              cx={90}
              cy={90}
              r={R}
              fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth={STROKE}
              strokeDasharray={`${s.len} ${C - s.len}`}
              strokeDashoffset={-s.offset}
            />
          ))}
        </g>
        <text
          x={90}
          y={86}
          textAnchor="middle"
          className="fill-[var(--text-primary)] text-[22px] font-extrabold"
        >
          {formatCompact(total)}
        </text>
        <text
          x={90}
          y={104}
          textAnchor="middle"
          className="fill-[var(--text-tertiary)] text-[11px]"
        >
          মোট কাজ
        </text>
      </svg>

      <ul className="flex w-full flex-col gap-2">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="min-w-0 flex-1 truncate-bn text-fg-secondary">{d.label}</span>
            <span className="shrink-0 font-medium tabular text-fg">{toBn(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ==========================================================================
   Sparkline — inline in stat cards
   ========================================================================== */

export function Sparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 64;
  const h = 20;

  const d = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      aria-hidden="true"
      className={cn("overflow-visible", className)}
    >
      <path
        d={d}
        fill="none"
        stroke="var(--teal-600)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
