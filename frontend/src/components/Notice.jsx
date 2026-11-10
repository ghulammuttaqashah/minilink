export default function Notice({ message, type = "error" }) {
  if (!message) return null;

  return (
    <p className={`notice notice-${type}`} role={type === "error" ? "alert" : "status"}>
      <span className="notice-icon" aria-hidden="true">
        {type === "error" ? "!" : "✓"}
      </span>
      {message}
    </p>
  );
}
