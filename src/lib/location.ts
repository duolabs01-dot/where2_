
import { useState, useEffect, useRef } from 'react';

export interface PreciseLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

// Johannesburg CBD Fallback
const FALLBACK_LOCATION: PreciseLocation = {
  latitude: -26.2041,
  longitude: 28.0473,
  accuracy: 5000
};

export const usePreciseLocation = (options?: PositionOptions) => {
  const [location, setLocation] = useState<PreciseLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<'precise' | 'fallback'>('fallback');
  const [error, setError] = useState<string | null>(null);
  
  // Guard against unmounted component updates
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (!navigator.geolocation) {
      if (isMounted.current) {
        setLocation(FALLBACK_LOCATION);
        setStrategy('fallback');
        setLoading(false);
      }
      return;
    }

    const handleSuccess = (pos: GeolocationPosition) => {
      if (!isMounted.current) return;
      setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      });
      setStrategy('precise');
      setLoading(false);
    };

    const handleError = (err?: GeolocationPositionError) => {
      if (!isMounted.current) return;
      if (err) console.warn('Location retrieval failed:', err.message);
      if (err) setError(err.message);
      
      setLocation(FALLBACK_LOCATION);
      setStrategy('fallback');
      setLoading(false);
    };

    // Single-shot location request with timeout
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      { 
        enableHighAccuracy: true, 
        timeout: 8000, // 8 second timeout as requested
        maximumAge: 1000 * 60 * 5, // Cache for 5 mins
        ...options 
      }
    );

    return () => {
      isMounted.current = false;
    };
  }, []); // Run once on mount to ensure stability

  return { location, loading, strategy, error };
};

/**
 * Calculates the Haversine distance between two points in meters.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};
