import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { api } from '../services/api.ts';

interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
  type?: 'start' | 'dest' | 'pickup' | 'rider';
}

interface InteractiveMapProps {
  start?: { lat: number; lng: number; label?: string };
  destination?: { lat: number; lng: number; label?: string };
  pickup?: { lat: number; lng: number; label?: string };
  riderLocation?: { lat: number; lng: number; heading?: number; speed?: number };
  routeCoordinates?: Array<[number, number]>;
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
  showNavigationControls?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  start,
  destination,
  pickup,
  riderLocation,
  routeCoordinates,
  onLocationSelect,
  height = '400px',
  className = '',
  showNavigationControls = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker | L.CircleMarker }>({});
  const polylineRef = useRef<L.Polyline | null>(null);

  // Custom marker icons
  const createCustomIcon = (type: 'start' | 'dest' | 'pickup' | 'rider') => {
    let iconHtml = '';
    if (type === 'start') {
      iconHtml = `
        <div style="background-color: #10B981; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(16,185,129,0.4); border: 2.5px solid white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="12 8 8 12 12 16 12 8"></polygon>
          </svg>
        </div>`;
    } else if (type === 'dest') {
      iconHtml = `
        <div style="background-color: #123F7A; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(18,63,122,0.4); border: 2.5px solid white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>`;
    } else if (type === 'pickup') {
      iconHtml = `
        <div style="background-color: #F59E0B; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(245,158,11,0.4); border: 2.5px solid white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>`;
    } else {
      // Live Rider Motorcycle
      iconHtml = `
        <div style="background-color: #1769D2; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 6px rgba(23,105,210,0.25), 0 4px 12px rgba(23,105,210,0.5); border: 3px solid white; transition: all 0.3s ease;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="5" cy="17" r="3"></circle>
            <circle cx="19" cy="17" r="3"></circle>
            <path d="M9 17h6"></path>
            <path d="M19 17l-4-9-4 2-3 7"></path>
            <path d="M14 8h3"></path>
          </svg>
        </div>`;
    }

    return L.divIcon({
      html: iconHtml,
      className: 'custom-leaflet-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Dynamic initial center based on provided points or central coordinate
    const defaultCenter: [number, number] = start
      ? [start.lat, start.lng]
      : destination
      ? [destination.lat, destination.lng]
      : [17.3850, 78.4867];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
    });

    // Clean, modern CartoDB Positron / OSM tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    if (onLocationSelect) {
      map.on('click', (e) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds: [number, number][] = [];

    // 1. Start Marker
    if (start && start.lat && start.lng) {
      bounds.push([start.lat, start.lng]);
      if (markersRef.current['start']) {
        markersRef.current['start'].setLatLng([start.lat, start.lng]);
      } else {
        const marker = L.marker([start.lat, start.lng], {
          icon: createCustomIcon('start'),
        }).addTo(map);
        marker.bindPopup(`<b>Starting Point</b><br/>${start.label || 'Origin'}`);
        markersRef.current['start'] = marker;
      }
    } else if (markersRef.current['start']) {
      map.removeLayer(markersRef.current['start']);
      delete markersRef.current['start'];
    }

    // 2. Destination Marker
    if (destination && destination.lat && destination.lng) {
      bounds.push([destination.lat, destination.lng]);
      if (markersRef.current['dest']) {
        markersRef.current['dest'].setLatLng([destination.lat, destination.lng]);
      } else {
        const marker = L.marker([destination.lat, destination.lng], {
          icon: createCustomIcon('dest'),
        }).addTo(map);
        marker.bindPopup(`<b>Destination</b><br/>${destination.label || 'Destination'}`);
        markersRef.current['dest'] = marker;
      }
    } else if (markersRef.current['dest']) {
      map.removeLayer(markersRef.current['dest']);
      delete markersRef.current['dest'];
    }

    // 3. Pickup Marker
    if (pickup && pickup.lat && pickup.lng) {
      bounds.push([pickup.lat, pickup.lng]);
      if (markersRef.current['pickup']) {
        markersRef.current['pickup'].setLatLng([pickup.lat, pickup.lng]);
      } else {
        const marker = L.marker([pickup.lat, pickup.lng], {
          icon: createCustomIcon('pickup'),
        }).addTo(map);
        marker.bindPopup(`<b>Suggested Pickup Point</b><br/>${pickup.label || 'Pickup Location'}`);
        markersRef.current['pickup'] = marker;
      }
    } else if (markersRef.current['pickup']) {
      map.removeLayer(markersRef.current['pickup']);
      delete markersRef.current['pickup'];
    }

    // 4. Live Rider Moving Marker
    if (riderLocation && riderLocation.lat && riderLocation.lng) {
      bounds.push([riderLocation.lat, riderLocation.lng]);
      if (markersRef.current['rider']) {
        markersRef.current['rider'].setLatLng([riderLocation.lat, riderLocation.lng]);
      } else {
        const marker = L.marker([riderLocation.lat, riderLocation.lng], {
          icon: createCustomIcon('rider'),
          zIndexOffset: 1000,
        }).addTo(map);
        marker.bindPopup(`<b>Live Rider Position</b><br/>Real-time GPS Active`);
        markersRef.current['rider'] = marker;
      }
    } else if (markersRef.current['rider']) {
      map.removeLayer(markersRef.current['rider']);
      delete markersRef.current['rider'];
    }

    // 5. Draw Road Polyline
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    let coordsToDraw: [number, number][] = [];
    if (routeCoordinates && routeCoordinates.length > 0) {
      coordsToDraw = routeCoordinates;
    } else if (start && destination) {
      // Generate sensible corridor road waypoints between start and destination
      const midLat = (start.lat + destination.lat) / 2 + 0.002;
      const midLng = (start.lng + destination.lng) / 2 - 0.002;
      coordsToDraw = [
        [start.lat, start.lng],
        [midLat, midLng],
        [destination.lat, destination.lng],
      ];
    }

    if (coordsToDraw.length > 1) {
      const line = L.polyline(coordsToDraw, {
        color: '#1769D2',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: undefined,
      }).addTo(map);
      polylineRef.current = line;
    }

    // Fit bounds if we have points
    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    }
  }, [start, destination, pickup, riderLocation, routeCoordinates]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm ${className}`} style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-medium text-slate-700 space-y-1.5 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
          <span>Start Point</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1769D2] ring-2 ring-blue-200" />
          <span>Live Rider (GPS)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#123F7A] ring-2 ring-indigo-200" />
          <span>Destination</span>
        </div>
      </div>

      {showNavigationControls && start && destination && (
        <div className="absolute bottom-3 left-3 z-10">
          <a
            href={api.getGoogleMapsDirectionsUrl(
              { address: start.label, lat: start.lat, lng: start.lng },
              { address: destination.label, lat: destination.lat, lng: destination.lng }
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-semibold text-[#1769D2] hover:bg-slate-50 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
            Open in Google Maps
          </a>
        </div>
      )}
    </div>
  );
};
