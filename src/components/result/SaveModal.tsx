import { useNavigate } from "react-router-dom";

interface SaveModalProps {
  isLoggedIn: boolean;
  onSaveLocal: () => void;
  onClose: () => void;
}

// D · "이 상황을 저장할까요?" 모달
// 비로그인 상태면 "로그인이 필요해요" 경고 + 로그인 유도, 그래도 "이 브라우저에만 저장"으로 탈출 가능.
export function SaveModal({ isLoggedIn, onSaveLocal, onClose }: SaveModalProps) {
  const navigate = useNavigate();

  return (
    <div className="modal-overlay">
      <div className="modal">
        <button type="button" onClick={onClose}>
          ← 결과로 돌아가기
        </button>
        <h2>이 상황을 저장할까요?</h2>

        <label>
          상황 이름
          <input defaultValue="월 10만원 더 모으기" />
        </label>
        <label>
          메모 (선택)
          <input placeholder="예: 노트북은 5월에 그대로 사기로 함" />
        </label>

        <div>
          저장 방식
          <label>
            <input type="radio" name="save-mode" defaultChecked />
            새 상황으로 저장
          </label>
          <label>
            <input type="radio" name="save-mode" />
            상황 1에 덮어쓰기
          </label>
        </div>

        {!isLoggedIn && (
          <div className="modal__warning">
            <strong>저장하려면 로그인이 필요해요</strong>
            <p>로그인하면 지금 입력한 대화 버전(V1~V3)이 그대로 이어져요.</p>
            <button type="button" onClick={() => navigate("/login")}>
              로그인하고 저장
            </button>
            <button type="button" onClick={onSaveLocal}>
              이 브라우저에만 저장
            </button>
          </div>
        )}

        {isLoggedIn && <button type="button" onClick={onSaveLocal}>저장</button>}
      </div>
    </div>
  );
}
