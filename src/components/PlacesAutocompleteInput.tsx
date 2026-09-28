import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.ts';
import { LocationPoint } from '../types/index.ts';
import { MapPin, Navigation, Search, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

interface PlacesAutocompleteInputProps {
  label: string;
  placeholder?: string;
  selectedLocation: LocationPoint | null;
  onLocationSelect: (loc: LocationPoint) => void;
  onLocationInvalidate: () => void;
  showCurrentLocationButton?: boolean;
  required?: boolean;
  helperText?: string;
  accentColor?: string;
}

export const PlacesAutocompleteInput: React.FC<PlacesAutocompleteInputProps> = ({
  label,
  placeholder = 'Search any location (e.g. Karmanghat, Gachibowli, Secunderabad...)',
  selectedLocation,
  onLocationSelect,
  onLocationInvalidate,
  showCurrentLocationButton = false,
  required = false,
  helperText,
  accentColor = '#1769D2',
}) => {
  const [inputValue, setInputValue] = useState(selectedLocation ? selectedLocation.description : '');
  const [suggestions, setSuggestions] = useState<LocationPoint[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Sync input value if selectedLocation changes from outside
  useEffect(() => {
    if (selectedLocation) {
      setInputValue(selectedLocation.description || selectedLocation.name);
    }
  }, [selectedLocation]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // CRITICAL REQUIREMENT: If the user edits the text after selecting a suggestion,
    // invalidate the previous selection until the new location is resolved.
    // Never silently reuse an earlier location.
    if (selectedLocation) {
      onLocationInvalidate();
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 2) {
      setIsLoading(true);
      setIsOpen(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const preds = await api.getAutocomplete(val.trim());
          setSuggestions(preds);
        } catch (err) {
          console.warn('Autocomplete fetch error:', err);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 250);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (loc: LocationPoint) => {
    setInputValue(loc.description || loc.name);
    setSuggestions([]);
    setIsOpen(false);
    onLocationSelect(loc);
  };

  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    onLocationInvalidate();
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await api.reverseGeocode(latitude, longitude);
          const loc = res.location;
          setInputValue(loc.description);
          onLocationSelect(loc);
        } catch (err) {
          const fallbackLoc: LocationPoint = {
            name: `Device GPS Location`,
            description: `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            address: `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            place_id: `gps_${Date.now()}`,
            lat: latitude,
            lng: longitude,
          };
          setInputValue(fallbackLoc.description);
          onLocationSelect(fallbackLoc);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(err.message || 'Unable to retrieve your current location');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const isResolved = Boolean(selectedLocation && inputValue === (selectedLocation.description || selectedLocation.name));
  const isPendingResolution = inputValue.trim().length > 0 && !isResolved;

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {showCurrentLocationButton && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={gpsLoading}
            className="text-[11px] font-bold text-[#1769D2] hover:text-[#123F7A] flex items-center gap-1 transition"
          >
            {gpsLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-[#1769D2]" />
            ) : (
              <Navigation className="w-3 h-3" />
            )}
            <span>Use My Real GPS</span>
          </button>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#1769D2]" />
          ) : (
            <MapPin className="w-4 h-4" style={{ color: isResolved ? accentColor : undefined }} />
          )}
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 rounded-xl border text-xs sm:text-sm font-medium transition outline-none ${
            isResolved
              ? 'border-emerald-500 bg-emerald-50/20 text-slate-900 ring-2 ring-emerald-500/20'
              : isPendingResolution
              ? 'border-amber-400 bg-amber-50/20 text-slate-900 ring-2 ring-amber-400/20'
              : 'border-slate-200 bg-white text-slate-900 focus:border-[#1769D2] focus:ring-2 focus:ring-[#1769D2]/20'
          }`}
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            title="Clear location"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Resolution Status Badge */}
      {isResolved && selectedLocation && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">
            Verified: <b>{selectedLocation.name}</b> ({selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)})
          </span>
        </div>
      )}

      {isPendingResolution && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Please select a location from the dropdown suggestions below to resolve coordinates.</span>
        </div>
      )}

      {gpsError && (
        <div className="text-[11px] text-red-600 font-medium">
          GPS error: {gpsError}
        </div>
      )}

      {helperText && !isPendingResolution && !isResolved && (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      )}

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-64 overflow-y-auto">
          {isLoading && suggestions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#1769D2]" />
              <span>Searching Google Maps & OpenStreetMap places...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No matching locations found. Try entering another landmark or road name.
            </div>
          ) : (
            suggestions.map((item, idx) => (
              <button
                key={`${item.place_id}_${idx}`}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-4 py-2.5 hover:bg-[#EAF3FF] transition flex items-start gap-3 border-b border-slate-100 last:border-0 group"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#1769D2] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#1769D2] group-hover:text-white transition">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-[#1769D2] transition truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate leading-snug">
                    {item.description}
                  </p>
                  <span className="text-[9px] text-slate-400 font-mono">
                    Coord: {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
