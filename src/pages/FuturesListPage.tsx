import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { ScenarioCard } from "../components/futures/ScenarioCard";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { deleteFuture, fetchFutures } from "../api/futures";
import type { Future } from "../types/future";

// W03 · 내가 저장한 미래 (상황 목록)
export function FuturesListPage() {
  const [futures, setFutures] = useState<Future[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Future | null>(null); // 삭제 확인 중인 상황
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchFutures()
      .then(setFutures)
      .finally(() => setLoading(false));
  }, []);

  const confirmDelete = async () => {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    try {
      await deleteFuture(target.id);
      setFutures((prev) => prev.filter((f) => f.id !== target.id));
      setMessage(`‘${target.name}’을 삭제했어요.`);
    } catch {
      setMessage("삭제하지 못했어요. 다시 시도해 주세요.");
    }
  };

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

        {message && <p className="futures-list__message">{message}</p>}

        {loading ? (
          <p>불러오는 중...</p>
        ) : (
          <div className="futures-list__grid">
            {futures.map((future) => (
              <ScenarioCard key={future.id} future={future} onDelete={setDeleting} />
            ))}
            <Link to="/futures/new" className="scenario-card scenario-card--new">
              <span>+</span>
              <strong>새 상황 만들기</strong>
              <span>입력부터 새로 시작해요</span>
            </Link>
          </div>
        )}
      </main>

      {deleting && (
        <ConfirmModal
          title="이 상황을 정말로 삭제하시겠습니까?"
          description={`‘${deleting.name}’을 삭제하면 되돌릴 수 없어요.`}
          confirmLabel="삭제"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
