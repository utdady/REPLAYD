/**
 * FOLLOW THE GOAT — developer profile feature
 * When enabled: new users auto-follow the dev account; dev cannot be unfollowed.
 * Toggle via NEXT_PUBLIC_FOLLOW_THE_GOAT=true|false
 */

export const DEV_USERNAME =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_DEV_USERNAME) ||
  "addybhaskar";

export const FOLLOW_THE_GOAT_ENABLED =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_FOLLOW_THE_GOAT) === "true";

export function isDevUsername(username: string | null | undefined): boolean {
  if (!username) return false;
  return username.toLowerCase() === DEV_USERNAME.toLowerCase();
}

export function isFollowTheGoatOn(): boolean {
  return FOLLOW_THE_GOAT_ENABLED;
}
