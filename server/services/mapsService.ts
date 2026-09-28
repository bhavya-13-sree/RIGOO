/**
 * RIGOO Maps & Routing Service
 * Universal Location Autocomplete, Geocoding, and Dynamic Road Routing.
 * Fully decoupled from hardcoded coordinates.
 */

export interface PlacePrediction {
  name: string;
  description: string;
  place_id: string;
  lat: number;
  lng: number;
}

export interface RouteResult {
  distance_km: number;
  duration_mins: number;
  coordinates: Array<[number, number]>; // [lat, lng] pairs for Leaflet
  polyline?: string;
  isRealRoadRoute: boolean;
}

// In-memory cache for autocomplete predictions and routes to ensure sub-millisecond response
const autocompleteCache = new Map<string, { timestamp: number; data: PlacePrediction[] }>();
const routeCache = new Map<string, { timestamp: number; data: RouteResult }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export class MapsService {
  /**
   * Search places universally for ANY query (e.g. Karmanghat, Gachibowli, LB Nagar, Uppal, Warangal, etc.)
   */
  async autocomplete(query: string): Promise<PlacePrediction[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) {
      return [];
    }

    const cached = autocompleteCache.get(trimmed);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    let results: PlacePrediction[] = [];

    // 1. Try Photon (fast, worldwide, based on OpenStreetMap)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=8`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'RIGOO-BikePooling-Platform/2.0' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.features && Array.isArray(json.features)) {
          results = json.features
            .filter((f: any) => f.geometry && f.geometry.coordinates && f.geometry.coordinates.length >= 2)
            .map((f: any) => {
              const p = f.properties || {};
              const name = p.name || p.street || 'Location';
              const parts = [
                p.name,
                p.street,
                p.locality || p.district,
                p.city || p.county,
                p.state,
                p.country
              ].filter(Boolean);

              // Remove duplicates in description parts
              const uniqueParts = Array.from(new Set(parts));
              const description = uniqueParts.join(', ');
              const placeId = String(p.osm_id || `photon_${p.osm_type || 'p'}_${Math.abs(f.geometry.coordinates[0] * 1000)}`);

              return {
                name,
                description: description || name,
                place_id: placeId,
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0],
              };
            });
        }
      }
    } catch (err) {
      // Fall through to Nominatim
    }

    // 2. If Photon returned empty or failed, fallback to Nominatim
    if (results.length === 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=6&addressdetails=1`,
          {
            signal: controller.signal,
            headers: { 'User-Agent': 'RIGOO-BikePooling-Platform/2.0 (hackathon@rigoo.in)' },
          }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) {
            results = json.map((item: any) => ({
              name: item.name || item.display_name.split(',')[0],
              description: item.display_name,
              place_id: String(item.place_id || `osm_${item.osm_id}`),
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            }));
          }
        }
      } catch (err) {
        // Fallback error handling
      }
    }

    if (results.length > 0) {
      autocompleteCache.set(trimmed, { timestamp: Date.now(), data: results });
    }

    return results;
  }

  /**
   * Reverse geocode a latitude & longitude to get exact place name and formatted address
   */
  async reverseGeocode(lat: number, lng: number): Promise<PlacePrediction | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          signal: controller.signal,
          headers: { 'User-Agent': 'RIGOO-BikePooling-Platform/2.0' },
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const name = data.name || data.display_name.split(',')[0];
          return {
            name,
            description: data.display_name,
            place_id: String(data.place_id || `reverse_${Date.now()}`),
            lat,
            lng,
          };
        }
      }
    } catch (err) {
      // Fallback
    }

    return {
      name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      description: `GPS Position: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      place_id: `gps_${lat.toFixed(4)}_${lng.toFixed(4)}`,
      lat,
      lng,
    };
  }

  /**
   * Compute dynamic road route between any origin and destination coordinates
   */
  async calculateRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<RouteResult> {
    const cacheKey = `${originLat.toFixed(4)},${originLng.toFixed(4)}->${destLat.toFixed(4)},${destLng.toFixed(4)}`;
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    // Try OSRM Road Router
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      const url = `http://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distKm = Math.round((route.distance / 1000) * 10) / 10;
          const durationMins = Math.max(1, Math.round(route.duration / 60));
          
          // OSRM GeoJSON geometry coordinates are [lng, lat].
          // Convert to [lat, lng] for Leaflet
          const coords: Array<[number, number]> = route.geometry.coordinates.map((pt: [number, number]) => [
            pt[1],
            pt[0],
          ]);

          const result: RouteResult = {
            distance_km: distKm,
            duration_mins: durationMins,
            coordinates: coords,
            polyline: typeof route.geometry === 'string' ? route.geometry : undefined,
            isRealRoadRoute: true,
          };

          routeCache.set(cacheKey, { timestamp: Date.now(), data: result });
          return result;
        }
      }
    } catch (err) {
      console.warn('[MapsService] OSRM router failed, using geometric path generator:', err);
    }

    // Fallback: Haversine distance with realistic road curvature factor (1.25x)
    const directKm = this.haversineDistanceKm(originLat, originLng, destLat, destLng);
    const estimatedRoadKm = Math.round(directKm * 1.25 * 10) / 10;
    const estimatedMins = Math.max(2, Math.round(estimatedRoadKm * 2.8));

    // Generate interpolated corridor points so the route renders accurately on the map
    const steps = Math.min(10, Math.max(3, Math.round(directKm)));
    const coordinates: Array<[number, number]> = [];
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      const lat = originLat + (destLat - originLat) * frac;
      const lng = originLng + (destLng - originLng) * frac;
      // Slight road curvature offset
      const bend = Math.sin(frac * Math.PI) * 0.0015;
      coordinates.push([lat + bend, lng - bend]);
    }

    const fallbackResult: RouteResult = {
      distance_km: estimatedRoadKm,
      duration_mins: estimatedMins,
      coordinates,
      isRealRoadRoute: false,
    };

    routeCache.set(cacheKey, { timestamp: Date.now(), data: fallbackResult });
    return fallbackResult;
  }

  haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }
}

export const mapsService = new MapsService();
