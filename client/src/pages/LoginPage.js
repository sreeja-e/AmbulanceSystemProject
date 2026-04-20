import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await signIn(form, false);
      navigate(data.user.role === "DRIVER" ? "/driver" : "/user");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <main className="container form-page">
      <form className="card form-card" onSubmit={onSubmit}>
        <h2>User / Driver Login</h2>
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={onChange}
          required
        />
        {error && <p className="error">{error}</p>}
        <button className="btn">Login</button>
      </form>
    </main>
  );
}

