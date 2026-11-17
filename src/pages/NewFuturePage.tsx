import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { createFuture } from "../api/futures";
import type { FutureEvent, FutureGoal } from "../types/future";

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

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// B · 상황 입력 (기본정보 → 예정된 수입·지출 → 목표, 3단계)
// 오른쪽에는 "입력할 때마다 바로 계산돼요" 미리보기 패널이 있지만
// 실시간 계산 엔진 연동(POST /api/v1/simulations)이 아직 없는 지금은 자리만 잡아둠.
export function NewFuturePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  const [name, setName] = useState("");
  const [startMonth, setStartMonth] = useState(currentMonth());
  const [periodMonths, setPeriodMonths] = useState(12);
  const [currentAsset, setCurrentAsset] = useState(0);
  const [monthlySaving, setMonthlySaving] = useState(0);
  const [events, setEvents] = useState<FutureEvent[]>([]);
  const [hasGoal, setHasGoal] = useState<boolean | null>(null);
  const [goal, setGoal] = useState<FutureGoal>({ name: "", amount: 0, deadline: "" });

  const goNext = () => setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const handleFinish = async () => {
    const future = await createFuture({
      name,
      startMonth,
      periodMonths,
      currentAsset,
      monthlySaving,
      events,
      goal: hasGoal ? goal : undefined,
    });
    navigate(`/futures/${future.id}`);
  };

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
                <input
                  type="month"
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                />
              </label>
              <label>
                지금 모아둔 돈 (현재 자산, 만원)
                <input
                  type="number"
                  value={currentAsset}
                  onChange={(e) => setCurrentAsset(Number(e.target.value))}
                />
              </label>
              <label>
                매달 저축하는 돈 (만원)
                <input
                  type="number"
                  value={monthlySaving}
                  onChange={(e) => setMonthlySaving(Number(e.target.value))}
                />
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
                  <li key={ev.id}>
                    {ev.name} · {ev.type === "income" ? "+" : "-"}
                    {ev.amount}만원 · {ev.month}
                  </li>
                ))}
              </ul>
              <NewEventForm onAdd={(ev) => setEvents((prev) => [...prev, ev])} />
              <div className="new-future__nav">
                <button type="button" onClick={goBack}>
                  건너뛰기
                </button>
                <button type="button" onClick={goNext}>
                  다음 · 목표
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
                    <input
                      type="number"
                      value={goal.amount}
                      onChange={(e) => setGoal({ ...goal, amount: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    목표 기한
                    <input
                      type="month"
                      value={goal.deadline}
                      onChange={(e) => setGoal({ ...goal, deadline: e.target.value })}
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
                <button type="button" onClick={handleFinish}>
                  결과 보기
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="new-future__preview">
          <p>입력할 때마다 바로 계산돼요</p>
          {/* TODO: POST /api/v1/simulations로 실시간 미리보기 연결 */}
          <div className="new-future__preview-placeholder" />
        </aside>
      </main>
    </div>
  );
}

function NewEventForm({ onAdd }: { onAdd: (event: FutureEvent) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState(0);
  const [month, setMonth] = useState("");

  const handleAdd = () => {
    if (!name || !month) return;
    onAdd({ id: `ev-${Date.now()}`, name, type, amount, month, repeat: "once" });
    setName("");
    setAmount(0);
    setMonth("");
  };

  return (
    <div className="new-event-form">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 이사 보증금, 연말 보너스" />
      <div>
        <button type="button" className={type === "income" ? "is-active" : ""} onClick={() => setType("income")}>
          수입
        </button>
        <button type="button" className={type === "expense" ? "is-active" : ""} onClick={() => setType("expense")}>
          지출
        </button>
      </div>
      <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="금액(만원)" />
      <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      <button type="button" onClick={handleAdd}>
        + 목록에 추가
      </button>
    </div>
  );
}
