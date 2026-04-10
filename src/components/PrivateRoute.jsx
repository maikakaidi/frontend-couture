import { Navigate, useLocation } from "react-router-dom";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    // Redirige vers login et garde l'URL tentée
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default PrivateRoute;
