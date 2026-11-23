import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { ScenarioCard } from "../components/futures/ScenarioCard";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { deleteFuture, fetchFutures } from "../api/futures";
import { readLocalFutures } from "../hooks/useLocalFutures";
import type { Future } from "../types/future";
import { useAuth } from "../state/auth";

// W03 · 내가 저장한 미래 (상황 목록) — 기능명세서 LST-01~06, 피그마 W03
// - 로그인 상태: 계정에 저장한 상황 / 체험 중(비로그인): 이 브라우저에 저장한 상황만 (LST-01)
// - 저장한 상황이 없으면 점선 "새 상황 만들기" 카드만 보임 = 빈 상태 (LST-06, 피그마 W03 빈 상태)

/** 상황 이름 앞의 번호 ("상황 2 · 월 10만원 더" → 2). 번호가 없으면 맨 뒤로 */
function scenarioNumber(name: string): number {
  const match = /^상황\s*(\d+)/.exec(name);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

/** 상황 번호순 정렬, 번호가 같거나 없으면 최근 수정한 것부터 (LST-03) */
function sortFutures(list: Future[]): Future[] {
  return [...list].sort(
    (a, b) =>
      scenarioNumber(a.name) - scenarioNumber(b.name) ||
      Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
}

export function FuturesListPage() {
  const { user } = useAuth();
  const [futures, setFutures] = useState<Future[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0); // 바꾸면 목록을 다시 불러옴 (재시도)
  const [deleting, setDeleting] = useState<Future | null>(null); // 삭제 확인 중인 상황
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false; // 화면을 떠난 뒤 늦게 온 응답은 무시
    // 로그인 상태면 계정(서버), 체험 중이면 이 브라우저에 저장한 것만
    const load = user ? fetchFutures() : Promise.resolve(readLocalFutures());
    load
      .then((list) => {
        if (cancelled) return;
        setFutures(sortFutures(list));
        setLoadError(false);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  const retry = () => {
    setLoading(true);
    setLoadError(false);
    setReloadKey((k) => k + 1);
  };

  // AI 대화로 만든 상황의 "상황 1에서 …" 문구용: id → 이름
  const nameById = useMemo(() => new Map(futures.map((f) => [f.id, f.name])), [futures]);

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
            {/* 로그인 상태면 "{닉네임}님이", 체험 중이면 "내가" (LST-02) */}
            <h1 className="futures-list__title">{user ? `${user.nickname}님이` : "내가"} 저장한 미래</h1>
            <p className="futures-list__desc">
              상황을 열어 이어서 비교하거나, 새 상황을 처음부터 만들 수 있어요.
            </p>
          </div>
          <Link to="/futures/new" className="futures-list__new-button">
            + 새 상황 만들기
          </Link>
        </div>

        {message && (
          <p className="futures-list__message" role="status">
            {message}
          </p>
        )}

        {loading ? (
          <p className="futures-list__status">불러오는 중...</p>
        ) : loadError ? (
          // 불러오기 실패: 해당 영역만 오류 + 재시도 (COM-08)
          <div className="futures-list__status" role="alert">
            <p>목록을 불러오지 못했어요. 다시 시도해 주세요.</p>
            <button type="button" className="futures-list__retry" onClick={retry}>
              다시 시도
            </button>
          </div>
        ) : (
          <div className="futures-list__grid">
            {futures.map((future) => (
              <ScenarioCard
                key={future.id}
                future={future}
                originName={future.originScenarioId ? nameById.get(future.originScenarioId) : undefined}
                onDelete={setDeleting}
              />
            ))}
            {/* 항상 마지막에 점선 카드. 저장한 상황이 없으면 이 카드만 = 빈 상태 (LST-06) */}
            <Link to="/futures/new" className="scenario-card scenario-card--new">
              <span className="scenario-card__new-plus" aria-hidden="true">
                +
              </span>
              <strong className="scenario-card__new-title">새 상황 만들기</strong>
              <span className="scenario-card__new-desc">입력부터 새로 시작해요</span>
            </Link>
          </div>
        )}
      </main>

      {deleting && (
        <ConfirmModal
          title="이 상황을 삭제할까요?"
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
