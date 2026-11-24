import type { ScenarioVersion } from "../../types/version";
import type { FutureEvent } from "../../types/future";
import {
  formatMoney,
  formatSignedMoney,
  formatYearMonth,
  moneyTone,
} from "../../lib/format";
import "./save.css";

// W10 오른쪽 '저장될 내용' 요약 카드 (기능명세서 SAV-05, PRD F6)
// 보여 주는 것: 저장 대상 버전 / 시작 연월·현재 자산 / 월 저축 / 이벤트 / 목표 / 계산 가정 /
//              12개월 뒤 예상 / 미니 그래프(V1 연한 선 + 이 버전 진한 선)
// 이 카드는 "보여 주기만" 해요. 저장 동작은 SavePage가 담당.

interface SaveSummaryCardProps {
  version: ScenarioVersion; // 저장할 버전
  baseVersion: ScenarioVersion; // V1 (비교용)
}

const MAX_EVENTS_SHOWN = 3; // 이벤트가 많으면 3개만 보여 주고 "외 N개"

export function SaveSummaryCard({
  version,
  baseVersion,
}: SaveSummaryCardProps) {
  const { condition, result } = version;
  const isV1 = version.no === baseVersion.no;

  // 12개월 뒤 예상 (series[i] = i개월 뒤). 기간이 12개월보다 짧으면 마지막 달 값
  const afterMonths = Math.min(12, result.series.length - 1);
  const expected = result.series[afterMonths];
  const baseExpected =
    baseVersion.result.series[
      Math.min(afterMonths, baseVersion.result.series.length - 1)
    ];
  const diffFromV1 = expected - baseExpected;

  const shownEvents = condition.events.slice(0, MAX_EVENTS_SHOWN);
  const hiddenCount = condition.events.length - shownEvents.length;

  return (
    <aside className="save-summary" aria-label="저장될 내용">
      <h2 className="save-summary__title">저장될 내용</h2>

      <p className="save-summary__version">
        <span className="save-summary__version-no">V{version.no}</span>
        {version.title}
      </p>

      <dl className="save-summary__rows">
        <Row label="시작">
          {formatYearMonth(condition.startMonth)} · 현재 자산{" "}
          {formatMoney(condition.currentAsset)}
        </Row>
        <Row label="월 저축">{formatMoney(condition.monthlySaving)}</Row>
        <Row label="이벤트">
          {condition.events.length === 0 ? (
            "없음"
          ) : (
            <ul className="save-summary__events">
              {shownEvents.map((ev) => (
                <li key={ev.id}>{eventLine(ev)}</li>
              ))}
              {hiddenCount > 0 && (
                <li className="save-summary__more">외 {hiddenCount}개</li>
              )}
            </ul>
          )}
        </Row>
        <Row label="목표">
          {condition.goal
            ? `${condition.goal.name} · ${formatMoney(condition.goal.amount)} · ${formatYearMonth(condition.goal.deadline)}까지`
            : "없음"}
        </Row>
        <Row label="계산 가정">이자·물가 미반영, 매달 같은 금액 저축</Row>
      </dl>

      <div className="save-summary__expected">
        <span className="save-summary__expected-label">
          {afterMonths}개월 뒤 예상
        </span>
        <strong className="save-summary__expected-amount">
          {formatMoney(expected)}
        </strong>
        {!isV1 && (
          <span
            className={`save-summary__diff save-summary__diff--${moneyTone(diffFromV1)}`}
          >
            V1 대비 {formatSignedMoney(diffFromV1)}
          </span>
        )}
      </div>

      {result.series.length >= 2 && (
        <MiniChart
          values={result.series}
          baseValues={isV1 ? undefined : baseVersion.result.series}
          goal={condition.goal?.amount}
        />
      )}
      {!isV1 && (
        <p className="save-summary__legend">
          <span className="save-summary__legend-base">V1 기존 플랜</span>
          <span className="save-summary__legend-current">
            V{version.no} 저장할 버전
          </span>
        </p>
      )}
    </aside>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="save-summary__row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** "노트북 · 2027.05 · −150만원" / 매달이면 "월급 인상 · 2027.03부터 매달 · +30만원" */
function eventLine(ev: FutureEvent): string {
  const signed = ev.type === "income" ? ev.amount : -ev.amount;
  const when =
    ev.repeat === "monthly"
      ? `${formatYearMonth(ev.month)}부터 매달`
      : formatYearMonth(ev.month);
  return `${ev.name} · ${when} · ${formatSignedMoney(signed)}`;
}

// ---------- 미니 그래프 ----------
// 라이브러리(recharts) 없이 SVG 선 하나로 그려요. 작은 카드라 축·눈금은 생략.

const W = 280;
const H = 72;
const PAD = 6;

function MiniChart({
  values,
  baseValues,
  goal,
}: {
  values: number[];
  baseValues?: number[];
  goal?: number;
}) {
  const all = [
    ...values,
    ...(baseValues ?? []),
    ...(goal === undefined ? [] : [goal]),
  ];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1; // 값이 모두 같으면 0으로 나누지 않게
  const count = Math.max(values.length, baseValues?.length ?? 0);
  const x = (i: number) => (i / (count - 1)) * W;
  const y = (v: number) => PAD + (1 - (v - min) / range) * (H - PAD * 2);
  const toPoints = (vs: number[]) =>
    vs.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  return (
    <svg
      className="save-summary__chart"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`미니 그래프: ${formatMoney(values[0])}에서 ${formatMoney(values[values.length - 1])}까지`}
    >
      {goal !== undefined && (
        <line
          className="save-summary__chart-goal"
          x1="0"
          x2={W}
          y1={y(goal)}
          y2={y(goal)}
        />
      )}
      {baseValues && (
        <polyline
          className="save-summary__chart-base"
          points={toPoints(baseValues)}
        />
      )}
      <polyline
        className="save-summary__chart-line"
        points={toPoints(values)}
      />
    </svg>
  );
}
