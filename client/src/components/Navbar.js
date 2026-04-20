import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand">
          Unified Ambulance System
        </Link>
        <nav className="nav-links">
          {!isAuthenticated ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
              <Link to="/admin-login">Admin</Link>
            </>
          ) : (
            <>
              <span className="role-pill">{user?.role}</span>
              <Link to={user?.role === "USER" ? "/user" : user?.role === "DRIVER" ? "/driver" : "/admin"}>
                Dashboard
              </Link>
              {user?.role === "USER" && <Link to="/request">Request Ambulance</Link>}
              <button className="btn small danger" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

