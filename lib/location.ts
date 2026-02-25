
import { useState, useEffect } from 'react';

export interface PreciseLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const usePreciseLocation = (options?: PositionOptions) => {
  const [location, setLocation] = useState<PreciseLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<'precise' | 'fallback'>('fallback');

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setLoading(false);
        setStrategy('precise');
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0, ...options }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, loading, strategy };
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
