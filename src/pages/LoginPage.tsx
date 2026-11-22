import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginWithEmail, loginWithGoogle } from "../api/auth";
import "./auth.css";
// 피그마에서 내려받은 이미지 (src/assets/login/)
import brandWordmark from "../assets/login/brand-wordmark.svg";
import loginChart from "../assets/login/login-chart.svg";

// W01 · 로그인 (첫 화면) — 피그마 node 33:391
// PC(768px 이상): 왼쪽 서비스 소개 + 오른쪽 로그인 카드 2열
// 모바일(768px 미만): 위아래 1열 (배치는 auth.css에서)

// 실패 문구 (기능명세서 ACC-02·03, 정책표 13장)
// 보안을 위해 이메일이 틀렸는지 비밀번호가 틀렸는지는 구분해서 알려주지 않음
const EMAIL_LOGIN_ERROR = "이메일 또는 비밀번호를 확인해 주세요.";
const GOOGLE_LOGIN_ERROR = "로그인하지 못했어요. 다시 시도해 주세요.";

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
      setError(EMAIL_LOGIN_ERROR); // 입력값은 그대로 남겨 둠
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle();
      navigate("/futures");
    } catch {
      // TODO: 토스트 컴포넌트가 생기면 토스트로 바꾸기 (ACC-03)
      setError(GOOGLE_LOGIN_ERROR);
    }
  };

  return (
    <div className="auth">
      {/* 상단 로고 헤더 없음: 왼쪽 소개 카드에 로고가 있어 중복이라 제거 (2026-11-23 결정) */}
      <main className="auth__body">
        {/* [ACC-01] 왼쪽: 서비스 소개 (어두운 그라데이션 카드) */}
        <section className="auth__intro">
          <div className="auth__intro-text">
            <img
              className="auth__brand"
              src={brandWordmark}
              width={203}
              height={56}
              alt="What If?"
            />
            <h1 className="auth__headline">
              내 손 안에 가장 쉬운 <br className="auth__br-mobile" />
              자산 시뮬레이터
            </h1>
            <p className="auth__desc">
              계좌 연동 없이, 대략 아는 숫자만으로 미래 자산을 시뮬레이션해요.
            </p>
          </div>
          {/* 예시 그래프는 고정 이미지 (ACC-01) */}
          <img
            className="auth__chart"
            src={loginChart}
            width={660}
            height={314}
            alt="예시 그래프: 2026년 11월부터 자산이 늘어 유럽 여행 목표 1,000만원에 다가가요. 성과급 +100만원, 노트북 −150만원이 표시돼 있어요."
          />
        </section>

        {/* 오른쪽: 로그인 카드 */}
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
              로그인
            </button>
          </form>

          <div className="auth__divider">
            <span>또는</span>
          </div>

          <button
            type="button"
            className="auth__button auth__button--ghost"
            onClick={handleGoogleLogin}
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
            onClick={() => navigate("/futures/new")}
          >
            <span className="auth__trial-title">로그인 없이 체험하기</span>
            <span className="auth__trial-note">
              계산·비교는 바로 가능하고, 이 브라우저에만 저장돼요.
            </span>
          </button>
        </section>
      </main>
    </div>
  );
}
