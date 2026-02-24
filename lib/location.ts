
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
