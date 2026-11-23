import { useLayoutEffect, useRef, useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { signupWithEmail } from "../api/auth";
import { AuthLayout } from "./AuthLayout";
import { toSessionUser, useAuth } from "../state/auth";
import "./auth.css";

// W02 · 회원가입 (기능명세서 ACC-06~10, 정책표 2장·13장)
// 배경(움직이는 그라데이션 + 실시간 그래프)과 배치는 AuthLayout이 담당하고,
// 이 파일은 회원가입 카드 안의 내용과 입력 검사만 담당해요.

// ---------- 입력 규칙 (정책표 2장) ----------
const NICKNAME_MIN = 2;
const NICKNAME_MAX = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/; // W01 로그인과 같은 규칙
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/; // 8자 이상 + 영문 1개 이상 + 숫자 1개 이상

// ---------- 문구 ----------
// 칸별 오류 문구는 정책표에 따로 없어서 제안 문구예요. ("{항목}을 입력해 주세요."는 정책표 16장)
const SIGNUP_ERROR = "가입하지 못했어요. 다시 시도해 주세요.";

type Field = "nickname" | "email" | "password" | "passwordConfirm";

// 값 → 오류 문구 (문제가 없으면 null)
function validate(field: Field, values: Record<Field, string>): string | null {
  const value = values[field];
  switch (field) {
    case "nickname": {
      const length = value.trim().length;
      if (length === 0) return "닉네임을 입력해 주세요.";
      if (length < NICKNAME_MIN || length > NICKNAME_MAX) {
        return `닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}자로 입력해 주세요.`;
      }
      return null;
    }
    case "email":
      if (value.trim() === "") return "이메일을 입력해 주세요.";
      if (!EMAIL_PATTERN.test(value.trim())) return "이메일 형식을 확인해 주세요.";
      return null;
    case "password":
      if (value === "") return "비밀번호를 입력해 주세요.";
      if (!PASSWORD_PATTERN.test(value)) return "8자 이상, 영문과 숫자를 함께 넣어 주세요.";
      return null;
    case "passwordConfirm":
      if (value === "") return "비밀번호를 한 번 더 입력해 주세요.";
      if (value !== values.password) return "비밀번호가 일치하지 않아요.";
      return null;
  }
}

const FIELDS: Field[] = ["nickname", "email", "password", "passwordConfirm"];

export function SignupPage() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [values, setValues] = useState<Record<Field, string>>({
    nickname: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  // 한 번이라도 칸을 벗어난(blur) 적이 있는지 → 그때부터 오류를 보여 줌 (ACC-07)
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    nickname: false,
    email: false,
    password: false,
    passwordConfirm: false,
  });
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false); // 이미 가입된 이메일 (서버 응답)
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // 지금 이 화면에 있는지. 가입 응답을 기다리는 사이 로그인 등 다른 화면으로 떠났다면
  // 늦게 도착한 응답은 무시해요 (CodeRabbit 리뷰 반영)
  // useRef: 값이 바뀌어도 화면을 다시 그리지 않는 "메모 칸"
  const onPageRef = useRef(true);
  // useLayoutEffect: 화면이 바뀌는 그 순간 바로 실행돼요
  // (useEffect는 화면이 바뀐 뒤 조금 늦게 실행돼서, 그 틈에 응답이 오면 못 막을 수 있음)
  useLayoutEffect(() => {
    onPageRef.current = true; // 화면에 나타남
    return () => {
      onPageRef.current = false; // 화면에서 사라짐 (다른 페이지로 이동)
    };
  }, []);

  // 칸마다 지금 오류가 있는지 계산 (화면에 보여 줄지는 touched로 결정)
  const errors = Object.fromEntries(FIELDS.map((f) => [f, validate(f, values)])) as Record<
    Field,
    string | null
  >;
  const allValid = FIELDS.every((f) => errors[f] === null) && !emailTaken;
  // [ACC-09] 4칸이 모두 맞고 약관에 체크했을 때만 가입 버튼 활성
  const canSubmit = allValid && agreed && !submitting;

  const update = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    setSubmitError(null); // 입력을 고치면 이전 가입 실패 문구는 지움 (CodeRabbit 리뷰 반영)
    if (field === "email") setEmailTaken(false); // 이메일을 고치면 "이미 가입" 안내도 지움
  };
  const markTouched = (field: Field) => () => setTouched((prev) => ({ ...prev, [field]: true }));

  // 화면에 보여 줄 오류: 칸을 한 번 벗어난 뒤에만
  const shownError = (field: Field) => (touched[field] ? errors[field] : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      // TODO(feature/auth-api): 닉네임도 함께 저장하기 (Firebase 연결 시 api/auth.ts에서 처리)
      const account = await signupWithEmail({ email: values.email.trim(), password: values.password });
      if (!onPageRef.current) return; // 이미 화면을 떠났으면 무시
      signIn(toSessionUser(account, values.nickname)); // 가입 완료 → 자동 로그인 (입력한 닉네임으로)
      navigate("/futures"); // → W03
    } catch (err) {
      if (!onPageRef.current) return;
      // Firebase는 이미 가입된 이메일이면 code "auth/email-already-in-use"를 돌려줌
      const code = (err as { code?: string } | null)?.code;
      if (code === "auth/email-already-in-use") {
        setEmailTaken(true);
        setTouched((prev) => ({ ...prev, email: true }));
      } else {
        setSubmitError(SIGNUP_ERROR);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 칸 하나 (라벨 + 입력 + 아래 오류 문구)
  const fieldProps = (field: Field) => {
    const error = shownError(field);
    return {
      id: `signup-${field}`,
      className: `auth__input${error ? " auth__input--invalid" : ""}`,
      value: values[field],
      onChange: update(field),
      onBlur: markTouched(field),
      required: true, // 필수 입력임을 화면 읽기 프로그램에도 알림 (form의 noValidate 때문에 브라우저 기본 경고는 안 뜸)
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `signup-${field}-error` : undefined,
    };
  };
  const errorText = (field: Field) => {
    const error = shownError(field);
    return error ? (
      <p id={`signup-${field}-error`} className="auth__field-error">
        {error}
      </p>
    ) : null;
  };

  // 이미 로그인한 사람은 회원가입 화면을 보지 않고 바로 W03(내 미래)으로
  if (user) return <Navigate to="/futures" replace />;

  return (
    <AuthLayout>
      <section className="auth__card auth__card--signup">
        <h2 className="auth__title">회원가입</h2>
        <p className="auth__subtitle">이메일로 가입하고 내 미래를 저장하세요.</p>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          {/* [ACC-07] 입력 4칸: 칸을 벗어날 때 검사 */}
          <div className="auth__field">
            <label className="auth__label" htmlFor="signup-nickname">
              닉네임
            </label>
            <input {...fieldProps("nickname")} type="text" placeholder="2~12자" autoComplete="nickname" />
            {errorText("nickname")}
          </div>

          <div className="auth__field">
            <label className="auth__label" htmlFor="signup-email">
              이메일
            </label>
            <input
              {...fieldProps("email")}
              className={`auth__input${shownError("email") || emailTaken ? " auth__input--invalid" : ""}`}
              aria-invalid={shownError("email") || emailTaken ? true : undefined}
              aria-describedby={
                shownError("email") || emailTaken ? "signup-email-error" : undefined
              }
              type="email"
              placeholder="dayeon@example.com"
              autoComplete="email"
            />
            {emailTaken ? (
              // 정책표 13장: 이미 가입된 이메일이면 로그인 안내
              <p id="signup-email-error" className="auth__field-error">
                이미 가입된 이메일이에요.{" "}
                <Link to="/login" className="auth__field-error-link">
                  로그인하기
                </Link>
              </p>
            ) : (
              errorText("email")
            )}
          </div>

          <div className="auth__field">
            <label className="auth__label" htmlFor="signup-password">
              비밀번호
            </label>
            <div className="auth__password">
              <input
                {...fieldProps("password")}
                type={showPassword ? "text" : "password"}
                placeholder="8자 이상, 영문·숫자 포함"
                autoComplete="new-password"
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
            {errorText("password")}
          </div>

          <div className="auth__field">
            <label className="auth__label" htmlFor="signup-passwordConfirm">
              비밀번호 확인
            </label>
            <div className="auth__password">
              <input
                {...fieldProps("passwordConfirm")}
                type={showConfirm ? "text" : "password"}
                placeholder="한 번 더 입력"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth__toggle"
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={showConfirm ? "비밀번호 확인 숨기기" : "비밀번호 확인 보기"}
                aria-pressed={showConfirm}
              >
                {showConfirm ? "숨기기" : "보기"}
              </button>
            </div>
            {errorText("passwordConfirm")}
          </div>

          {/* [ACC-08] 필수 약관 동의 */}
          <div className="auth__agree">
            <label className="auth__check">
              <input
                type="checkbox"
                className="auth__check-input"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  setSubmitError(null);
                }}
                required
              />
              <span className="auth__check-box" aria-hidden="true" />
              <span className="auth__check-label">
                [필수] 서비스 이용약관 및 개인정보 수집·이용 동의
              </span>
            </label>
            <p className="auth__notice">
              입력한 금액은 계획 계산과 저장에만 쓰여요. 계좌·실명 정보는 받지 않아요.
            </p>
          </div>

          {/* [ACC-09] 서버 오류는 버튼 위에 */}
          {submitError && (
            <p className="auth__error" role="alert">
              {submitError}
            </p>
          )}

          <button type="submit" className="auth__button auth__button--primary" disabled={!canSubmit}>
            {submitting ? "가입하는 중…" : "가입하고 시작하기"}
          </button>
        </form>

        {/* [ACC-10] 로그인으로 */}
        <p className="auth__switch">
          이미 계정이 있나요?{" "}
          <Link to="/login" className="auth__switch-link">
            로그인
          </Link>
        </p>
      </section>
    </AuthLayout>
  );
}
