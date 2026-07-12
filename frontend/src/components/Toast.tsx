interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div className="toast">
      <span className="pulse-dot" />
      <span>{message}</span>
    </div>
  );
}
