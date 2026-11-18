import { simulate } from "../lib/simulate";
import type { Future, ScenarioCondition } from "../types/future";
import type { SaveTarget, ScenarioVersion, WorkingScenario } from "../types/version";

const KEY = "whatif:working-scenario";
export const MAX_VERSIONS = 10;

function write(w: WorkingScenario | null) {
  try {
    if (w) sessionStorage.setItem(KEY, JSON.stringify(w));
    else sessionStorage.removeItem(KEY);
  } catch {
    // sessionStorage를 못 쓰는 환경이면 새로고침 시 사라지는 것만 감수
  }
}

/** 지금 보고 있는 상황 읽기 (없으면 null) */
export function loadWorking(): WorkingScenario | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WorkingScenario) : null;
  } catch {
    return null;
  }
}

/** 새 조건으로 결과 화면 시작 (입력 완료 or 저장된 상황 열기). V1만 있는 상태로 초기화 */
export function startWorking(
  condition: ScenarioCondition,
  base?: { id: string; name: string },
): WorkingScenario {
  const v1: ScenarioVersion = { no: 1, title: "기존 플랜", condition, result: simulate(condition) };
  const w: WorkingScenario = {
    baseScenarioId: base?.id,
    baseScenarioName: base?.name,
    versions: [v1],
    viewingNo: 1,
  };
  write(w);
  return w;
}

/** 저장된 상황(Future)에서 계산 조건만 꺼내기 */
export function toCondition(f: Future): ScenarioCondition {
  return {
    name: f.name,
    startMonth: f.startMonth,
    periodMonths: f.periodMonths,
    currentAsset: f.currentAsset,
    monthlySaving: f.monthlySaving,
    events: f.events,
    goal: f.goal,
    goalVisible: f.goalVisible,
  };
}

export function getViewingVersion(w: WorkingScenario): ScenarioVersion {
  return w.versions.find((v) => v.no === w.viewingNo) ?? w.versions[0];
}

/** 보고 있는 버전 바꾸기 ('그래프 확인하기', CHT-08) */
export function setViewing(w: WorkingScenario, no: number): WorkingScenario {
  const next = { ...w, viewingNo: no };
  write(next);
  return next;
}

/** 새 버전 추가 (AI 질문으로 조건이 바뀐 경우). 10개면 null */
export function addVersion(
  w: WorkingScenario,
  title: string,
  condition: ScenarioCondition,
  question?: string,
): WorkingScenario | null {
  if (w.versions.length >= MAX_VERSIONS) return null;
  const no = Math.max(...w.versions.map((v) => v.no)) + 1;
  const version: ScenarioVersion = { no, title, question, condition, result: simulate(condition) };
  const next = { ...w, versions: [...w.versions, version], viewingNo: no };
  write(next);
  return next;
}

/** 보고 있는 버전의 조건 일부만 바꾸기 (예: 목표 표시 토글). 버전은 새로 만들지 않음 */
export function updateViewingCondition(
  w: WorkingScenario,
  patch: Partial<ScenarioCondition>,
): WorkingScenario {
  const versions = w.versions.map((v) => {
    if (v.no !== w.viewingNo) return v;
    const condition = { ...v.condition, ...patch };
    return { ...v, condition, result: simulate(condition) };
  });
  const next = { ...w, versions };
  write(next);
  return next;
}

/** W10 저장 화면이 읽는 값 */
export function getSaveTarget(): SaveTarget | null {
  const w = loadWorking();
  if (!w) return null;
  return {
    version: getViewingVersion(w),
    baseVersion: w.versions[0],
    baseScenarioId: w.baseScenarioId,
    baseScenarioName: w.baseScenarioName,
  };
}

/** 저장이 끝나면 임시 버전은 버림 (SAV-08) */
export function clearWorking() {
  write(null);
}
