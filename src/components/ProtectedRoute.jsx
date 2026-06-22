import { useLocation, useNavigate } from 'react-router-dom';
import { canAccess } from "../lib/authConfig";
import { useUser } from '../context/userContext';

export default function ProtectedRoute({ children }) {
  const { user, role, authorized, loading } = useUser();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    if (!sessionStorage.getItem('auto_reloaded')) {
      sessionStorage.setItem('auto_reloaded', '1');
      window.location.reload();
    } else {
      sessionStorage.removeItem('auto_reloaded');
    }
    return null;
  }

  if (!authorized) return null;

  if (!canAccess(role, location.pathname)) return null;

  return children;
}