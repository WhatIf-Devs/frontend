import type { Future } from "../types/future";

// W03 목록 화면에 보이던 3개 상황을 실제 scenarios 테이블 구조(평평한 필드)로 옮겨둔 것.
// 백엔드 API가 준비되면 src/api/futures.ts 내부 구현만 실제 fetch로 바꾸면 됨.
export const mockFutures: Future[] = [
  {
    id: "future-1",
    name: "상황 1 · 지금처럼",
    startMonth: "2026-11",
    periodMonths: 12,
    currentAsset: 500,
    monthlySaving: 40,
    events: [
      { id: "e1", name: "성과급", type: "income", amount: 100, month: "2027-02" },
      { id: "e2", name: "노트북 구입", type: "expense", amount: 150, month: "2027-05" },
    ],
    goal: { name: "유럽 여행", amount: 1000, deadline: "2027-11" },
    series: [540, 580, 720, 760, 650, 690, 730, 770, 810, 850, 890, 930],
    summary: { shortfall: 70, achievementRate: 93, extraSavingNeeded: 5.8 },
    sparkline: [500, 700, 650, 800, 930],
    version: 3,
    updatedAt: "2026-11-05T21:10:00+09:00",
  },
  {
    id: "future-2",
    name: "상황 2 · 월 10만원 더",
    startMonth: "2026-11",
    periodMonths: 12,
    currentAsset: 500,
    monthlySaving: 50,
    events: [
      { id: "e1", name: "성과급", type: "income", amount: 100, month: "2027-02" },
      { id: "e2", name: "노트북 구입", type: "expense", amount: 150, month: "2027-05" },
    ],
    goal: { name: "유럽 여행", amount: 1000, deadline: "2027-11" },
    series: [550, 600, 750, 800, 680, 730, 780, 830, 880, 930, 980, 1050],
    summary: { shortfall: -50, achievementRate: 100 },
    sparkline: [500, 720, 680, 880, 1050],
    version: 1,
    updatedAt: "2026-11-05T21:18:00+09:00",
  },
  {
    id: "future-3",
    name: "상황 3 · 3년 길게 보기",
    startMonth: "2026-11",
    periodMonths: 36,
    currentAsset: 500,
    monthlySaving: 40,
    events: [
      { id: "e1", name: "성과급", type: "income", amount: 100, month: "2027-02" },
      { id: "e2", name: "노트북 구입", type: "expense", amount: 150, month: "2027-05" },
    ],
    series: Array.from({ length: 36 }, (_, i) => 500 + i * 40 + (i >= 2 ? 100 : 0) - (i >= 5 ? 150 : 0)),
    summary: {},
    sparkline: [500, 930, 1390, 1890],
    version: 1,
    updatedAt: "2026-11-04T18:02:00+09:00",
  },
];
