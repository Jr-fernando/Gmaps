import type { CompanyData } from '../types/index.js';
import { formatWhatsApp, extractInstagram, buildGoogleMapsUrl } from '../utils/helpers.js';
import { AppError } from '../middleware/errorHandler.js';

const PLACES_API_BASE = 'https://places.googleapis.com/v1/places:searchText';

interface PlaceResult {
  id: string;
  displayName?: { text: string };
  primaryTypeDisplayName?: { text: string };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  addressComponents?: Array<{
    longText: string;
    types: string[];
  }>;
}

interface PlacesResponse {
  places?: PlaceResult[];
  nextPageToken?: string;
}

function extractCityState(addressComponents?: PlaceResult['addressComponents']): {
  city: string | null;
  state: string | null;
} {
  if (!addressComponents) return { city: null, state: null };

  let city: string | null = null;
  let state: string | null = null;

  for (const component of addressComponents) {
    if (component.types.includes('administrative_area_level_2')) {
      city = component.longText;
    }
    if (component.types.includes('administrative_area_level_1')) {
      state = component.longText;
    }
  }

  return { city, state };
}

function mapPlaceToCompany(place: PlaceResult, searchQuery: string): CompanyData {
  const { city, state } = extractCityState(place.addressComponents);
  const phone = place.internationalPhoneNumber || place.nationalPhoneNumber || null;

  return {
    placeId: place.id,
    name: place.displayName?.text || 'Sem nome',
    category: place.primaryTypeDisplayName?.text || null,
    phone: phone,
    whatsapp: formatWhatsApp(phone),
    website: place.websiteUri || null,
    instagram: extractInstagram(place.websiteUri),
    address: place.formattedAddress || null,
    city: city,
    state: state,
    lat: place.location?.latitude || null,
    lng: place.location?.longitude || null,
    rating: place.rating || null,
    totalReviews: place.userRatingCount || null,
    googleMapsUrl: place.googleMapsUri || buildGoogleMapsUrl(place.id),
    searchQuery,
  };
}

export async function searchPlaces(
  city: string,
  segment: string,
  radiusKm: number,
  apiKey: string,
): Promise<CompanyData[]> {
  const query = `${segment} em ${city}`;
  const radiusMeters = radiusKm * 1000;

  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.primaryTypeDisplayName',
    'places.nationalPhoneNumber',
    'places.internationalPhoneNumber',
    'places.websiteUri',
    'places.formattedAddress',
    'places.location',
    'places.rating',
    'places.userRatingCount',
    'places.googleMapsUri',
    'places.addressComponents',
  ].join(',');

  const allCompanies: CompanyData[] = [];
  let pageToken: string | undefined;

  // Fetch up to 3 pages (60 results max)
  for (let page = 0; page < 3; page++) {
    const body: Record<string, unknown> = {
      textQuery: query,
      languageCode: 'pt-BR',
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: {},
          radius: radiusMeters,
        },
      },
    };

    if (pageToken) {
      body.pageToken = pageToken;
    }

    const response = await fetch(PLACES_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Google Places Error]', response.status, errorBody);
      throw new AppError(502, `Erro ao consultar Google Places API: ${response.status}`);
    }

    const data = (await response.json()) as PlacesResponse;

    if (data.places) {
      const mapped = data.places.map((place) => mapPlaceToCompany(place, query));
      allCompanies.push(...mapped);
    }

    if (data.nextPageToken) {
      pageToken = data.nextPageToken;
    } else {
      break;
    }
  }

  return allCompanies;
}
