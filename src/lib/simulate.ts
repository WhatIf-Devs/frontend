import type { ScenarioCondition, SimulationResult, FutureSummary } from "../types/future";

// 월별 자산 계산 엔진 (프론트 mock).
// 규칙: A(0) = 현재 자산, A(m) = A(m-1) + 월 저축 + 그 달 이벤트 (이자 미반영, PRD F2)
// 백엔드 계산 API(01)가 준비되면 같은 입력·같은 결과가 나와야 함.
// 검증값: 2026-11 시작, 500만원, 월 40만원, 성과급 +100(2027-02), 노트북 -150(2027-05),
//         목표 유럽 여행 1,000만원(2027-11) → 12개월 뒤 930만원, 70만원 부족, 93%, 약 5.8만원

/** "2026-11" + 3 → "2027-02" */
export function addMonths(yyyyMm: string, add: number): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const total = y * 12 + (m - 1) + add;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** from에서 to까지 몇 개월인지 ("2026-11" → "2027-11" = 12) */
export function monthDiff(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

/** 오늘 연월 (KST 기준, COM-11) */
export function currentMonth(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function simulate(c: ScenarioCondition): SimulationResult {
  const series: number[] = [c.currentAsset];
  const dropMonths: string[] = [];
  let amount = c.currentAsset;

  for (let i = 1; i <= c.periodMonths; i++) {
    const month = addMonths(c.startMonth, i);
    let delta = c.monthlySaving;
    for (const ev of c.events) {
      const sign = ev.type === "income" ? 1 : -1;
      const hits = ev.repeat === "monthly" ? monthDiff(ev.month, month) >= 0 : ev.month === month;
      if (hits) delta += sign * ev.amount;
    }
    if (delta < 0) dropMonths.push(month);
    amount += delta;
    series.push(amount);
  }

  const summary: FutureSummary = { dropMonths };

  if (c.goal && c.goal.amount > 0) {
    const goal = c.goal;
    // 목표 기한까지의 개월 수. 계산 기간 밖이면 마지막 달 기준
    const deadlineIdx = goal.deadline
      ? Math.min(Math.max(monthDiff(c.startMonth, goal.deadline), 0), c.periodMonths)
      : c.periodMonths;
    const valueAtDeadline = series[deadlineIdx];
    const shortfall = goal.amount - valueAtDeadline; // 양수면 부족, 음수면 초과
    summary.shortfall = shortfall;
    summary.achievementRate = Math.round((valueAtDeadline / goal.amount) * 100);
    if (shortfall > 0 && deadlineIdx > 0) {
      summary.extraSavingNeeded = Math.round((shortfall / deadlineIdx) * 10) / 10;
    }
    const reachIdx = series.findIndex((v) => v >= goal.amount);
    summary.reachMonth = reachIdx >= 0 ? addMonths(c.startMonth, reachIdx) : null;
  }

  return { series, summary };
}
