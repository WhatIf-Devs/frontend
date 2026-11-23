import { useEffect, useRef, useState, type ReactNode } from "react";
import brandWordmark from "../assets/login/brand-wordmark.svg";
import logoWordmark from "../assets/login/logo-wordmark.svg";

// W01 로그인 · W02 회원가입 공용 레이아웃
// - 배경: 천천히 움직이는 그라데이션 + 실시간으로 그려지는 예시 자산 그래프
// - PC(768px 이상): 배경 위 오른쪽에 반투명 유리 카드(children)
// - 모바일: 인트로 애니메이션 → 하얀 로그인 화면이 아래에서 올라옴 (스크롤 없음)
// 사용법: <AuthLayout> 로그인 카드 내용 </AuthLayout>

// ---------- 예시 데이터 (기능명세서 예시: 2026.11 시작, 500만원, 월 50만원, 목표 유럽 여행 1,000만원) ----------
const SERIES = [500, 550, 600, 750, 800, 850, 750, 800, 850, 900, 950, 1000, 1050];
const GOAL = 1000;
const EVENTS = [
  { index: 3, label: "성과급 +100", kind: "income" },
  { index: 6, label: "노트북 −150", kind: "expense" },
] as const;
const MONTH_LABELS = [
  { index: 0, label: "2026.11" },
  { index: 3, label: "2027.02" },
  { index: 6, label: "2027.05" },
  { index: 9, label: "2027.08" },
  { index: 12, label: "2027.11" },
];
const LAST = SERIES.length - 1;
const GOAL_INDEX = SERIES.findIndex((v) => v >= GOAL); // 목표에 처음 닿는 달
const Y_MIN = 400;
const Y_MAX = 1150;

// ---------- 애니메이션 타이밍 (ms) ----------
// PC와 모바일 모두 같은 속도 (모바일 기준)
const START_DELAY = 900; // 시작점이 반짝이는 시간
const DRAW_TIME = 3000; // 그래프가 그려지는 시간
const FORM_DELAY = 1000; // (모바일) 다 그려진 뒤 로그인 화면으로 넘어가기까지
const SEEN_KEY = "whatif:auth-intro-seen"; // 이번 탭에서 인트로를 이미 봤는지
const MOBILE_QUERY = "(max-width: 767px)";

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const formatMan = (v: number) => `${Math.round(v).toLocaleString("ko-KR")}만원`;

// 진행률(0~1) → 그 시점의 값 (점과 점 사이는 직선으로 이어 계산)
const valueAtProgress = (p: number) => {
  const pos = p * LAST;
  const i = Math.min(Math.floor(pos), LAST - 1);
  return SERIES[i] + (SERIES[i + 1] - SERIES[i]) * (pos - i);
};

// ---------- 그래프 좌표계: PC는 가로로 넓게, 모바일은 덜 넓게 (글자가 작아지지 않도록) ----------
type Size = { w: number; h: number; pad: { top: number; right: number; bottom: number; left: number } };
const DESKTOP_SIZE: Size = { w: 720, h: 340, pad: { top: 56, right: 96, bottom: 44, left: 12 } };
const MOBILE_SIZE: Size = { w: 400, h: 300, pad: { top: 52, right: 78, bottom: 40, left: 10 } };

function makeGeometry({ w, h, pad }: Size) {
  const xAt = (index: number) => pad.left + (index / LAST) * (w - pad.left - pad.right);
  const yAt = (value: number) =>
    pad.top + (1 - (value - Y_MIN) / (Y_MAX - Y_MIN)) * (h - pad.top - pad.bottom);
  const linePath = SERIES.map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i)} ${yAt(v)}`).join(" ");
  const bottom = h - pad.bottom;
  return {
    w,
    h,
    pad,
    xAt,
    yAt,
    linePath,
    areaPath: `${linePath} L${xAt(LAST)} ${bottom} L${xAt(0)} ${bottom} Z`,
    bottom,
    goalY: yAt(GOAL),
  };
}

// ---------- 인트로를 건너뛸지 (처음 한 번만 계산) ----------
// - 움직임 줄이기 설정을 켠 사용자
// - 모바일에서 이번 탭에 이미 인트로를 본 경우 (PC는 들어올 때마다 애니메이션)
// 개발·시연용: 주소 끝에 ?intro 를 붙이면 이미 봤어도 인트로를 다시 보여 줌 (예: /login?intro)
function shouldSkipIntro() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const forceIntro = new URLSearchParams(window.location.search).has("intro");
  if (forceIntro) return reduceMotion;
  const isMobile = window.matchMedia(MOBILE_QUERY).matches;
  let seen = false;
  try {
    seen = sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // 저장소를 못 쓰는 환경이면 그냥 인트로를 보여 줌
  }
  return reduceMotion || (isMobile && seen);
}

function rememberIntroSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // 무시
  }
}

// 화면이 모바일 폭인지 (창 크기를 바꾸면 따라 바뀜)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

type Phase = "intro" | "form";

export function AuthLayout({ children }: { children: ReactNode }) {
  // useState(함수): 처음 화면을 그릴 때 딱 한 번만 계산
  const [skip] = useState(shouldSkipIntro);
  const [phase, setPhase] = useState<Phase>(skip ? "form" : "intro");
  const [done, setDone] = useState(skip);
  const isMobile = useIsMobile();

  // 모바일: 그래프가 다 그려지고 잠시 뒤 로그인 화면으로 전환
  useEffect(() => {
    if (skip) return;
    const timer = window.setTimeout(() => {
      setPhase("form");
      rememberIntroSeen();
    }, START_DELAY + DRAW_TIME + FORM_DELAY);
    return () => window.clearTimeout(timer);
  }, [skip]);

  const skipIntro = () => {
    setPhase("form");
    rememberIntroSeen();
  };

  return (
    <div className="auth" data-phase={phase} data-done={done}>
      {/* 1) 천천히 흐르는 그라데이션 배경 */}
      <div className="auth__bg" aria-hidden="true">
        <span className="auth__flow" />
        <span className="auth__grid" />
      </div>

      <div className="auth__stage">
        {/* 2) 왼쪽(모바일은 인트로): 소개 + 실시간 그래프 */}
        <section className="auth__hero">
          <div className="auth__hero-text">
            <img className="auth__brand" src={brandWordmark} width={203} height={56} alt="What If?" />
            <h1 className="auth__headline">
              내 손 안에 가장 쉬운 <br className="auth__br-mobile" />
              자산 시뮬레이터
            </h1>
            <p className="auth__desc">
              계좌 연동 없이, 대략 아는 숫자만으로 미래 자산을 시뮬레이션해요.
            </p>
          </div>

          <div className="auth__chart-wrap">
            {/* key가 바뀌면(PC↔모바일) 그래프를 새로 그림 */}
            <AuthChart
              key={isMobile ? "mobile" : "desktop"}
              size={isMobile ? MOBILE_SIZE : DESKTOP_SIZE}
              animate={!skip}
              onDone={() => setDone(true)}
            />
          </div>
        </section>

        {/* 3) 로그인·회원가입 카드 (PC: 유리 카드 / 모바일: 아래에서 올라오는 흰 화면) */}
        <div className="auth__panel">
          <img className="auth__panel-logo" src={logoWordmark} width={105} height={27} alt="What If?" />
          {children}
        </div>
      </div>

      {/* 모바일 인트로 건너뛰기 */}
      {phase === "intro" && (
        <button type="button" className="auth__skip" onClick={skipIntro}>
          건너뛰기
        </button>
      )}
    </div>
  );
}

// =========================================================
// 실시간으로 그려지는 자산 그래프 (SVG)
// =========================================================
function AuthChart({
  size,
  animate,
  onDone,
}: {
  size: Size;
  animate: boolean;
  onDone: () => void;
}) {
  const [geo] = useState(() => makeGeometry(size));
  const [eventsShown, setEventsShown] = useState(animate ? 0 : EVENTS.length); // 지나간 이벤트 개수
  const [goalReached, setGoalReached] = useState(!animate);

  // 매 프레임 바뀌는 값은 state 대신 ref로 직접 바꿔서 화면을 가볍게 유지
  const revealRef = useRef<SVGRectElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const valueRef = useRef<SVGTextElement>(null);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    // 그래프를 진행률 p(0~1)만큼 그리기 → 지금 머리가 몇 번째 달 위치인지 돌려줌
    const draw = (p: number) => {
      const x = geo.xAt(p * LAST);
      const value = valueAtProgress(p);
      revealRef.current?.setAttribute("width", String(x + 2));
      headRef.current?.setAttribute("transform", `translate(${x} ${geo.yAt(value)})`);
      if (valueRef.current) valueRef.current.textContent = formatMan(value);
      return p * LAST;
    };

    if (!animate) {
      draw(1); // 완성된 그래프만 그리고 끝
      return;
    }

    draw(0);
    let raf = 0;
    let shownEvents = 0;
    let reached = false;
    const startAt = performance.now() + START_DELAY;

    const tick = (now: number) => {
      const t = Math.min(Math.max((now - startAt) / DRAW_TIME, 0), 1);
      const pos = draw(easeInOut(t));
      // 그래프 머리가 이벤트·목표 지점을 지나가는 순간에만 state를 바꿈
      const passed = EVENTS.filter((e) => pos >= e.index).length;
      if (passed !== shownEvents) {
        shownEvents = passed;
        setEventsShown(passed);
      }
      if (!reached && pos >= GOAL_INDEX) {
        reached = true;
        setGoalReached(true);
      }
      if (t < 1) raf = requestAnimationFrame(tick);
      else onDoneRef.current();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, geo]);

  const { w, h, pad, xAt, yAt, goalY } = geo;

  return (
    <svg
      className="auth__chart"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="예시 그래프: 2026년 11월 500만원에서 시작해 성과급 +100만원, 노트북 −150만원을 지나 2027년 10월에 유럽 여행 목표 1,000만원을 넘어요."
    >
      <defs>
        <linearGradient id="auth-line-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#9ec9ff" />
          <stop offset="100%" stopColor="#6ef2c0" />
        </linearGradient>
        <linearGradient id="auth-area-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6ef2c0" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#6ef2c0" stopOpacity="0" />
        </linearGradient>
        {/* 이 사각형의 폭을 0 → 끝까지 늘리면서 그래프를 왼쪽부터 보여 줌 */}
        <clipPath id="auth-reveal">
          <rect ref={revealRef} x="0" y="0" width="0" height={h} />
        </clipPath>
        <filter id="auth-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* 가로 기준선 */}
      <g className="auth__gridlines">
        {[600, 800].map((v) => (
          <line key={v} x1={pad.left} x2={w - pad.right} y1={yAt(v)} y2={yAt(v)} />
        ))}
        <line x1={pad.left} x2={w - pad.right} y1={geo.bottom} y2={geo.bottom} />
      </g>

      {/* 목표선: 왼쪽부터 그어지고, 돌파하면 민트색으로 */}
      <g className={`auth__goal${goalReached ? " is-reached" : ""}`}>
        <line className="auth__goal-line" x1={pad.left} x2={w - pad.right} y1={goalY} y2={goalY} />
        <text className="auth__goal-label" x={pad.left + 2} y={goalY - 10}>
          유럽 여행 1,000만원
        </text>
      </g>

      {/* 자산 그래프 (면 + 빛 번짐 + 선) */}
      <g clipPath="url(#auth-reveal)">
        <path className="auth__area" d={geo.areaPath} fill="url(#auth-area-grad)" />
        <path className="auth__line-glow" d={geo.linePath} filter="url(#auth-glow)" />
        <path className="auth__line" d={geo.linePath} stroke="url(#auth-line-grad)" />
      </g>

      {/* 시작점: 반짝이는 점 */}
      <g transform={`translate(${xAt(0)} ${yAt(SERIES[0])})`}>
        <circle className="auth__start-ring" r="14" />
        <circle className="auth__start-dot" r="5" />
      </g>

      {/* 이벤트 표시: 그래프 머리가 지나가면 톡 나타남
          (위치는 바깥 g의 transform, 등장 효과는 안쪽 g의 CSS로 나눠야 서로 덮어쓰지 않음) */}
      {EVENTS.map((e, i) => {
        const above = e.kind === "income";
        return (
          <g key={e.label} transform={`translate(${xAt(e.index)} ${yAt(SERIES[e.index])})`}>
            <g className={`auth__event auth__event--${e.kind}${i < eventsShown ? " is-visible" : ""}`}>
              <circle className="auth__event-dot" r="5" />
              <g transform={`translate(0 ${above ? -28 : 30})`}>
                <g className="auth__event-tag">
                  <rect className="auth__event-pill" x="-46" y="-13" width="92" height="26" rx="13" />
                  <text className="auth__event-text" y="4">
                    {e.label}
                  </text>
                </g>
              </g>
            </g>
          </g>
        );
      })}

      {/* 목표 돌파 순간: 퍼지는 링 + "목표 달성" 배지 */}
      <g transform={`translate(${xAt(GOAL_INDEX)} ${goalY})`}>
        <g className={`auth__burst${goalReached ? " is-visible" : ""}`}>
          <circle className="auth__burst-ring" r="10" />
          <circle className="auth__burst-ring auth__burst-ring--late" r="10" />
          <g transform="translate(-46 32)">
            <g className="auth__badge-wrap">
              <rect className="auth__badge" x="-42" y="-13" width="84" height="26" rx="13" />
              <text className="auth__badge-text" y="4">
                목표 달성
              </text>
            </g>
          </g>
        </g>
      </g>

      {/* 그래프 머리: 빛나는 점 + 실시간 금액 */}
      <g ref={headRef} transform={`translate(${xAt(0)} ${yAt(SERIES[0])})`}>
        <circle className="auth__head-halo" r="16" />
        <circle className="auth__head-dot" r="6" />
        <g transform="translate(12 -30)">
          <rect className="auth__head-pill" x="0" y="-14" width="86" height="26" rx="13" />
          <text ref={valueRef} className="auth__head-text" x="43" y="4">
            500만원
          </text>
        </g>
      </g>

      {/* 아래 달 표시 */}
      <g className="auth__months">
        {MONTH_LABELS.map((m) => (
          <text key={m.label} x={xAt(m.index)} y={h - 12}>
            {m.label}
          </text>
        ))}
      </g>
    </svg>
  );
}
