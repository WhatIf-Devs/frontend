import { useState } from "react";

interface AIChatPanelProps {
  onClose: () => void;
}

// D · AI에게 물어보기 패널. 버전 기록 / AI 요약 / 추천 질문 버튼 / 직접 입력창.
// 실제 AI 연동 전까지는 입력만 받고 하드코딩된 안내를 보여주는 자리.
export function AIChatPanel({ onClose }: AIChatPanelProps) {
  const [input, setInput] = useState("");

  const suggestedQuestions = [
    "매달 얼마나 더 모아야 해?",
    "노트북을 내년 1월로 미루면?",
    "5월에 왜 돈이 줄어?",
    "내 조건에 맞는 예·적금 알려줘",
  ];

  return (
    <aside className="ai-chat-panel">
      <div className="ai-chat-panel__header">
        <strong>AI에게 물어보기</strong>
        <button type="button" onClick={onClose}>
          닫기
        </button>
      </div>

      <div className="ai-chat-panel__summary">
        <span className="ai-chat-panel__badge">AI 요약</span>
        <p>
          2월 성과급으로 늘지만 5월 노트북 구입(-150만원) 때문에 목표에 70만원
          모자라요.
        </p>
      </div>

      <div className="ai-chat-panel__suggestions">
        <p>이런 걸 물어볼 수 있어요</p>
        {suggestedQuestions.map((q) => (
          <button key={q} type="button" onClick={() => setInput(q)}>
            {q}
          </button>
        ))}
      </div>

      <form
        className="ai-chat-panel__input"
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: AI 질문 전송 API 연결
          setInput("");
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="예: 노트북은 내년 1월로 미루고 매달 5만원 더 모으면?"
        />
        <button type="submit">↑</button>
      </form>
    </aside>
  );
}
