import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { clearWorking, getSaveTarget } from "../state/workingScenario";
import { canUseLocalStorage, saveLocalFuture } from "../hooks/useLocalFutures";
import type { Future } from "../types/future";
import { useAuth } from "../state/auth";
import { useToast } from "../state/toast";
import { SaveSummaryCard } from "../components/save/SaveSummaryCard";
import {
  clearSaveDraft,
  readSaveDraft,
  saveTargetKey,
  writeSaveDraft,
  type SaveMode,
} from "../state/saveDraft";

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
//  - (완료) SAV-06 로그인 상태면 '저장' 버튼 1개만, 로그인하고 저장 → W01 → 돌아와서 저장
//  - (완료) 오른쪽 '저장될 내용' 요약 카드 → components/save/SaveSummaryCard.tsx (명세서 번호는 SAV-05)
//  - 디자인 적용
export function SavePage() {
  const navigate = useNavigate();
  const target = getSaveTarget();
  const { version, baseVersion, baseScenarioId, baseScenarioName } = target ?? {};
  const showToast = useToast();
  // 로그인 화면에 다녀왔다면 떠나기 전에 적어 둔 입력값(초안)으로 시작 (state/saveDraft.ts)
  // useState(() => …): 화면이 처음 그려질 때 한 번만 실행되는 초기값
  const [draft] = useState(() => (target ? readSaveDraft(saveTargetKey(target)) : null));
  const [name, setName] = useState(
    draft?.name ?? (version ? (version.no === 1 ? version.condition.name : version.title) : ""),
  );
  const [memo, setMemo] = useState(draft?.memo ?? "");
  const [mode, setMode] = useState<SaveMode>(
    // 덮어쓰기는 원래 상황이 있을 때만 고를 수 있음
    draft?.mode === "overwrite" && baseScenarioId ? "overwrite" : "new",
  );
  const [failed, setFailed] = useState(false);
  // [SAV-06] 로그인 상태 연결: user가 있으면 로그인한 상태
  const { user } = useAuth();
  const isLoggedIn = user !== null;
  const localOk = canUseLocalStorage();

  if (!target || !version || !baseVersion) {
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

  // TODO(feature/auth-api·BE 연결 후): 로그인 상태면 api/futures.ts의 createFuture / overwriteFuture로 계정에 저장.
  //   지금은 mock이라 로그인 상태도 브라우저 저장소에 저장하고, W03(mock 목록)에서 같이 보여요.
  // '로그인하고 저장': 입력값을 초안으로 적어 두고 로그인 화면으로 (돌아올 주소 /save 전달)
  const goLoginAndSave = () => {
    const ok = writeSaveDraft({ targetKey: saveTargetKey(target), name, memo, mode });
    if (!ok) {
      showToast("입력한 이름·메모를 기억하지 못했어요. 로그인 후 다시 입력해 주세요.", "error");
    }
    navigate("/login", { state: { from: "/save" } });
  };

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
    clearSaveDraft();
    showToast(`‘${future.name}’을 저장했어요.`); // SAV-09
    navigate("/futures");
  };

  return (
    <div className="page">
      <Header />
      <main className="save-page">
        <button type="button" onClick={() => navigate("/result")}>
          ← 결과로 돌아가기
        </button>
        <div className="save-page__layout">
          <section className="save-page__form">
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
              {/* 로그인 화면에 "끝나면 /save로 돌아와 줘"를 같이 넘김 (lib/returnTo.ts).
                  조건·버전은 sessionStorage에 남아 있고, 이름·메모·저장 방식은 초안으로 적어 둬요 */}
              <button type="button" onClick={goLoginAndSave}>
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
          </section>

          <SaveSummaryCard version={version} baseVersion={baseVersion} />
        </div>
      </main>
    </div>
  );
}
