import type { Future, FutureEvent, FutureGoal } from "../types/future";
import type { ApiEnvelope } from "../types/api";
import { ApiError } from "../types/api";
import { mockFutures } from "../mocks/futures";

// 백엔드 API 명세(API 명세서, 15개 엔드포인트, 전부 "시작 전") 기준 실제 경로/형식.
// USE_MOCK=false로 바꾸면 이 파일 안쪽만 고치면 되고, 페이지/컴포넌트는 그대로 둘 수 있음.

const USE_MOCK = true;
const BASE_URL = "/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !body.isSuccess) {
    throw new ApiError(body.code, body.message);
  }
  return body.result as T;
}

function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

/** 05. 상황 목록 조회 — GET /api/v1/scenarios */
export async function fetchFutures(): Promise<Future[]> {
  if (USE_MOCK) return Promise.resolve(mockFutures);
  return request<Future[]>("/scenarios");
}

/** 07. 상황 열기 — GET /api/v1/scenarios/{scenarioId} (열 때마다 series/summary 재계산됨) */
export async function fetchFutureById(id: string): Promise<Future | undefined> {
  if (USE_MOCK) return Promise.resolve(mockFutures.find((f) => f.id === id));
  return request<Future>(`/scenarios/${id}`);
}

export interface CreateFutureInput {
  name: string;
  memo?: string;
  startMonth: string;
  periodMonths: number;
  currentAsset: number;
  monthlySaving: number;
  events: FutureEvent[];
  goal?: FutureGoal;
}

/** 06. 새 상황으로 저장 — POST /api/v1/scenarios (id는 프론트에서 생성, Idempotency-Key로 중복 저장 방지) */
export async function createFuture(input: CreateFutureInput): Promise<Future> {
  const id = crypto.randomUUID();
  if (USE_MOCK) {
    const series = buildMockSeries(input);
    const newFuture: Future = {
      id,
      ...input,
      series,
      summary: input.goal
        ? {
            shortfall: input.goal.amount - series[series.length - 1],
            achievementRate: Math.round((series[series.length - 1] / input.goal.amount) * 100),
          }
        : {},
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    return Promise.resolve(newFuture);
  }
  return request<Future>("/scenarios", {
    method: "POST",
    headers: { "Idempotency-Key": newIdempotencyKey() },
    body: JSON.stringify({ id, ...input }),
  });
}

/** 08. 기존 상황에 덮어쓰기 — PUT /api/v1/scenarios/{scenarioId} (version 불일치면 409) */
export async function overwriteFuture(
  id: string,
  input: CreateFutureInput,
  version: number
): Promise<Future> {
  if (USE_MOCK) {
    throw new Error("mock 모드에서는 덮어쓰기를 지원하지 않음");
  }
  return request<Future>(`/scenarios/${id}`, {
    method: "PUT",
    headers: { "Idempotency-Key": newIdempotencyKey() },
    body: JSON.stringify({ ...input, version }),
  });
}

/** 09. 상황 이름·메모 변경 — PATCH /api/v1/scenarios/{scenarioId} (이름변경/삭제 UI는 PM 확인 전까지 미정) */
export async function renameFuture(id: string, name: string, memo?: string): Promise<Future> {
  if (USE_MOCK) {
    throw new Error("mock 모드에서는 이름 변경을 지원하지 않음");
  }
  return request<Future>(`/scenarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name, memo }),
  });
}

/** 10. 상황 삭제 — DELETE /api/v1/scenarios/{scenarioId} */
export async function deleteFuture(id: string): Promise<void> {
  if (USE_MOCK) {
    throw new Error("mock 모드에서는 삭제를 지원하지 않음");
  }
  await request<void>(`/scenarios/${id}`, { method: "DELETE" });
}

function buildMockSeries(input: CreateFutureInput): number[] {
  const { currentAsset, monthlySaving, periodMonths, startMonth, events } = input;
  const series: number[] = [];
  let amount = currentAsset;
  for (let i = 0; i < periodMonths; i++) {
    amount += monthlySaving;
    const month = addMonths(startMonth, i + 1);
    const eventsThisMonth = events.filter((e) => e.month === month);
    for (const ev of eventsThisMonth) {
      amount += ev.type === "income" ? ev.amount : -ev.amount;
    }
    series.push(amount);
  }
  return series;
}

function addMonths(yyyyMm: string, add: number): string {
  if (!yyyyMm) return yyyyMm;
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(y, m - 1 + add);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
