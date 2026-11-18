import { simulate } from "../lib/simulate";
import type { Future, ScenarioCondition } from "../types/future";

// W03 목록에 보이는 예시 상황 3개 (기능명세서 예시 값과 동일).
// series/summary는 직접 적지 않고 계산 엔진으로 만들어서, 화면 숫자가 항상 엔진과 일치하게 함.
// 백엔드 API가 준비되면 src/api/futures.ts 안쪽만 실제 fetch로 바꾸면 됨.

const baseEvents = [
  { id: "e1", name: "성과급", type: "income" as const, amount: 100, month: "2027-02", repeat: "once" as const },
  { id: "e2", name: "노트북 구입", type: "expense" as const, amount: 150, month: "2027-05", repeat: "once" as const },
];

function make(
  meta: Pick<Future, "id" | "updatedAt"> & Partial<Pick<Future, "originScenarioId">>,
  condition: ScenarioCondition,
): Future {
  const { series, summary } = simulate(condition);
  return { ...meta, ...condition, series, summary, sparkline: series, version: 1 };
}

export const mockFutures: Future[] = [
  make(
    { id: "future-1", updatedAt: "2026-11-05T21:10:00+09:00" },
    {
      name: "상황 1 · 지금처럼",
      startMonth: "2026-11",
      periodMonths: 12,
      currentAsset: 500,
      monthlySaving: 40,
      events: baseEvents,
      goal: { name: "유럽 여행", amount: 1000, deadline: "2027-11" },
    },
  ),
  make(
    { id: "future-2", updatedAt: "2026-11-05T21:18:00+09:00", originScenarioId: "future-1" },
    {
      name: "상황 2 · 월 10만원 더",
      startMonth: "2026-11",
      periodMonths: 12,
      currentAsset: 500,
      monthlySaving: 50,
      events: baseEvents,
      goal: { name: "유럽 여행", amount: 1000, deadline: "2027-11" },
    },
  ),
  make(
    { id: "future-3", updatedAt: "2026-11-04T18:02:00+09:00" },
    {
      name: "상황 3 · 3년 길게 보기",
      startMonth: "2026-11",
      periodMonths: 36,
      currentAsset: 500,
      monthlySaving: 40,
      events: baseEvents,
    },
  ),
];
