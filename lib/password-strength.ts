export function getPasswordStrength(password: string): { score: number; label: string } {
  if (!password || password.length === 0) {
    return { score: 0, label: "" };
  }

  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Cap at 5 for display (we'll use 4 segments: 0-4)
  const cappedScore = Math.min(score, 4);

  const labels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  return {
    score: cappedScore,
    label: labels[cappedScore],
  };
}
