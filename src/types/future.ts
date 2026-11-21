// "상황(Future)" 하나 = ERD의 scenarios 테이블 1 row에 대응.
// 실제 ERD/API 명세 기준: 중첩 객체(basicInfo) 없이 평평한 구조이고,
// 필드명도 와이어프레임 추정치가 아니라 API 응답 필드명을 그대로 따름.

export type FutureId = string; // uuid, 프론트엔드에서 생성해서 서버로 보냄

export type FutureEventType = "income" | "expense";
export type FutureEventRepeat = "once" | "monthly"; // API 명세·ERD 기준 두 가지

/** 예정된 수입/지출 이벤트. id는 varchar(64), 프론트엔드에서 생성 */
export interface FutureEvent {
  id: string;
  name: string; // 예: "성과급", "노트북 구입" (와이어프레임상 "label" → 실제 API는 name)
  type: FutureEventType;
  amount: number; // 만원 단위, income이면 +, expense면 -로 그래프에 반영
  month: string; // YYYY-MM (와이어프레임상 "date" → 실제 API는 month)
  repeat?: FutureEventRepeat;
}

/** 목표 (선택) */
export interface FutureGoal {
  name: string; // 예: "유럽 여행"
  amount: number; // 목표 금액(만원) (와이어프레임상 "targetAmount" → 실제 API는 amount)
  deadline: string; // YYYY-MM (와이어프레임상 "targetDate" → 실제 API는 deadline)
}

/**
 * 결과 화면 요약 통계. API 명세 기준 실제 필드는 이 3개뿐이고,
 * 전부 목표(goal)가 있을 때만 의미를 가짐 — 목표가 없으면 비어있을 수 있음.
 * extraSavingNeeded만 예외적으로 천원 단위 "소수"이고, 나머지는 만원 단위 정수.
 */
export interface FutureSummary {
  shortfall?: number; // 만원. 목표금액 - 예상자산 (음수면 초과 달성)
  achievementRate?: number; // %
  extraSavingNeeded?: number; // 천원 단위 소수. 목표 달성을 위해 매달 추가로 필요한 저축액
  reachMonth?: string | null; // YYYY-MM. 목표 금액에 처음 닿는 달 (못 닿으면 null)
  dropMonths?: string[]; // YYYY-MM[]. 자산이 줄어드는 달 (INP-12 빨간 안내 박스)
}

/** 상황(Future) 1건 — scenarios 테이블 구조에 맞춘 평평한 모양 */
export interface Future {
  id: FutureId;
  name: string;
  memo?: string; // 상황 메모 (ERD: memo)
  startMonth: string; // YYYY-MM, 계산 시작월 (ERD: start_month)
  periodMonths: number; // 계산 기간(개월). 와이어프레임의 "1/3/5년" 버튼은 12/36/60으로 매핑
  currentAsset: number; // 현재 자산 (만원)
  monthlySaving: number; // 매달 저축액 (만원)
  events: FutureEvent[];
  goal?: FutureGoal;
  goalVisible?: boolean; // 결과 화면 '목표 표시' 토글 상태 (RES-02). 없으면 true로 취급
  // series/summary는 서버에 영구 저장되는 값이 아니라, 상황을 열 때마다
  // 계산 엔진이 저장된 조건(currentAsset/monthlySaving/events/goal)으로부터
  // 다시 계산해서 내려주는 결과값. 그래서 Future를 "저장"할 때는
  // 이 두 필드를 보낼 필요가 없고, "조회"할 때만 채워짐.
  series: number[]; // 월별 예상 자산(만원), startMonth부터 periodMonths개월치
  summary: FutureSummary;
  sparkline?: number[]; // 목록 카드(W03)의 미니 그래프용 축약 시리즈 (ERD: sparkline)
  originScenarioId?: FutureId; // 다른 상황을 복제/파생한 경우 원본 id (ERD: origin_scenario_id)
  version: number; // optimistic lock — 덮어쓰기 시 버전 불일치면 409 (ERD: version)
  updatedAt: string; // ISO date (KST, timestamptz)
}

/** 계산에 들어가는 조건만 모은 것 (계산 엔진 입력, 버전마다 하나씩) */
export type ScenarioCondition = Pick<
  Future,
  "name" | "startMonth" | "periodMonths" | "currentAsset" | "monthlySaving" | "events" | "goal" | "goalVisible"
>;

/** 계산 엔진 결과. series[0]은 시작 월의 현재 자산, series[i]는 i개월 뒤 자산 */
export interface SimulationResult {
  series: number[];
  summary: FutureSummary;
}

/** AI 대화 한 턴 */
export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
