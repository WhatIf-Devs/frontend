import {
  CartesianGrid,
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
  series: number[]; // startMonth부터 1개월 단위 예상 자산(만원)
  startMonth: string; // YYYY-MM
  goal?: FutureGoal;
  height?: number;
}

function addMonths(yyyyMm: string, add: number): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(y, m - 1 + add);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// C 결과 화면의 핵심 그래프: 총자산 라인 + (있으면) 목표선 점선
// recharts는 이미 package.json에 설치돼 있어서 바로 사용 가능.
export function AssetChart({ series, startMonth, goal, height = 280 }: AssetChartProps) {
  const data = series.map((amount, i) => ({
    month: addMonths(startMonth, i + 1),
    amount,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip
          formatter={(value) => [`${Number(value).toLocaleString()}만원`, "총자산"]}
        />
        {goal && (
          <ReferenceLine
            y={goal.amount}
            stroke="#2b5bd7"
            strokeDasharray="4 4"
            label={{ value: `${goal.name} ${goal.amount.toLocaleString()}`, position: "insideTopLeft" }}
          />
        )}
        <Line type="monotone" dataKey="amount" stroke="#13294b" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
