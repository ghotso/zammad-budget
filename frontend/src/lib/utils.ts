import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(minutes: number): string {
  const isNegative = minutes < 0;
  const absoluteMinutes = Math.abs(minutes);

  const days = Math.floor(absoluteMinutes / (24 * 60));
  const hours = Math.floor((absoluteMinutes % (24 * 60)) / 60);
  const remainingMinutes = absoluteMinutes % 60;

  const parts = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0 || days > 0) {
    parts.push(`${hours}h`);
  }
  if (remainingMinutes > 0 || (days === 0 && hours === 0)) {
    parts.push(`${remainingMinutes}m`);
  }

  const formattedTime = parts.join(' ');
  return isNegative ? `-${formattedTime}` : formattedTime;
}