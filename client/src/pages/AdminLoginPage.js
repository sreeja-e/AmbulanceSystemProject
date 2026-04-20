import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await signIn(form, true);
      if (data.user.role !== "ADMIN") throw new Error("Invalid admin account");
      navigate("/admin");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Admin login failed");
    }
  };

  return (
    <main className="container form-page">
      <form className="card form-card" onSubmit={onSubmit}>
        <h2>Admin Login</h2>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
          placeholder="Admin email"
          required
        />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
          placeholder="Password"
          required
        />
        {error && <p className="error">{error}</p>}
        <button className="btn">Login as Admin</button>
      </form>
    </main>
  );
}

