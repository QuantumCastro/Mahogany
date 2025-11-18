import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) {
    return "—";
  }
  return value.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function isFocusableElement(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;
  const focusableSelectors = ["input", "textarea", "button", "select"];
  if (focusableSelectors.some((selector) => target.closest(selector))) return true;
  if (target.getAttribute("contenteditable") === "true") return true;
  return target.tagName === "A" && target.hasAttribute("href");
}
