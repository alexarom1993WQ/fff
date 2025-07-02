import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format numbers to French locale
export function formatNumber(num: number): string {
  // Ensure the number is valid and not NaN
  if (isNaN(num) || !isFinite(num) || num === null || num === undefined) {
    return "0";
  }
  // Ensure we're working with a valid number
  const validNum = Number(num);
  if (isNaN(validNum) || !isFinite(validNum)) {
    return "0";
  }
  return new Intl.NumberFormat("fr-FR").format(Math.round(validNum));
}

// Format dates to French locale
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dateObj);
}

// Format date and time to French locale
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}
