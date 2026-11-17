import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { AssetChart } from "../components/charts/AssetChart";
import { AIChatPanel } from "../components/result/AIChatPanel";
import { SaveModal } from "../components/result/SaveModal";
import { fetchFutureById } from "../api/futures";
import { useLocalFutures } from "../hooks/useLocalFutures";
import type { Future } from "../types/future";

// C · 결과 + D · AI 대화·저장·금융상품 (한 화면에서 패널로 토글)
export function FutureResultPage() {
  const { id } = useParams<{ id: string }>();
  const [future, setFuture] = useState<Future | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const { saveFuture } = useLocalFutures();

  // TODO: 실제 로그인 상태 연동 (지금은 항상 비로그인으로 가정해 저장 모달 플로우를 보여줌)
  const isLoggedIn = false;

  useEffect(() => {
    if (!id) return;
    fetchFutureById(id).then((f) => setFuture(f ?? null));
  }, [id]);

  if (!future) return <p>불러오는 중...</p>;

  const { goal, summary, series } = future;
  const hasGoal = Boolean(goal);
  const finalAsset = series[series.length - 1] ?? future.currentAsset;
  const diffFromNow = finalAsset - future.currentAsset;

  return (
    <div className="page">
      <Header />
      <main className="future-result">
        <div className="future-result__breadcrumb">
          <Link to="/futures">내 미래</Link> / {future.name}
          <span className="scenario-card__badge">{hasGoal ? "목표 o" : "목표 x"}</span>
        </div>

        <section className="future-result__main">
          {goal && (
            <div className="future-result__goal-tag">
              {goal.name} · {goal.deadline}까지
            </div>
          )}

          <h1>
            {hasGoal
              ? summary.shortfall !== undefined && summary.shortfall > 0
                ? `${goal!.name}까지 ${summary.shortfall.toLocaleString()}만원 부족해요`
                : `${goal!.name} 목표를 달성해요`
              : `지금처럼 모으면 ${finalAsset.toLocaleString()}만원이 돼요`}
          </h1>

          <div className="future-result__stats">
            {hasGoal ? (
              <>
                <StatCard label={`${future.periodMonths}개월 뒤 예상 자산`} value={`${finalAsset.toLocaleString()}만원`} />
                <StatCard label="목표 금액" value={`${goal!.amount.toLocaleString()}만원`} />
                <StatCard label="목표 달성률" value={summary.achievementRate !== undefined ? `${summary.achievementRate}%` : "-"} />
                <StatCard
                  label="매달 추가로 필요한 저축액"
                  value={summary.extraSavingNeeded !== undefined ? `약 ${summary.extraSavingNeeded}만원` : "-"}
                />
              </>
            ) : (
              <>
                <StatCard label="지금보다" value={`${diffFromNow >= 0 ? "+" : ""}${diffFromNow.toLocaleString()}만원`} />
                <StatCard label="매달 저축" value={`${future.monthlySaving.toLocaleString()}만원`} />
                <StatCard label={`${future.periodMonths}개월 뒤`} value={`${finalAsset.toLocaleString()}만원`} />
              </>
            )}
          </div>

          <AssetChart series={series} startMonth={future.startMonth} goal={goal} />

          <div className="future-result__saving">
            매달 저축액
            <input type="range" min={0} max={100} defaultValue={future.monthlySaving} />
            <span>{future.monthlySaving}만원</span>
          </div>

          <div className="future-result__actions">
            <button type="button">조건에 맞는 예·적금 보기 (정보 제공)</button>
            <button type="button">이벤트·목표 수정</button>
            <button type="button" onClick={() => setShowAIPanel((v) => !v)}>
              AI에게 물어보기
            </button>
            <button type="button" className="button--primary" onClick={() => setShowSaveModal(true)}>
              상황 저장하기
            </button>
          </div>
        </section>

        {showAIPanel && <AIChatPanel onClose={() => setShowAIPanel(false)} />}
      </main>

      {showSaveModal && (
        <SaveModal
          isLoggedIn={isLoggedIn}
          onClose={() => setShowSaveModal(false)}
          onSaveLocal={() => {
            saveFuture(future);
            setShowSaveModal(false);
          }}
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
