import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FutureGoal } from "../../types/future";

interface AssetChartProps {
  series: number[]; // series[0] = 시작 월 자산, series[i] = i개월 뒤 자산(만원)
  startMonth: string; // YYYY-MM
  goal?: FutureGoal;
  height?: number;
  /** 지금 보고 있는 선의 이름 (범례용, 예: "V2 월 50만원"). 비교선이 있을 때만 범례가 보여요 */
  seriesName?: string;
  /** [CHT-08] 비교용 기존 플랜(V1) 선. 연한 색으로 같이 그림. V1을 보고 있으면 안 넘겨요 */
  baseSeries?: number[];
  /** [RES-11] 슬라이더를 움직이는 동안의 미리보기 선 (점선) */
  previewSeries?: number[];
}

function addMonths(yyyyMm: string, add: number): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(y, m - 1 + add);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const LINE_NAMES = { amount: "총자산", base: "V1 기존 플랜", preview: "미리보기" } as const;

// C 결과 화면의 핵심 그래프: 총자산 라인 + (있으면) 목표선 점선
// + 비교선(V1, 연한 선) + 슬라이더 미리보기(점선)
// recharts는 이미 package.json에 설치돼 있어서 바로 사용 가능.
export function AssetChart({
  series,
  startMonth,
  goal,
  height = 280,
  seriesName,
  baseSeries,
  previewSeries,
}: AssetChartProps) {
  // 선마다 길이가 다를 수 있어서(기간이 다른 버전) 가장 긴 길이에 맞춰 달을 만들어요
  const length = Math.max(series.length, baseSeries?.length ?? 0, previewSeries?.length ?? 0);
  const data = Array.from({ length }, (_, i) => ({
    month: addMonths(startMonth, i),
    amount: series[i],
    base: baseSeries?.[i],
    preview: previewSeries?.[i],
  }));
  const names = { ...LINE_NAMES, amount: seriesName ?? LINE_NAMES.amount };
  const showLegend = Boolean(baseSeries || previewSeries);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip
          formatter={(value, key) => [
            `${Number(value).toLocaleString()}만원`,
            names[key as keyof typeof names] ?? String(key),
          ]}
        />
        {showLegend && (
          <Legend formatter={(key) => names[key as keyof typeof names] ?? String(key)} />
        )}
        {goal && (
          <ReferenceLine
            y={goal.amount}
            stroke="#2b5bd7"
            strokeDasharray="4 4"
            label={{ value: `${goal.name} ${goal.amount.toLocaleString()}`, position: "insideTopLeft" }}
          />
        )}
        {baseSeries && (
          <Line type="monotone" dataKey="base" stroke="#b8bcc8" strokeWidth={2} dot={false} isAnimationActive={false} />
        )}
        <Line type="monotone" dataKey="amount" stroke="#13294b" strokeWidth={2} dot={{ r: 3 }} />
        {previewSeries && (
          <Line
            type="monotone"
            dataKey="preview"
            stroke="#13294b"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            isAnimationActive={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
