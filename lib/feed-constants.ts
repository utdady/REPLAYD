/** Season we support in the feed for now (2024/25 only). */
export const FEED_SEASON_YEAR = 2024;

/** Map UI chip label to DB competition code for filtering. */
export const CHIP_TO_CODE: Record<string, string> = {
  All: "",
  EPL: "PL",
  UCL: "CL",
  "La Liga": "PD",
  BL: "BL1",
  "Serie A": "SA",
  L1: "FL1",
};
