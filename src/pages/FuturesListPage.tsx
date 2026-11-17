import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { ScenarioCard } from "../components/futures/ScenarioCard";
import { fetchFutures } from "../api/futures";
import type { Future } from "../types/future";

// W03 · 내가 저장한 미래 (상황 목록)
export function FuturesListPage() {
  const [futures, setFutures] = useState<Future[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFutures()
      .then(setFutures)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <Header />
      <main className="futures-list">
        <div className="futures-list__header">
          <div>
            <h1>다연님이 저장한 미래</h1>
            <p>상황을 열어 이어서 비교하거나, 새 상황을 처음부터 만들 수 있어요.</p>
          </div>
          <Link to="/futures/new" className="button button--primary">
            + 새 상황 만들기
          </Link>
        </div>

        {loading ? (
          <p>불러오는 중...</p>
        ) : (
          <div className="futures-list__grid">
            {futures.map((future) => (
              <ScenarioCard key={future.id} future={future} />
            ))}
            <Link to="/futures/new" className="scenario-card scenario-card--new">
              <span>+</span>
              <strong>새 상황 만들기</strong>
              <span>입력부터 새로 시작해요</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
