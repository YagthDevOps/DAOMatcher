import { Navigate, useLocation } from "react-router-dom";
import { CONSTANTS } from "@/config/default";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { selectToken } from "@/redux/userSlice";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { pathname } = useLocation();
  const isPrivateRoute = CONSTANTS.PRIVATE_ROUTES.includes(pathname);
  const token = useSelector((state: RootState) => selectToken(state));

  if (isPrivateRoute && !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AuthGuard;
