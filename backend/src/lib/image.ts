import { config } from '../config.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImageObject {
  url: string;
  thumbnail: string;
  medium: string;
  width?: number;
  height?: number;
  alt?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Append a width-based resize parameter to a URL.
 *
 * When a real CDN with image-transform support is configured (e.g. Cloudflare
 * Image Resizing, Imgix, Cloudinary) update this function to use the
 * provider-specific query param or path convention.
 *
 * For now it returns the URL unchanged because no transform service is active.
 */
function appendSizeParam(url: string, _width: number): string {
  // TODO: When CDN image transforms are available, add width param.
  // Examples:
  //   Cloudflare: `${url}?width=${width}&format=auto`
  //   Imgix:      `${url}?w=${width}&auto=format`
  //   Cloudinary: url.replace('/upload/', `/upload/w_${width},f_auto/`)
  return url;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a raw image path (relative or absolute URL) into an {@link ImageObject}
 * with CDN-ready absolute URLs and pre-computed size variants.
 *
 * - Absolute URLs (`http://` / `https://`) are used as-is.
 * - Relative paths are prefixed with `config.cdnBaseUrl`.
 * - Returns `null` for falsy inputs so callers can safely pass nullable DB fields.
 *
 * @example
 * ```ts
 * imageUrl('/uploads/photo.jpg')
 * // => { url: 'http://localhost:3001/uploads/photo.jpg', thumbnail: '...', medium: '...' }
 *
 * imageUrl('https://cdn.example.com/photo.jpg')
 * // => { url: 'https://cdn.example.com/photo.jpg', thumbnail: '...', medium: '...' }
 *
 * imageUrl(null)
 * // => null
 * ```
 */
export function imageUrl(path: string | null | undefined): ImageObject | null {
  if (!path) return null;

  const base = config.cdnBaseUrl;

  // Already an absolute URL — use as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return {
      url: path,
      thumbnail: appendSizeParam(path, 150),
      medium: appendSizeParam(path, 600),
    };
  }

  // Relative path — prepend CDN base
  const absolute = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  return {
    url: absolute,
    thumbnail: appendSizeParam(absolute, 150),
    medium: appendSizeParam(absolute, 600),
  };
}

/**
 * Transform an array of photo records by resolving their `url` field through
 * the CDN helper. Returns a new array (does not mutate the originals).
 *
 * Each photo gets an additional `image` property containing the full
 * {@link ImageObject}. The original `url` string is preserved for
 * backward-compatibility.
 */
export function transformPhotos<T extends { url: string }>(
  photos: T[],
): (T & { image: ImageObject | null })[] {
  return photos.map((photo) => ({
    ...photo,
    image: imageUrl(photo.url),
  }));
}

// ---------------------------------------------------------------------------
// Endpoint coverage notes
// ---------------------------------------------------------------------------
//
// The imageUrl() helper should be applied at the response layer for these
// image fields across the API. Currently integrated:
//
//   [x] POIPhoto.url           — via GET /pois/:poiId/photos
//   [x] GeoJSON primaryPhoto   — via GET /cities/:slug/pois.geojson
//
// TODO: Apply to these endpoints when CDN support is fully rolled out:
//
//   [ ] City.heroImageUrl      — GET /cities, GET /cities/:id
//   [ ] City.ogImageUrl        — GET /cities, GET /cities/:id
//   [ ] CityTheme.logoUrl      — GET /cities/:id (theme include)
//   [ ] CityTheme.emblemUrl    — GET /cities/:id (theme include)
//   [ ] Collection.coverImageUrl — GET /cities/:id/collections
//   [ ] Itinerary.coverImageUrl  — GET /cities/:id/itineraries
//
