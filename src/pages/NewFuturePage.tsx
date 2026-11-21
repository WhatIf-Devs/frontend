import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { startWorking } from "../state/workingScenario";
import { addMonths, currentMonth, simulate } from "../lib/simulate";
import { MoneyInput } from "../components/common/MoneyInput";
import { MonthSelect } from "../components/common/MonthSelect";
import { AssetChart } from "../components/charts/AssetChart";
import type { FutureEvent, FutureEventRepeat, FutureGoal, ScenarioCondition } from "../types/future";
import type { EditRequest } from "../types/version";

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "기본 정보",
  2: "예정된 수입·지출",
  3: "목표",
};

const PERIOD_OPTIONS = [
  { label: "1년", months: 12 },
  { label: "3년", months: 36 },
  { label: "5년", months: 60 },
];

// B · 상황 입력 (기본정보 → 예정된 수입·지출 → 목표, 3단계)
// 오른쪽에는 "입력할 때마다 바로 계산돼요" 미리보기 패널이 있지만
// 실시간 계산 엔진 연동(POST /api/v1/simulations)이 아직 없는 지금은 자리만 잡아둠.
export function NewFuturePage() {
  const navigate = useNavigate();
  // 결과 화면의 '이벤트·목표 수정'으로 들어왔으면 기존 조건이 들어 있음 (없으면 새 상황)
  const edit = (useLocation().state as { edit?: EditRequest } | null)?.edit;
  const c = edit?.condition;

  const [step, setStep] = useState<Step>(edit?.step ?? 1);

  const [name, setName] = useState(c?.name ?? "");
  const [startMonth, setStartMonth] = useState(c?.startMonth ?? currentMonth());
  const [periodMonths, setPeriodMonths] = useState(c?.periodMonths ?? 12);
  const [currentAsset, setCurrentAsset] = useState(c?.currentAsset ?? 0);
  const [monthlySaving, setMonthlySaving] = useState(c?.monthlySaving ?? 0);
  const [events, setEvents] = useState<FutureEvent[]>(c?.events ?? []);
  // INP-06 기본값 '목표가 있어요'. 수정이면 기존 목표 유무, '목표 추가하기'(step 3)면 있음
  const [hasGoal, setHasGoal] = useState<boolean>(c ? Boolean(c.goal) || edit?.step === 3 : true);
  const [goal, setGoal] = useState<FutureGoal>(c?.goal ?? { name: "", amount: 0, deadline: "" });

  const goNext = () => setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  // 입력을 마치면 계산해서 '지금 보고 있는 상황'(V1)으로 만들고 결과 화면으로 이동.
  // 저장은 아직 하지 않음 → 결과 화면에서 '상황 저장하기'(W10)를 눌러야 저장됨
  const handleFinish = () => {
    startWorking({
      name: name.trim() || "상황 1 · 지금처럼",
      startMonth,
      periodMonths,
      currentAsset,
      monthlySaving,
      events,
      goal: hasGoal ? goal : undefined,
      goalVisible: hasGoal,
    }, edit?.base); // 저장된 상황을 수정 중이면 그 상황을 이어서 (저장 시 덮어쓰기 가능)
    navigate("/result");
  };

  // INP-07 실시간 미리보기: 입력이 멈추고 300ms 뒤에 계산 (타이핑할 때마다 계산하지 않게)
  const liveCondition: ScenarioCondition = useMemo(
    () => ({
      name,
      startMonth,
      periodMonths,
      currentAsset,
      monthlySaving,
      events,
      goal: hasGoal && goal.amount > 0 ? goal : undefined,
    }),
    [name, startMonth, periodMonths, currentAsset, monthlySaving, events, hasGoal, goal],
  );
  const [previewCondition, setPreviewCondition] = useState(liveCondition);
  useEffect(() => {
    const timer = setTimeout(() => setPreviewCondition(liveCondition), 300);
    return () => clearTimeout(timer);
  }, [liveCondition]);
  const preview = useMemo(() => simulate(previewCondition), [previewCondition]);
  const previewFinal = preview.series[preview.series.length - 1];
  const hasNumbers =
    previewCondition.currentAsset > 0 ||
    previewCondition.monthlySaving > 0 ||
    previewCondition.events.some((ev) => ev.amount > 0) ||
    (previewCondition.goal?.amount ?? 0) > 0;
  const previewYears = previewCondition.periodMonths / 12;
  const previewPeriod = Number.isInteger(previewYears) ? `${previewYears}년` : `${previewCondition.periodMonths}개월`;

  // 이벤트 시점·목표 기한은 계산 시작 다음 달부터 (INP-10, INP-13)
  const firstMonth = addMonths(startMonth, 1);
  const lastMonth = addMonths(startMonth, periodMonths);

  // 시작월을 바꾸면 이미 고른 목표 기한이 범위 밖이 될 수 있음 → 결과 보기 막고 안내
  const goalDeadlineMax = addMonths(startMonth, 120);
  const invalidGoalDeadline =
    hasGoal && goal.deadline !== "" && (goal.deadline < firstMonth || goal.deadline > goalDeadlineMax);

  // 이벤트 수정·삭제 (INP-11)
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const editingEvent = events.find((ev) => ev.id === editingEventId);
  const submitEvent = (ev: FutureEvent) => {
    if (editingEventId) {
      setEvents((prev) => prev.map((item) => (item.id === ev.id ? ev : item)));
      setEditingEventId(null);
    } else {
      setEvents((prev) => [...prev, ev]);
    }
  };
  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
    if (editingEventId === id) setEditingEventId(null);
  };

  // W05 '건너뛰기'·'다음': 목표가 있으면 W06, 없으면 바로 결과 (INP-13)
  const afterEvents = () => (hasGoal ? setStep(3) : handleFinish());

  return (
    <div className="page">
      <Header />
      <main className="new-future">
        <aside className="new-future__steps">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className={`new-future__step ${step === s ? "is-active" : ""}`}>
              {s}. {STEP_LABELS[s]}
            </div>
          ))}
        </aside>

        <section className="new-future__form">
          {step === 1 && (
            <div>
              <h2>지금 상황을 알려주세요</h2>
              <label>
                상황 이름
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="상황 1 · 지금처럼"
                />
              </label>
              <label>
                계산 시작월
                <MonthSelect value={startMonth} onChange={(v) => v && setStartMonth(v)} />
              </label>
              <label>
                지금 모아둔 돈 (현재 자산, 만원)
                <MoneyInput value={currentAsset} onChange={setCurrentAsset} max={100_000} />
              </label>
              <label>
                매달 저축하는 돈 (만원)
                <MoneyInput value={monthlySaving} onChange={setMonthlySaving} max={1_000} />
              </label>
              <div className="new-future__period">
                계산 기간
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.months}
                    type="button"
                    className={periodMonths === opt.months ? "is-active" : ""}
                    onClick={() => setPeriodMonths(opt.months)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div>
                모으고 싶은 목표가 있어요?
                <label>
                  <input
                    type="radio"
                    checked={hasGoal === true}
                    onChange={() => setHasGoal(true)}
                  />
                  목표가 있어요
                </label>
                <label>
                  <input
                    type="radio"
                    checked={hasGoal === false}
                    onChange={() => setHasGoal(false)}
                  />
                  아직 없어요
                </label>
              </div>
              <button type="button" onClick={goNext}>
                다음 · 수입·지출
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2>예정된 수입·지출이 있나요?</h2>
              <ul>
                {events.map((ev) => (
                  <li key={ev.id} className={ev.id === editingEventId ? "is-editing" : ""}>
                    {ev.name} · {ev.type === "income" ? "+" : "-"}
                    {ev.amount.toLocaleString()}만원 · {ev.month.replace("-", "년 ")}월
                    {ev.repeat === "monthly" ? "부터 매달" : " · 한 번"}
                    <button type="button" onClick={() => setEditingEventId(ev.id)}>
                      수정
                    </button>
                    <button type="button" onClick={() => removeEvent(ev.id)}>
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
              <NewEventForm
                key={editingEventId ?? "new"} // 수정할 이벤트가 바뀌면 폼을 새로 채움
                initial={editingEvent}
                minMonth={firstMonth}
                maxMonth={lastMonth}
                onSubmit={submitEvent}
                onCancel={editingEventId ? () => setEditingEventId(null) : undefined}
              />
              <div className="new-future__nav">
                <button type="button" onClick={goBack}>
                  이전
                </button>
                <button type="button" onClick={afterEvents}>
                  건너뛰기
                </button>
                <button type="button" onClick={afterEvents}>
                  {hasGoal ? "다음 · 목표" : "다음 · 결과 보기"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2>모으고 싶은 목표를 정해요</h2>
              {hasGoal ? (
                <>
                  <label>
                    목표 이름
                    <input
                      value={goal.name}
                      onChange={(e) => setGoal({ ...goal, name: e.target.value })}
                      placeholder="예: 여행, 자취 보증금, 비상금"
                    />
                  </label>
                  <label>
                    목표 금액 (만원)
                    <MoneyInput value={goal.amount} onChange={(n) => setGoal({ ...goal, amount: n })} />
                  </label>
                  <label>
                    목표 기한
                    <MonthSelect
                      value={goal.deadline}
                      onChange={(v) => setGoal({ ...goal, deadline: v })}
                      min={firstMonth}
                      max={goalDeadlineMax}
                    />
                  </label>
                </>
              ) : (
                <p>목표는 결과 화면에서도 언제든 추가할 수 있어요.</p>
              )}
              <div className="new-future__nav">
                <button type="button" onClick={goBack}>
                  이전
                </button>
                {invalidGoalDeadline && (
                  <p role="alert">목표 기한을 계산 시작 다음 달 이후로 다시 선택해 주세요.</p>
                )}
                <button type="button" onClick={handleFinish} disabled={invalidGoalDeadline}>
                  결과 보기
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="new-future__preview">
          <p>입력할 때마다 바로 계산돼요</p>
          {/* 지금은 프론트 계산(lib/simulate.ts). 백엔드 계산 API(01)가 나오면 그걸로 교체 */}
          {hasNumbers ? (
            <>
              <p className="new-future__preview-headline">
                {previewPeriod} 뒤 {previewFinal.toLocaleString()}만원
              </p>
              <AssetChart
                series={preview.series}
                startMonth={previewCondition.startMonth}
                goal={previewCondition.goal}
                height={180}
              />
              {preview.summary.shortfall !== undefined && previewCondition.goal && (
                <p>
                  {preview.summary.shortfall > 0
                    ? `${previewCondition.goal.name || "목표"}까지 ${preview.summary.shortfall.toLocaleString()}만원 부족해요`
                    : `${previewCondition.goal.name || "목표"}를 ${(-preview.summary.shortfall).toLocaleString()}만원 넘겨요`}
                </p>
              )}
            </>
          ) : (
            <div className="new-future__preview-placeholder">
              <p>숫자를 입력하면 바로 계산돼요</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

interface NewEventFormProps {
  initial?: FutureEvent; // 있으면 '수정' 모드: 값이 채워지고 버튼이 '저장'으로
  minMonth: string; // 계산 시작 다음 달
  maxMonth: string; // 계산 기간 마지막 달
  onSubmit: (event: FutureEvent) => void;
  onCancel?: () => void; // 수정 취소
}

// W05 이벤트 추가 폼 (INP-10): 이름 / 수입·지출 / 금액 / 언제 / 한 번·매달부터
function NewEventForm({ initial, minMonth, maxMonth, onSubmit, onCancel }: NewEventFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<"income" | "expense">(initial?.type ?? "income");
  const [amount, setAmount] = useState(initial?.amount ?? 0);
  const [month, setMonth] = useState(initial?.month ?? "");
  const [repeat, setRepeat] = useState<FutureEventRepeat>(initial?.repeat ?? "once");
  const [formKey, setFormKey] = useState(0); // 추가한 뒤 금액칸을 비우려고 새로 그림

  // 이름·금액·시점 중 하나라도 비면 추가 불가 (INP-10)
  const canAdd = name.trim() !== "" && amount > 0 && month !== "";

  const handleAdd = () => {
    if (!canAdd) return;
    // 수정이면 원래 id를 그대로 써야 목록에서 그 이벤트만 바뀜
    onSubmit({ id: initial?.id ?? `ev-${Date.now()}`, name: name.trim(), type, amount, month, repeat });
    setName("");
    setAmount(0);
    setMonth("");
    setRepeat("once");
    setFormKey((k) => k + 1);
  };

  return (
    <div className="new-event-form" key={formKey}>
      <label className="new-event-form__row">
        <span className="new-event-form__label">이름</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 이사 보증금, 연말 보너스" />
      </label>
      <div className="new-event-form__row">
        <span className="new-event-form__label">종류</span>
        <button type="button" className={type === "income" ? "is-active" : ""} onClick={() => setType("income")}>
          수입
        </button>
        <button type="button" className={type === "expense" ? "is-active" : ""} onClick={() => setType("expense")}>
          지출
        </button>
      </div>
      <label className="new-event-form__row">
        <span className="new-event-form__label">금액</span>
        <MoneyInput value={amount} onChange={setAmount} max={100_000} />
      </label>
      <div className="new-event-form__row">
        <span className="new-event-form__label">언제</span>
        <MonthSelect value={month} onChange={setMonth} min={minMonth} max={maxMonth} />
      </div>
      <div className="new-event-form__row">
        <span className="new-event-form__label">반복</span>
        <button type="button" className={repeat === "once" ? "is-active" : ""} onClick={() => setRepeat("once")}>
          한 번
        </button>
        <button type="button" className={repeat === "monthly" ? "is-active" : ""} onClick={() => setRepeat("monthly")}>
          매달부터
        </button>
      </div>
      <button type="button" onClick={handleAdd} disabled={!canAdd}>
        {initial ? "저장" : "+ 목록에 추가"}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel}>
          취소
        </button>
      )}
    </div>
  );
}
