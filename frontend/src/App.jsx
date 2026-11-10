import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import { ProtectedRoute, PublicOnlyRoute } from "./components/RouteGuards";

function AppRoutes() {
  const { token, user, signOut } = useAuth();

  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/auth" element={<AuthPage />} />
      </Route>
      <Route path="/" element={<HomePage user={user} token={token} onSignOut={signOut} />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage user={user} token={token} onSignOut={signOut} />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
