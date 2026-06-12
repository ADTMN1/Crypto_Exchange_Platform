import { Navigate, Route, Routes } from "react-router-dom";
import DebugPage from "../pages/DebugPage";

export default function SimpleRouter() {
  console.log('SimpleRouter rendering...');
  
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/debug" replace />} />
      <Route path="/debug" element={<DebugPage />} />
      <Route path="*" element={<div style={{padding: '2rem', color: 'white'}}>404 - Page not found</div>} />
    </Routes>
  );
}