/** Toast notification variant. */
export enum ToastVariant {
  Success = 'success',
  Error = 'error',
  Info = 'info',
}

/** A single toast notification. */
export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly variant: ToastVariant;
  readonly duration: number;
}

/** Default auto-dismiss duration in milliseconds. */
export const DEFAULT_TOAST_DURATION = 3000;

let nextId = 1;
let toasts = $state<Toast[]>([]);
const timers = new Map<number, ReturnType<typeof setTimeout>>();

/** Returns the current list of active toasts. */
export function getToasts(): readonly Toast[] {
  return toasts;
}

/**
 * Adds a toast notification. Returns the toast id.
 * The toast auto-dismisses after the specified duration.
 */
export function addToast(
  message: string,
  variant: ToastVariant,
  duration: number = DEFAULT_TOAST_DURATION,
): number {
  const id = nextId++;
  const toast: Toast = { id, message, variant, duration };
  toasts = [...toasts, toast];

  const timer = setTimeout(() => {
    dismissToast(id);
  }, duration);
  timers.set(id, timer);

  return id;
}

/** Dismisses a toast by id. */
export function dismissToast(id: number): void {
  const timer = timers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(id);
  }
  toasts = toasts.filter((t) => t.id !== id);
}

/** Convenience: show a success toast. */
export function toastSuccess(message: string, duration?: number): number {
  return addToast(message, ToastVariant.Success, duration);
}

/** Convenience: show an error toast. */
export function toastError(message: string, duration?: number): number {
  return addToast(message, ToastVariant.Error, duration);
}

/** Convenience: show an info toast. */
export function toastInfo(message: string, duration?: number): number {
  return addToast(message, ToastVariant.Info, duration);
}

/** Clears all toasts and timers. For testing only. */
export function clearAllToasts(): void {
  for (const timer of timers.values()) {
    clearTimeout(timer);
  }
  timers.clear();
  toasts = [];
  nextId = 1;
}
