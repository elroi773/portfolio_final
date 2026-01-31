import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Intro from "./pages/Intro";
import Skills from "./pages/Skills"
import Profile from "./pages/Profile"
import Contact from "./pages/Contact";
import Intro2 from "./pages/Intro2";

function App() {
  return (
    <Routes>
      {/* default */}
      <Route path="/" element={<Navigate to="/index" replace />} />
      <Route path="/introo" element={<Intro /> }/>
      {/* pages */}
      <Route path="/index" element={<Index />} />
      <Route path="/intro" element={<Intro />} />

      {/* legacy / wrong navigation paths */}
      <Route path="/Intro2.jsx" element={<Navigate to="/intro2" replace />} />

      {/* catch-all */}
      <Route path="*" element={<Navigate to="/index" replace />} />

      <Route path="/skills" element={<Skills />}/>
      <Route path="/contact" element={<Contact />}/>
    </Routes>
  );
}

export default App