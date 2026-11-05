// Email and password rules for instant feedback in the forms. Supabase Auth enforces its own minimums too.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 72; // bcrypt only uses the first 72 bytes

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password12", "password123", "password1234", "passw0rd123",
  "qwerty123", "qwerty1234", "qwertyuiop", "qwertyuiop1", "1q2w3e4r5t", "1qaz2wsx3edc",
  "abc1234567", "abcd123456", "a1b2c3d4e5", "iloveyou123", "welcome123", "welcome1234",
  "letmein123", "admin12345", "football123", "monkey12345", "dragon12345", "sunshine123",
  "1234567890a", "a1234567890", "12345678910", "gymtracker1", "gym1234567",
]);

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export type PasswordProblem = "length" | "letters" | "digits" | "email" | "common";

export function checkPassword(password: string, email: string): PasswordProblem[] {
  const problems: PasswordProblem[] = [];
  const bytes = new TextEncoder().encode(password).length;
  if (password.length < PASSWORD_MIN || bytes > PASSWORD_MAX) problems.push("length");
  if (!/\p{L}/u.test(password)) problems.push("letters");
  if (!/\p{N}/u.test(password)) problems.push("digits");
  const local = normalizeEmail(email).split("@")[0] ?? "";
  if (local.length >= 3 && password.toLowerCase().includes(local)) problems.push("email");
  if (COMMON_PASSWORDS.has(password.toLowerCase())) problems.push("common");
  return problems;
}

/** 0–4 meter for the form. */
export function passwordScore(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= PASSWORD_MIN) score++;
  if (password.length >= 14) score++;
  if (/\p{Lu}/u.test(password) && /\p{Ll}/u.test(password)) score++;
  if (/[^\p{L}\p{N}]/u.test(password)) score++;
  if (!/\p{N}/u.test(password) || !/\p{L}/u.test(password)) score = Math.min(score, 1);
  return Math.min(4, score);
}
