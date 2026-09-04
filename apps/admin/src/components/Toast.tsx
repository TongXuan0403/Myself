import { Check } from "lucide-react";

type ToastProps = {
  message: string;
  visible: boolean;
};

export function Toast({ message, visible }: ToastProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="toast">
      <Check size={16} />
      {message}
    </div>
  );
}
