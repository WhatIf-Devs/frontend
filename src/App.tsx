import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { FuturesListPage } from "./pages/FuturesListPage";
import { NewFuturePage } from "./pages/NewFuturePage";
import { FutureResultPage } from "./pages/FutureResultPage";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/futures" element={<FuturesListPage />} />
      <Route path="/futures/new" element={<NewFuturePage />} />
      <Route path="/futures/:id" element={<FutureResultPage />} />
    </Routes>
  );
}

export default App;
