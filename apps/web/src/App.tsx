import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Dashboard";
import Landing from "./pages/Landing";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout/>}>
            <Route path="/Dashboard" element={<Home />} />
          </Route> 
        </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
