import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { AssetChart } from "../components/charts/AssetChart";
import { AIChatPanel } from "../components/result/AIChatPanel";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { fetchFutureById } from "../api/futures";
import {
  addVersion,
  getViewingVersion,
  loadWorking,
  MAX_VERSIONS,
  setViewing,
  startWorking,
  toCondition,
} from "../state/workingScenario";
import { simulate } from "../lib/simulate";
import { useToast } from "../state/toast";
import type { EditRequest, WorkingScenario } from "../types/version";

// W07(목표 있음) · W08(목표 없음) 결과 화면 + AI 패널
// 두 가지 경로로 들어옴:
//  - /result       : 입력을 막 마친 상황 (sessionStorage의 '지금 보고 있는 상황')
//  - /futures/:id  : W03에서 '열기'로 연 저장된 상황 → 불러와서 V1로 시작 (LST-05)
export function FutureResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [working, setWorking] = useState<WorkingScenario | null>(() => (id ? null : loadWorking()));
  const [loadFailed, setLoadFailed] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [pendingEditStep, setPendingEditStep] = useState<2 | 3 | null>(null); // 버전이 사라진다는 확인 중
  // [RES-11] 슬라이더를 움직이는 중인 값 (null이면 움직이는 중 아님)
  const [draftSaving, setDraftSaving] = useState<number | null>(null);
  const showToast = useToast();

  useEffect(() => {
    if (!id) return;
    let ignored = false; // 다른 상황으로 이동했으면 이전 응답은 버림
    fetchFutureById(id)
      .then((f) => {
        if (ignored) return;
        if (!f) {
          setLoadFailed(true);
          return;
        }
        setWorking(startWorking(toCondition(f), { id: f.id, name: f.name }));
      })
      .catch(() => {
        if (!ignored) setLoadFailed(true);
      });
    return () => {
      ignored = true;
    };
  }, [id]);

  if (loadFailed) {
    return (
      <div className="page">
        <Header />
        <main className="future-result">
          <p>결과를 불러오지 못했어요.</p>
          <Link to="/futures">내 미래로 돌아가기</Link>
        </main>
      </div>
    );
  }

  if (!working) {
    // /result로 바로 들어왔는데 계산된 상황이 없을 때 (새 탭 등)
    if (!id) {
      return (
        <div className="page">
          <Header />
          <main className="future-result">
            <p>아직 계산한 결과가 없어요.</p>
            <Link to="/futures/new">새 상황 만들기</Link>
          </main>
        </div>
      );
    }
    return <p>불러오는 중...</p>;
  }

  const viewing = getViewingVersion(working);
  const condition = viewing.condition;
  const { series, summary } = viewing.result;
  const goal = condition.goalVisible === false ? undefined : condition.goal;
  const hasGoal = Boolean(goal);
  const finalAsset = series[series.length - 1] ?? condition.currentAsset;
  const diffFromNow = finalAsset - condition.currentAsset;
  const base = working.versions[0]; // V1 기존 플랜 (비교선, 정책표 10장)
  const isViewingBase = viewing.no === base.no;
  const latest = working.versions[working.versions.length - 1];

  // [RES-11] 슬라이더 미리보기: 움직이는 동안 바뀐 월 저축으로 다시 계산해서 점선으로
  const previewSeries =
    draftSaving !== null && draftSaving !== condition.monthlySaving
      ? simulate({ ...condition, monthlySaving: draftSaving }).series
      : undefined;

  // 손을 떼면: 바뀐 월 저축으로 새 버전(Vn)을 만들고 그 버전을 보여 줌 → V1과 비교선으로 비교
  // (AI 없이도 "조건 변경 → 시나리오 비교"가 되게. AI 질문으로 만드는 버전과 같은 목록에 쌓여요)
  const commitSaving = () => {
    if (draftSaving === null) return;
    const next = draftSaving;
    setDraftSaving(null);
    if (next === condition.monthlySaving) return;
    const added = addVersion(working, `월 ${next.toLocaleString()}만원`, { ...condition, monthlySaving: next });
    if (!added) {
      showToast(`버전은 ${MAX_VERSIONS}개까지 만들 수 있어요. 저장하거나 이전 버전을 활용해 주세요.`, "error");
      return;
    }
    setWorking(added);
  };

  // [CHT-06] 버전 칩을 누르면 그 버전을 그래프에 표시
  const viewVersion = (no: number) => setWorking(setViewing(working, no));

  const years = condition.periodMonths / 12;
  const periodLabel = Number.isInteger(years) ? `${years}년` : `${condition.periodMonths}개월`;

  // RES-13: 이벤트·목표 수정 → 입력 화면(W05·W06)으로, 지금 조건을 채운 채로 이동
  const goEdit = (step: 2 | 3) => {
    const request: EditRequest = {
      condition,
      base: working.baseScenarioId
        ? { id: working.baseScenarioId, name: working.baseScenarioName ?? condition.name }
        : undefined,
      step,
    };
    navigate("/futures/new", { state: { edit: request } });
  };

  // RES-02: AI 대화·슬라이더로 만든 버전(V2~)이 있으면 사라진다고 한 번 더 확인
  const requestEdit = (step: 2 | 3) => {
    if (working.versions.length > 1) setPendingEditStep(step);
    else goEdit(step);
  };

  let headline: string;
  if (goal && summary.shortfall !== undefined) {
    headline =
      summary.shortfall > 0
        ? `${goal.name}까지 ${summary.shortfall.toLocaleString()}만원 부족해요`
        : `${goal.name} 목표를 ${(-summary.shortfall).toLocaleString()}만원 넘겨요`;
  } else {
    headline = `지금처럼 모으면 ${periodLabel} 뒤 ${finalAsset.toLocaleString()}만원이 돼요`;
  }

  return (
    <div className="page">
      <Header />
      <main className="future-result">
        <div className="future-result__breadcrumb">
          <Link to="/futures">내 미래</Link> / {condition.name}
          <span className="scenario-card__badge">{hasGoal ? "목표 o" : "목표 x"}</span>
        </div>

        <section className="future-result__main">
          {goal && (
            <div className="future-result__goal-tag">
              {goal.name} · {goal.deadline}까지
            </div>
          )}

          <h1>{headline}</h1>

          <div className="future-result__stats">
            {hasGoal && goal ? (
              <>
                <StatCard label={`${condition.periodMonths}개월 뒤 예상 자산`} value={`${finalAsset.toLocaleString()}만원`} />
                <StatCard label="목표 금액" value={`${goal.amount.toLocaleString()}만원`} />
                <StatCard label="목표 달성률" value={summary.achievementRate !== undefined ? `${summary.achievementRate}%` : "—"} />
                <StatCard
                  label="매달 더 모으면 도달"
                  value={summary.extraSavingNeeded !== undefined ? `약 ${summary.extraSavingNeeded.toLocaleString()}만원` : "—"}
                />
              </>
            ) : (
              <>
                <StatCard label="지금보다" value={`${diffFromNow >= 0 ? "+" : ""}${diffFromNow.toLocaleString()}만원`} />
                <StatCard label="매달 저축" value={`${condition.monthlySaving.toLocaleString()}만원`} />
                <StatCard label={`${condition.periodMonths}개월 뒤`} value={`${finalAsset.toLocaleString()}만원`} />
              </>
            )}
          </div>

          {/* [RES-16] 이전 버전을 보는 중이면 안내 + 최신으로 */}
          {!isViewingBase && viewing.no !== latest.no && (
            <div className="future-result__version-banner">
              V{viewing.no} 보는 중 · 최신은 V{latest.no} · 기존 플랜(V1) 선과 함께 비교 중
              <button type="button" onClick={() => viewVersion(latest.no)}>
                최신(V{latest.no})으로
              </button>
            </div>
          )}

          {/* [CHT-05·06] 버전 칩: 누르면 그 버전이 그래프에 표시됨 */}
          {working.versions.length > 1 && (
            <div className="future-result__versions" role="group" aria-label="버전 선택">
              {working.versions.map((v) => (
                <button
                  key={v.no}
                  type="button"
                  className={`future-result__version${v.no === viewing.no ? " future-result__version--active" : ""}`}
                  aria-pressed={v.no === viewing.no}
                  onClick={() => viewVersion(v.no)}
                >
                  V{v.no} {v.title}
                </button>
              ))}
            </div>
          )}

          <AssetChart
            series={series}
            startMonth={condition.startMonth}
            goal={goal}
            seriesName={`V${viewing.no} ${viewing.title}`}
            baseSeries={isViewingBase ? undefined : base.result.series}
            previewSeries={previewSeries}
          />

          {/* [RES-11] 월 저축 슬라이더: 움직이는 중에는 점선 미리보기, 손을 떼면 새 버전으로 결과 갱신 */}
          <div className="future-result__saving">
            <label htmlFor="saving-slider">매달 저축액</label>
            <input
              id="saving-slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={draftSaving ?? Math.min(condition.monthlySaving, 100)}
              onChange={(e) => setDraftSaving(Number(e.target.value))}
              onPointerUp={commitSaving}
              // 키보드(←→)는 누를 때마다 버전이 생기지 않게, Enter나 칸을 벗어날 때(blur) 확정
              onKeyUp={(e) => {
                if (e.key === "Enter") commitSaving();
              }}
              onBlur={commitSaving}
              aria-valuetext={`${(draftSaving ?? condition.monthlySaving).toLocaleString()}만원`}
            />
            <span>{(draftSaving ?? condition.monthlySaving).toLocaleString()}만원</span>
            <small>0 ~ 100만원 · 움직이면 그래프에 점선으로 바로 보여요</small>
          </div>

          <div className="future-result__actions">
            <button type="button">조건에 맞는 예·적금 보기 (정보 제공)</button>
            <button type="button" onClick={() => requestEdit(2)}>
              이벤트·목표 수정
            </button>
            {!condition.goal && (
              <button type="button" onClick={() => requestEdit(3)}>
                + 목표 추가하기
              </button>
            )}
            <button type="button" onClick={() => setShowAIPanel((v) => !v)}>
              AI에게 물어보기
            </button>
            {/* W10 저장 화면으로 이동. 저장할 버전은 getSaveTarget()으로 W10이 직접 읽음 */}
            <button type="button" className="button--primary" onClick={() => navigate("/save")}>
              상황 저장하기
            </button>
          </div>
        </section>

        {showAIPanel && <AIChatPanel onClose={() => setShowAIPanel(false)} />}
      </main>

      {pendingEditStep && (
        <ConfirmModal
          title="입력을 수정할까요?"
          description="수정하면 AI 대화나 슬라이더로 만든 버전은 사라지고, 지금 보고 있는 버전을 기준으로 다시 시작해요."
          confirmLabel="수정하기"
          onConfirm={() => goEdit(pendingEditStep)}
          onCancel={() => setPendingEditStep(null)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
    </div>
  );
}
