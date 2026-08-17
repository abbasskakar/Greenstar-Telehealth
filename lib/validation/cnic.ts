import { z } from "zod";

/** 13-digit CNIC, digits only (dashes stripped). */
export const cnicSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 13, {
    message: "CNIC must be exactly 13 digits",
  });

/** Format 1234512345671 -> 12345-1234567-1 for display. */
export function formatCnic(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 13);
  const a = d.slice(0, 5);
  const b = d.slice(5, 12);
  const c = d.slice(12, 13);
  return [a, b, c].filter(Boolean).join("-");
}

export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/[^\d+]/g, ""))
  .refine((v) => v.length >= 10, { message: "Enter a valid phone number" });
