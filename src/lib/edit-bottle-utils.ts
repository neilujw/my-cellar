import type { Bottle } from './types';

/** Validates that rating is empty or between 1 and 10. Returns error message or empty string. */
export function validateRating(rating: string): string {
  if (rating === '') return '';
  const num = Number(rating);
  if (Number.isNaN(num) || num < 1 || num > 10) {
    return 'Rating must be between 1 and 10';
  }
  return '';
}

/** Builds an updated Bottle from the original and edited field values. */
export function buildUpdatedBottle(
  original: Bottle,
  fields: {
    rating: string;
    notes: string;
    location: string;
    country: string;
    region: string;
    grapeVariety: readonly string[];
  },
): Bottle {
  return {
    ...original,
    rating: fields.rating !== '' ? Number(fields.rating) : undefined,
    notes: fields.notes || undefined,
    location: fields.location || undefined,
    country: fields.country,
    region: fields.region || undefined,
    grapeVariety: [...fields.grapeVariety],
  };
}
