import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { FuturesListPage } from "./pages/FuturesListPage";
import { NewFuturePage } from "./pages/NewFuturePage";
import { FutureResultPage } from "./pages/FutureResultPage";
import { SavePage } from "./pages/SavePage";
import { useAuth } from "./state/auth";
import "./App.css";

function App() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* 첫 화면: 로그인 상태면 W03(내 미래), 아니면 W01(로그인). 헤더 로고도 여기로 와요 */}
      <Route path="/" element={<Navigate to={user ? "/futures" : "/login"} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/futures" element={<FuturesListPage />} />
      <Route path="/futures/new" element={<NewFuturePage />} />
      {/* 저장된 상황 열기 (W03 '열기') → 결과 화면 */}
      <Route path="/futures/:id" element={<FutureResultPage />} />
      {/* 입력을 마친 직후의 결과 화면 (아직 저장 전, sessionStorage의 현재 상황을 보여줌) */}
      <Route path="/result" element={<FutureResultPage />} />
      {/* W10 상황 저장 */}
      <Route path="/save" element={<SavePage />} />
    </Routes>
  );
}

export default App;
