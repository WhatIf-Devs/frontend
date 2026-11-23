import { Link } from "react-router-dom";
import type { Future } from "../../types/future";
import { formatMoney, formatSignedMoney, formatUpdatedAt, moneyTone } from "../../lib/format";

interface ScenarioCardProps {
  future: Future;
  /** AI 대화로 만든 상황이면, 출발한 상황의 이름 (예: "상황 1 · 지금처럼") */
  originName?: string;
  onDelete: (future: Future) => void; // 누르면 목록 화면이 확인 모달을 띄움
}

// W03 목록의 상황 카드 1개 (기능명세서 LST-03·04, 피그마 W03 Plan card)
// 이름 + 목표 태그 / 요약 줄 / 미니 그래프 / 결과 금액 + 결과 칩 / 수정 시각 + 열기
export function ScenarioCard({ future, originName, onDelete }: ScenarioCardProps) {
  const finalAsset = future.series.at(-1); // 계산 기간 마지막 달의 예상 자산
  const chip = finalAsset === undefined ? null : resultChip(future, finalAsset);
  const sparkline = future.sparkline?.length ? future.sparkline : future.series;

  return (
    <article className="scenario-card">
      <div className="scenario-card__header">
        <h3 className="scenario-card__name">{future.name}</h3>
        <span className="scenario-card__badge">{future.goal ? "목표 o" : "목표 x"}</span>
      </div>

      <p className="scenario-card__summary">{summaryLine(future, originName)}</p>

      {/* 미니 그래프: 계산 결과가 없으면 그리지 않고 금액만 보여 줌 (LST-03) */}
      {sparkline.length >= 2 && <Sparkline values={sparkline} goal={future.goal?.amount} />}

      <div className="scenario-card__result">
        <strong className="scenario-card__amount">
          {finalAsset === undefined ? "-" : formatMoney(finalAsset)}
        </strong>
        {chip && <span className={`scenario-card__chip scenario-card__chip--${chip.tone}`}>{chip.text}</span>}
      </div>

      <div className="scenario-card__footer">
        <span className="scenario-card__updated">수정 {formatUpdatedAt(future.updatedAt)}</span>
        <button type="button" className="scenario-card__delete" onClick={() => onDelete(future)}>
          삭제
        </button>
        {/* 결과 화면이 목표 유무에 따라 W07/W08로 알아서 보여 줌 (LST-05) */}
        <Link to={`/futures/${future.id}`} className="scenario-card__open">
          열기
        </Link>
      </div>
    </article>
  );
}

// ---------- 카드 안 글자 만들기 ----------

/**
 * 요약 줄 (LST-03)
 * - 보통: "12개월 · 월 40만원 · 이벤트 2개"
 * - AI 대화로 만든 상황: "상황 1에서 AI 대화로 생성 · 월 50만원"
 */
function summaryLine(future: Future, originName?: string): string {
  const saving = `월 ${formatMoney(future.monthlySaving)}`;
  if (future.originScenarioId) {
    // "상황 1 · 지금처럼" → 앞부분 "상황 1"만
    const origin = originName ? originName.split(" · ")[0] : "다른 상황";
    return `${origin}에서 AI 대화로 생성 · ${saving}`;
  }
  const events = future.events.length > 0 ? `이벤트 ${future.events.length}개` : "이벤트 없음";
  return `${future.periodMonths}개월 · ${saving} · ${events}`;
}

type ChipTone = "good" | "warn";

/**
 * 결과 칩 (LST-04)
 * - 목표 미달: 빨강 "유럽 여행까지 −70만원"
 * - 목표 달성: 초록 "목표 달성 +50만원"
 * - 목표 없음: 초록 "3년 뒤 · +1,390만원" (지금 자산보다 늘어난 금액, 줄었으면 빨강)
 */
function resultChip(future: Future, finalAsset: number): { text: string; tone: ChipTone } {
  if (future.goal) {
    // 서버가 계산한 부족액이 있으면 그걸 쓰고, 없으면 직접 계산 (양수면 부족, 음수면 초과)
    const shortfall = future.summary.shortfall ?? future.goal.amount - finalAsset;
    if (shortfall > 0) {
      return { text: `${future.goal.name}까지 ${formatSignedMoney(-shortfall)}`, tone: "warn" };
    }
    return {
      text: shortfall === 0 ? "목표 달성" : `목표 달성 ${formatSignedMoney(-shortfall)}`,
      tone: "good",
    };
  }
  const months = future.periodMonths;
  const when = months % 12 === 0 ? `${months / 12}년 뒤` : `${months}개월 뒤`;
  const diff = finalAsset - future.currentAsset;
  return { text: `${when} · ${formatSignedMoney(diff)}`, tone: moneyTone(diff) === "down" ? "warn" : "good" };
}

// ---------- 미니 그래프 ----------

const SPARK_W = 340;
const SPARK_H = 70;
const SPARK_PAD = 6; // 선이 위아래 끝에 붙어 잘리지 않게 여백

/** 월별 자산을 작은 선 그래프로. 목표가 있으면 점선으로 목표선 */
function Sparkline({ values, goal }: { values: number[]; goal?: number }) {
  const all = goal === undefined ? values : [...values, goal];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1; // 값이 모두 같으면 0으로 나누지 않게
  const x = (i: number) => (i / (values.length - 1)) * SPARK_W;
  const y = (v: number) => SPARK_PAD + (1 - (v - min) / range) * (SPARK_H - SPARK_PAD * 2);
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  return (
    <svg
      className="scenario-card__sparkline"
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`미니 그래프: ${formatMoney(values[0])}에서 ${formatMoney(values[values.length - 1])}까지${
        goal === undefined ? "" : `, 목표 ${formatMoney(goal)}`
      }`}
    >
      {goal !== undefined && (
        <line className="scenario-card__sparkline-goal" x1="0" x2={SPARK_W} y1={y(goal)} y2={y(goal)} />
      )}
      <polyline className="scenario-card__sparkline-line" points={points} />
    </svg>
  );
}
