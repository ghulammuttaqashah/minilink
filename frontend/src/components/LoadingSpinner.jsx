export default function LoadingSpinner({ label = "Loading", size = "md" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${
        size === "sm" ? "h-3.5 w-3.5" : "h-7 w-7 text-lime-300"
      }`}
      role="status"
      aria-label={label}
    />
  );
}
