"use client";

import { StarRating } from "@/components/ui/star-rating";

export interface RatingStarsProps {
  value: number | null;
  onChange: (value: number | null) => void;
  size?: "sm" | "md" | "lg";
}

export function RatingStars({ value, onChange, size = "md" }: RatingStarsProps) {
  return <StarRating value={value} onChange={onChange} size={size} />;
}
