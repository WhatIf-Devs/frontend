import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { clearWorking, getSaveTarget } from "../state/workingScenario";
import { canUseLocalStorage, saveLocalFuture } from "../hooks/useLocalFutures";
import type { Future } from "../types/future";

// W10 · 상황 저장 (SAV-01~08)
// 뼈대만 만들어 둔 상태. 디자인·세부 동작은 feature/save-page 브랜치에서 팀원이 완성.
//
// 사용하는 값: getSaveTarget()
//   - target.version      : 저장할 버전 (조건 condition + 계산 결과 result)
//   - target.baseVersion  : V1 (요약 카드의 'V1 대비' 계산용)
//   - target.baseScenarioId / baseScenarioName : 저장된 상황을 열었을 때만 있음 → '덮어쓰기' 노출
//
// TODO(팀원):
//  - SAV-03 상황 이름: AI 제안 이름 (지금은 버전 제목/상황 이름으로 대체)
//  - SAV-06 로그인 상태면 '저장' 버튼 1개만, 로그인하고 저장 → W01 → 돌아와서 저장
//  - SAV-07 오른쪽 '저장될 내용' 요약 카드 (미니 그래프 포함)
//  - 디자인 적용
export function SavePage() {
  const navigate = useNavigate();
  const target = getSaveTarget();
  const { version, baseScenarioId, baseScenarioName } = target ?? {};
  const [name, setName] = useState(
    version ? (version.no === 1 ? version.condition.name : version.title) : "",
  );
  const [memo, setMemo] = useState("");
  const [mode, setMode] = useState<"new" | "overwrite">("new");
  const [failed, setFailed] = useState(false);
  const isLoggedIn = false; // TODO(팀원): 로그인 상태 연결
  const localOk = canUseLocalStorage();

  if (!target || !version) {
    return (
      <div className="page">
        <Header />
        <main className="save-page">
          <p>저장할 결과가 없어요.</p>
          <Link to="/futures/new">새 상황 만들기</Link>
        </main>
      </div>
    );
  }

  const saveInBrowser = () => {
    const { condition, result } = version;
    const future: Future = {
      id: mode === "overwrite" && baseScenarioId ? baseScenarioId : crypto.randomUUID(),
      ...condition,
      name: name.trim(),
      memo: memo.trim() || undefined,
      series: result.series,
      summary: result.summary,
      sparkline: result.series,
      originScenarioId: version.no > 1 ? baseScenarioId : undefined,
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    if (!saveLocalFuture(future)) {
      setFailed(true); // SAV-08 실패 시 입력 유지 + 재시도
      return;
    }
    clearWorking();
    navigate("/futures");
  };

  return (
    <div className="page">
      <Header />
      <main className="save-page">
        <button type="button" onClick={() => navigate("/result")}>
          ← 결과로 돌아가기
        </button>
        <h1>이 상황을 저장할까요?</h1>
        <p>이름을 붙여 두면 '내 미래'에서 다시 열고 다른 상황과 비교할 수 있어요.</p>

        <label>
          상황 이름
          <input value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          메모 (선택)
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예: 노트북은 5월에 그대로 사기로 함"
          />
        </label>

        <div>
          저장 방식
          <label>
            <input type="radio" checked={mode === "new"} onChange={() => setMode("new")} />
            새 상황으로 저장
          </label>
          {baseScenarioId && (
            <label>
              <input type="radio" checked={mode === "overwrite"} onChange={() => setMode("overwrite")} />
              {baseScenarioName}에 덮어쓰기
            </label>
          )}
        </div>

        {failed && <p className="auth-page__error">저장하지 못했어요. 다시 시도해 주세요.</p>}

        {!isLoggedIn ? (
          <div className="modal__warning">
            <strong>저장하려면 로그인이 필요해요</strong>
            <p>로그인하면 지금 입력과 대화 버전(V1~V{version.no})이 그대로 이어져요.</p>
            <button type="button" onClick={() => navigate("/login")}>
              로그인하고 저장
            </button>
            <button type="button" disabled={!name.trim() || !localOk} onClick={saveInBrowser}>
              이 브라우저에만 저장
            </button>
          </div>
        ) : (
          <button type="button" disabled={!name.trim()} onClick={saveInBrowser}>
            저장
          </button>
        )}
      </main>
    </div>
  );
}
