/**
 * Format a phone number for WhatsApp (Brazilian format)
 * Removes non-numeric chars and ensures country code
 */
export function formatWhatsApp(phone: string | null | undefined): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, '');

  if (digits.length === 0) return null;

  // If starts with +55 or 55, already has country code
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }

  // Add Brazil country code
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

/**
 * Try to extract Instagram handle from a website URL
 */
export function extractInstagram(website: string | null | undefined): string | null {
  if (!website) return null;

  const instagramRegex = /(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9_.]+)/i;
  const match = website.match(instagramRegex);

  return match ? `@${match[1]}` : null;
}

/**
 * Build Google Maps URL from place data
 */
export function buildGoogleMapsUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
}

/**
 * Get the start of today (midnight) in UTC
 */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
