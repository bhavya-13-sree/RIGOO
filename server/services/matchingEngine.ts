/**
 * RIGOO Intelligent Ride-Matching Engine
 * Deterministic geographic and timing-based route compatibility calculator.
 * Evaluates:
 * 1. Pickup Proximity (rider start/route corridor to passenger pickup)
 * 2. Destination Compatibility (passenger drop-off proximity to rider destination)
 * 3. Directional Alignment & Detour Distance
 * 4. Time Compatibility (departure window delta)
 * 5. Safety & Gender Preferences (Verified women-only preference)
 */

export interface RideMatchCriteria {
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  travelDate: string;
  preferredTime: string; // "08:30"
  timeFlexibilityMinutes?: number; // e.g. 15, 30
  womenOnlyPreference?: boolean;
  passengerGender?: string;
  passengerId?: number;
}

export interface MatchResult {
  ride: any;
  compatibilityScore: number; // 0 to 100
  pickupProximityKm: number;
  destinationProximityKm: number;
  timeDiffMinutes: number;
  suggestedPickupPoint: string;
  suggestedPickupLat: number;
  suggestedPickupLng: number;
  matchReasons: string[];
  detourDistanceKm: number;
  isWomenSafeMatch: boolean;
}

// Haversine formula to compute accurate surface distance in kilometers
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
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

// Convert "HH:MM" to total minutes from midnight
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Calculates projection of point onto segment to estimate closest route corridor point
 */
function minDistanceToCorridor(
  pLat: number,
  pLng: number,
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  routeCoordinates?: Array<[number, number]>
): { distanceKm: number; closestLat: number; closestLng: number } {
  // If actual road geometry coordinates are available, check closest point along real road
  if (routeCoordinates && routeCoordinates.length > 0) {
    let minD = Infinity;
    let closestLat = startLat;
    let closestLng = startLng;
    for (const [rLat, rLng] of routeCoordinates) {
      const d = haversineDistanceKm(pLat, pLng, rLat, rLng);
      if (d < minD) {
        minD = d;
        closestLat = rLat;
        closestLng = rLng;
      }
    }
    return { distanceKm: minD, closestLat, closestLng };
  }

  // Direct distance to endpoints
  const dStart = haversineDistanceKm(pLat, pLng, startLat, startLng);
  const dEnd = haversineDistanceKm(pLat, pLng, endLat, endLng);
  
  // Multiple interpolation points along the corridor (25%, 50%, 75%)
  const p25Lat = startLat + (endLat - startLat) * 0.25;
  const p25Lng = startLng + (endLng - startLng) * 0.25;
  const d25 = haversineDistanceKm(pLat, pLng, p25Lat, p25Lng);

  const midLat = (startLat + endLat) / 2;
  const midLng = (startLng + endLng) / 2;
  const dMid = haversineDistanceKm(pLat, pLng, midLat, midLng);

  const p75Lat = startLat + (endLat - startLat) * 0.75;
  const p75Lng = startLng + (endLng - startLng) * 0.75;
  const d75 = haversineDistanceKm(pLat, pLng, p75Lat, p75Lng);

  const minD = Math.min(dStart, dEnd, d25, dMid, d75);
  let closestLat = startLat;
  let closestLng = startLng;
  if (minD === dEnd) {
    closestLat = endLat;
    closestLng = endLng;
  } else if (minD === d25) {
    closestLat = p25Lat;
    closestLng = p25Lng;
  } else if (minD === dMid) {
    closestLat = midLat;
    closestLng = midLng;
  } else if (minD === d75) {
    closestLat = p75Lat;
    closestLng = p75Lng;
  }

  return { distanceKm: minD, closestLat, closestLng };
}

export function evaluateRideMatch(ride: any, criteria: RideMatchCriteria): MatchResult | null {
  // Only evaluate active rides with seats
  if (ride.status !== 'OFFERED' || ride.available_seats <= 0) {
    return null;
  }

  // Prevent matching self
  if (criteria.passengerId && ride.rider_id === criteria.passengerId) {
    return null;
  }

  // Women safety check
  const riderGender = ride.rider?.gender || 'Other';
  const isRiderFemale = riderGender.toLowerCase() === 'female';
  const requestedWomenOnly = Boolean(criteria.womenOnlyPreference);
  const rideWomenOnly = Boolean(ride.women_only);

  if (rideWomenOnly && criteria.passengerGender && criteria.passengerGender.toLowerCase() !== 'female') {
    return null; // Ride is restricted to women
  }

  if (requestedWomenOnly && !isRiderFemale) {
    // Passenger asked specifically for women riders
    return null;
  }

  // 1. Time compatibility
  const riderTimeMin = timeToMinutes(ride.departure_time);
  const passengerTimeMin = timeToMinutes(criteria.preferredTime || ride.departure_time);
  const timeDiff = Math.abs(riderTimeMin - passengerTimeMin);
  const flexWindow = criteria.timeFlexibilityMinutes || 30;

  if (timeDiff > flexWindow + 45) {
    // Too far in time to be compatible
    return null;
  }

  // 2. Pickup proximity
  // Distance from rider starting point or path to passenger pickup
  const pickupDistToStart = haversineDistanceKm(
    criteria.pickupLat,
    criteria.pickupLng,
    ride.start_lat,
    ride.start_lng
  );

  const corridorPickup = minDistanceToCorridor(
    criteria.pickupLat,
    criteria.pickupLng,
    ride.start_lat,
    ride.start_lng,
    ride.dest_lat,
    ride.dest_lng,
    ride.route_coordinates
  );

  const effectivePickupDist = Math.min(pickupDistToStart, corridorPickup.distanceKm);

  // If pickup is > 6 km away from the rider's corridor, skip
  if (effectivePickupDist > 6.5) {
    return null;
  }

  // 3. Destination proximity
  const destDistToEnd = haversineDistanceKm(
    criteria.dropoffLat,
    criteria.dropoffLng,
    ride.dest_lat,
    ride.dest_lng
  );

  const corridorDest = minDistanceToCorridor(
    criteria.dropoffLat,
    criteria.dropoffLng,
    ride.start_lat,
    ride.start_lng,
    ride.dest_lat,
    ride.dest_lng,
    ride.route_coordinates
  );

  const effectiveDestDist = Math.min(destDistToEnd, corridorDest.distanceKm);

  if (effectiveDestDist > 7.0) {
    return null;
  }

  // 4. Detour calculation
  const directRiderDist = haversineDistanceKm(ride.start_lat, ride.start_lng, ride.dest_lat, ride.dest_lng);
  const detourRiderDist =
    haversineDistanceKm(ride.start_lat, ride.start_lng, criteria.pickupLat, criteria.pickupLng) +
    haversineDistanceKm(criteria.pickupLat, criteria.pickupLng, criteria.dropoffLat, criteria.dropoffLng) +
    haversineDistanceKm(criteria.dropoffLat, criteria.dropoffLng, ride.dest_lat, ride.dest_lng);
  const detourKm = Math.max(0, Math.round((detourRiderDist - directRiderDist) * 100) / 100);

  // 5. Score calculation (0 - 100)
  // Distance score (max 40 pts)
  const pickupScore = Math.max(0, 20 - effectivePickupDist * 3.5);
  const destScore = Math.max(0, 20 - effectiveDestDist * 3.0);

  // Time score (max 30 pts)
  const timeScore = Math.max(0, 30 - (timeDiff / flexWindow) * 15);

  // Detour score (max 20 pts)
  const detourScore = Math.max(0, 20 - detourKm * 2.5);

  // Verification & rating bonus (max 10 pts)
  const trustScore = (ride.rider?.is_verified ? 5 : 0) + ((ride.rider?.rating_avg || 5) / 5) * 5;

  let totalScore = Math.round(pickupScore + destScore + timeScore + detourScore + trustScore);
  totalScore = Math.min(99, Math.max(65, totalScore));

  const matchReasons: string[] = [];
  if (effectivePickupDist < 1.5) {
    matchReasons.push('Pickup is right along rider’s direct road corridor');
  } else {
    matchReasons.push(`Convenient pickup only ${effectivePickupDist} km away`);
  }

  if (timeDiff <= 10) {
    matchReasons.push('Near exact departure time synchronization (±10 min)');
  } else {
    matchReasons.push(`Fits within departure window (${timeDiff} min difference)`);
  }

  if (destDistToEnd < 1.8) {
    matchReasons.push('Drop-off within 2 km of rider destination');
  }

  if (ride.rider?.is_verified) {
    matchReasons.push('Verified university / corporate identity');
  }

  // Determine suggested pickup point
  let suggestedPoint = criteria.pickupAddress;
  if (effectivePickupDist > 0.6) {
    suggestedPoint = `Near ${ride.start_location.split(',')[0]} junction (closer to rider corridor)`;
  }

  return {
    ride,
    compatibilityScore: totalScore,
    pickupProximityKm: effectivePickupDist,
    destinationProximityKm: effectiveDestDist,
    timeDiffMinutes: timeDiff,
    suggestedPickupPoint: suggestedPoint,
    suggestedPickupLat: corridorPickup.closestLat,
    suggestedPickupLng: corridorPickup.closestLng,
    matchReasons,
    detourDistanceKm: detourKm,
    isWomenSafeMatch: isRiderFemale
  };
}

export function rankRides(rides: any[], criteria: RideMatchCriteria): MatchResult[] {
  const matches: MatchResult[] = [];

  for (const ride of rides) {
    const res = evaluateRideMatch(ride, criteria);
    if (res) {
      matches.push(res);
    }
  }

  // Sort by compatibility score descending
  return matches.sort((a, b) => {
    // If women-only requested, female matches prioritized
    if (criteria.womenOnlyPreference) {
      if (a.isWomenSafeMatch && !b.isWomenSafeMatch) return -1;
      if (!a.isWomenSafeMatch && b.isWomenSafeMatch) return 1;
    }
    return b.compatibilityScore - a.compatibilityScore;
  });
}
