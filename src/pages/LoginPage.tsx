import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { loginWithEmail, loginWithGoogle } from "../api/auth";
import { toSessionUser, useAuth } from "../state/auth";
import { AuthLayout } from "./AuthLayout";
import "./auth.css";

// W01 · 로그인 (첫 화면)
// 배경(움직이는 그라데이션 + 실시간 그래프)과 배치는 AuthLayout이 담당하고,
// 이 파일은 로그인 카드 안의 내용과 동작만 담당해요.

// 실패 문구 (기능명세서 ACC-02·03, 정책표 13장)
// 보안을 위해 이메일이 틀렸는지 비밀번호가 틀렸는지는 구분해서 알려주지 않음
const EMAIL_LOGIN_ERROR = "이메일 또는 비밀번호를 확인해 주세요.";
const GOOGLE_LOGIN_ERROR = "로그인하지 못했어요. 다시 시도해 주세요.";

export function LoginPage() {
  const navigate = useNavigate();
  const { user, signIn, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  // [ACC-02] 비밀번호 보기/숨기기: true면 글자 그대로, false면 ●●●로 가림
  const [showPassword, setShowPassword] = useState(false);
  // 로그인 요청이 진행 중인지. 진행 중에는 모든 버튼을 잠가서
  // 두 번 누르기나, 로그인 도중 "체험하기"로 빠지는 일을 막아요 (CodeRabbit 리뷰 반영)
  const [pending, setPending] = useState(false);

  // [ACC-02] 로그인 버튼 활성 조건
  // 이메일 형식: "아이디@도메인.끝자리" 모양인지 검사
  // - 공백과 @는 한 번만, 끝자리(.com, .kr, .net 등)는 영문 2글자 이상
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim());
  // 비밀번호: 한 글자라도 입력됐는지
  const isPasswordFilled = password.length > 0;
  // 둘 다 만족할 때만 로그인 버튼을 누를 수 있음
  const canSubmit = isEmailValid && isPasswordFilled && !pending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return; // 조건이 안 맞으면 Enter를 눌러도 아무 일도 안 일어남
    setError(null);
    setPending(true);
    try {
      const account = await loginWithEmail({ email, password });
      signIn(toSessionUser(account)); // 로그인 상태로 기억 → 헤더에 닉네임 칩
      navigate("/futures");
    } catch {
      setError(EMAIL_LOGIN_ERROR); // 입력값은 그대로 남겨 둠
    } finally {
      setPending(false); // 성공이든 실패든 끝나면 잠금 해제
    }
  };

  // [ACC-05] 로그인 없이 체험하기 → W04
  // 이미 로그인된 상태로 이 화면에 왔다면 먼저 로그아웃해서, 체험 중 저장이 계정이 아닌
  // 이 브라우저에만 되도록 함 (CodeRabbit 리뷰 반영)
  const handleTrial = async () => {
    if (pending) return;
    if (user) await signOut();
    navigate("/futures/new");
  };

  const handleGoogleLogin = async () => {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const account = await loginWithGoogle();
      signIn(toSessionUser(account));
      navigate("/futures");
    } catch {
      // TODO: 토스트 컴포넌트가 생기면 토스트로 바꾸기 (ACC-03)
      setError(GOOGLE_LOGIN_ERROR);
    } finally {
      setPending(false);
    }
  };

  // 이미 로그인한 사람은 로그인 화면을 보지 않고 바로 W03(내 미래)으로
  // (로그인 화면은 로그아웃했을 때, 또는 체험 중 "로그인"을 눌렀을 때만 나와요)
  // 주의: useState 같은 훅(use…)을 모두 부른 다음에 return 해야 해서 이 위치에 둬요
  if (user) return <Navigate to="/futures" replace />;

  return (
    <AuthLayout>
      <section className="auth__card">
        <h2 className="auth__title">로그인</h2>
        <p className="auth__subtitle">저장해 둔 여러 가지 미래를 다시 열어볼 수 있어요.</p>

        <form className="auth__form" onSubmit={handleSubmit}>
          <label className="auth__field">
            <span className="auth__label">이메일</span>
            <input
              className="auth__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dayeon@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="auth__field">
            <span className="auth__label">비밀번호</span>
            <div className="auth__password">
              <input
                className="auth__input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth__toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                aria-pressed={showPassword}
              >
                {showPassword ? "숨기기" : "보기"}
              </button>
            </div>
          </label>

          {error && (
            <p className="auth__error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth__button auth__button--primary"
            disabled={!canSubmit}
          >
            {pending ? "로그인하는 중…" : "로그인"}
          </button>
        </form>

        <div className="auth__divider">
          <span>또는</span>
        </div>

        <button
          type="button"
          className="auth__button auth__button--ghost"
          onClick={handleGoogleLogin}
          disabled={pending}
        >
          Google로 계속하기
        </button>

        <p className="auth__switch">
          계정이 없나요?{" "}
          <Link to="/signup" className="auth__switch-link">
            회원가입
          </Link>
        </p>

        {/* [ACC-05] 로그인 없이 체험하기: 박스 전체가 버튼 → W04(새 상황 만들기) */}
        <button
          type="button"
          className="auth__trial"
          onClick={handleTrial}
          disabled={pending}
        >
          <span className="auth__trial-text">
            <span className="auth__trial-title">로그인 없이 체험하기</span>
            <span className="auth__trial-note">
              계산·비교는 바로 가능하고, 이 브라우저에만 저장돼요.
            </span>
          </span>
        </button>
      </section>
    </AuthLayout>
  );
}
