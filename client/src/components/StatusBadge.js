export default function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const cls =
    normalized === "completed"
      ? "status completed"
      : normalized === "accepted"
      ? "status accepted"
      : normalized === "rejected"
      ? "status rejected"
      : "status pending";

  return <span className={cls}>{status}</span>;
}

