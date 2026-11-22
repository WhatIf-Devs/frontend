import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginWithEmail, loginWithGoogle } from "../api/auth";

// W01 · 로그인 (첫 화면)
// 왼쪽: 서비스 소개 + 그래프 미리보기 (디자인 작업 전까지는 텍스트로만 표시)
// 오른쪽: 이메일/비밀번호, Google 계속하기, 로그인 없이 체험하기
export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  // [ACC-02] 비밀번호 보기/숨기기: true면 글자 그대로, false면 ●●●로 가림
  const [showPassword, setShowPassword] = useState(false);

  // [ACC-02] 로그인 버튼 활성 조건
  // 이메일 형식: "아이디@도메인.끝자리" 모양인지 검사
  // - 공백과 @는 한 번만, 끝자리(.com, .kr, .net 등)는 영문 2글자 이상
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim());
  // 비밀번호: 한 글자라도 입력됐는지
  const isPasswordFilled = password.length > 0;
  // 둘 다 만족할 때만 로그인 버튼을 누를 수 있음
  const canSubmit = isEmailValid && isPasswordFilled;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return; // 조건이 안 맞으면 Enter를 눌러도 아무 일도 안 일어남
    setError(null);
    try {
      await loginWithEmail({ email, password });
      navigate("/futures");
    } catch {
      setError("로그인에 실패했어요. 이메일/비밀번호를 확인해주세요.");
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-page__intro">
        <h1>내 손 안에 가장 쉬운 자산 시뮬레이터</h1>
        <p>계좌 연동 없이, 대략 아는 숫자만으로 미래 자산을 시뮬레이션해요.</p>
        {/* TODO: 유입 여행 1,000 그래프 미리보기 (recharts) */}
      </section>

      <section className="auth-page__form">
        <h2>로그인</h2>
        <p>저장해 둔 여러 가지 미래를 다시 열어볼 수 있어요.</p>
        <form onSubmit={handleSubmit}>
          <label>
            이메일
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dayeon@example.com"
              required
            />
          </label>
          <label>
            비밀번호
            <div className="auth-password">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-password__toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                aria-pressed={showPassword}
              >
                {showPassword ? "숨기기" : "보기"}
              </button>
            </div>
          </label>
          {error && <p className="auth-page__error">{error}</p>}
          <button type="submit" disabled={!canSubmit}>
            로그인
          </button>
        </form>
        <div className="auth-page__divider">또는</div>
        <button
          type="button"
          onClick={async () => {
            setError(null);
            try {
              await loginWithGoogle();
              navigate("/futures");
            } catch {
              setError("Google 로그인에 실패했어요.");
            }
          }}
        >
          Google로 계속하기
        </button>
        <p>
          계정이 없나요? <Link to="/signup">회원가입</Link>
        </p>
        <button type="button" onClick={() => navigate("/futures")}>
          로그인 없이 체험하기
        </button>
      </section>
    </div>
  );
}
