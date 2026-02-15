import { useMemo, useId } from "react";
import { motion } from "motion/react";

// ── Sparkline Data Generator ─────────────────────────────────────────
export function generateSparklineData(
  points: number,
  trend: "up" | "down" | "stable",
): number[] {
  const data: number[] = [];
  let value = 50 + Math.random() * 20;
  const drift =
    trend === "up" ? 2.5 : trend === "down" ? -2.5 : 0;

  for (let i = 0; i < points; i++) {
    value += drift + (Math.random() - 0.5) * 8;
    value = Math.max(5, Math.min(95, value));
    data.push(value);
  }
  return data;
}

// ── Monotone cubic interpolation (Fritsch–Carlson) ───────────────────
function monotonePath(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M${pts[0][0]},${pts[0][1]}L${pts[1][0]},${pts[1][1]}`;

  const n = pts.length;
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    dy.push(pts[i + 1][1] - pts[i][1]);
    m.push(dy[i] / dx[i]);
  }

  const alpha: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      alpha.push(0);
    } else {
      alpha.push(3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]));
    }
  }
  alpha.push(m[n - 2]);

  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const third = dx[i] / 3;
    d += `C${pts[i][0] + third},${pts[i][1] + alpha[i] * third},${pts[i + 1][0] - third},${pts[i + 1][1] - alpha[i + 1] * third},${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

// ── Trend Arrow ──────────────────────────────────────────────────────
function TrendArrow({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const first = data.slice(0, Math.ceil(data.length / 3));
  const last = data.slice(-Math.ceil(data.length / 3));
  const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
  const avgLast = last.reduce((a, b) => a + b, 0) / last.length;
  const pct = ((avgLast - avgFirst) / avgFirst) * 100;

  if (Math.abs(pct) < 2) return null;

  const up = pct > 0;
  return (
    <span
      className={`text-[10px] font-semibold leading-none ${up ? "text-emerald-500" : "text-rose-500"}`}
    >
      {up ? "↑" : "↓"}
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────────────
export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDot?: boolean;
  showArea?: boolean;
  showTrend?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 60,
  height = 20,
  color = "#06b6d4",
  showDot = true,
  showArea = false,
  showTrend = false,
  className,
}: SparklineProps) {
  const uid = useId();
  const gradientId = `spark-grad-${uid}`;

  const { linePath, areaPath, lastPoint } = useMemo(() => {
    if (data.length < 2) return { linePath: "", areaPath: "", lastPoint: null };

    const pad = 2;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const pts: [number, number][] = data.map((v, i) => [
      pad + (i / (data.length - 1)) * w,
      pad + h - ((v - min) / range) * h,
    ]);

    const lp = monotonePath(pts);
    const last = pts[pts.length - 1];
    const ap = lp + `L${last[0]},${height}L${pts[0][0]},${height}Z`;

    return { linePath: lp, areaPath: ap, lastPoint: { x: last[0], y: last[1] } };
  }, [data, width, height]);

  if (data.length < 2) return null;

  return (
    <span className={`inline-flex items-center gap-0.5 ${className ?? ""}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        className="shrink-0"
      >
        {showArea && (
          <>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradientId})`} />
          </>
        )}
        <motion.path
          d={linePath}
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {showDot && lastPoint && (
          <motion.circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={2}
            fill={color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 400 }}
          />
        )}
      </svg>
      {showTrend && <TrendArrow data={data} />}
    </span>
  );
}
