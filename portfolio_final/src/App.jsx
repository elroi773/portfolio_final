import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Intro from "./pages/Intro";
import Skills from "./pages/Skills"
import Profile from "./pages/Profile"
function App() {
  return (
    <Routes>
      {/* default */}
      <Route path="/" element={<Navigate to="/index" replace />} />

      {/* pages */}
      <Route path="/index" element={<Index />} />
      <Route path="/intro" element={<Intro />} />

      {/* legacy / wrong navigation paths */}
      <Route path="/Intro.jsx" element={<Navigate to="/intro" replace />} />

      {/* catch-all */}
      <Route path="*" element={<Navigate to="/index" replace />} />

      <Route path="/skills" element={<Skills />}/>
    </Routes>
  );
}

export default App
