import { Link } from "react-router-dom";
import type { Future } from "../../types/future";

interface ScenarioCardProps {
  future: Future;
}

// W03 목록의 상황 카드 1개: 이름 / 목표뱃지 / 미니그래프(자리만) / 최종 자산 / 수정일 / 열기
export function ScenarioCard({ future }: ScenarioCardProps) {
  const { name, series } = future;
  const finalAsset = series[series.length - 1];
  const hasGoal = Boolean(future.goal);

  return (
    <div className="scenario-card">
      <div className="scenario-card__header">
        <strong>{name}</strong>
        <span className="scenario-card__badge">{hasGoal ? "목표 o" : "목표 x"}</span>
      </div>

      {/* TODO: AssetChart 미니 버전(sparkline)으로 교체 */}
      <div className="scenario-card__chart-placeholder" />

      <div className="scenario-card__amount">
        {finalAsset !== undefined ? `${finalAsset.toLocaleString()}만원` : "-"}
      </div>

      <div className="scenario-card__footer">
        <span>수정 {new Date(future.updatedAt).toLocaleString("ko-KR")}</span>
        <Link to={`/futures/${future.id}`}>열기</Link>
      </div>
    </div>
  );
}
