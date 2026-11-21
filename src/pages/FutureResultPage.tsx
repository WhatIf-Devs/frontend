import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { AssetChart } from "../components/charts/AssetChart";
import { AIChatPanel } from "../components/result/AIChatPanel";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { fetchFutureById } from "../api/futures";
import {
  getViewingVersion,
  loadWorking,
  startWorking,
  toCondition,
} from "../state/workingScenario";
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

  // RES-02: AI 대화로 만든 버전(V2~)이 있으면 사라진다고 한 번 더 확인
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

          <AssetChart series={series} startMonth={condition.startMonth} goal={goal} />

          <div className="future-result__saving">
            매달 저축액
            {/* TODO(feature/result): 점선 미리보기 슬라이더 (RES-09) */}
            <input type="range" min={0} max={100} defaultValue={condition.monthlySaving} />
            <span>{condition.monthlySaving.toLocaleString()}만원</span>
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
          description="수정하면 AI 대화로 만든 버전은 사라지고, 지금 보고 있는 버전을 기준으로 다시 시작해요."
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
