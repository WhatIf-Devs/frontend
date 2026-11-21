import type { ScenarioCondition, SimulationResult } from "./future";

// 결과 화면에서 보고 있는 상황과 AI 대화 버전 (COM-05).
// 서버에 저장하지 않고 브라우저 sessionStorage에만 보관 → 새로고침해도 유지, 탭을 닫으면 사라짐.

/** 버전 1개 (V1 = 입력한 조건, V2~ = AI 질문으로 바뀐 조건). 최대 10개 */
export interface ScenarioVersion {
  no: number; // 1, 2, 3...
  title: string; // 버전 카드 제목. V1은 "기존 플랜"
  question?: string; // 이 버전을 만든 질문 (V2 이상)
  condition: ScenarioCondition;
  result: SimulationResult;
}

/** 지금 결과 화면에서 다루는 상황 전체 */
export interface WorkingScenario {
  baseScenarioId?: string; // W03에서 '열기'로 연 저장된 상황이면 그 id (덮어쓰기용)
  baseScenarioName?: string;
  versions: ScenarioVersion[];
  viewingNo: number; // 지금 그래프에 보이는 버전 번호
}

/**
 * 결과 화면 '이벤트·목표 수정'(RES-13) → 입력 화면으로 넘기는 값.
 * 입력 화면은 이 조건을 미리 채운 채로 step 단계부터 보여줌.
 */
export interface EditRequest {
  condition: ScenarioCondition;
  base?: { id: string; name: string }; // 저장된 상황을 열어서 수정 중이면 그 상황 (덮어쓰기 선택지 유지)
  step: 2 | 3; // 2 = 이벤트(W05), 3 = 목표(W06)
}

/**
 * 결과 화면 → W10 저장 화면으로 넘기는 값 (SAV-01~08).
 * W10은 getSaveTarget()으로 이 값을 읽어서 화면을 그림.
 */
export interface SaveTarget {
  version: ScenarioVersion; // 저장할 버전 (지금 보고 있는 버전)
  baseVersion: ScenarioVersion; // V1 (요약 카드의 비교선·'V1 대비' 계산용)
  baseScenarioId?: string; // 있으면 '덮어쓰기' 선택지 노출 (SAV-05)
  baseScenarioName?: string;
}
