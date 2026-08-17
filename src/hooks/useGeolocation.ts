import { useEffect, useMemo, useRef, useState } from 'react';

export type GeolocationStatus = 'idle' | 'live' | 'locked' | 'error';
export type GeolocationErrorCode = 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';

export interface LocationSample {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface UseGeolocationResult {
  status: GeolocationStatus;
  position: GeolocationPosition | null;
  samples: LocationSample[];
  isSupported: boolean;
  error: string | null;
  errorCode: GeolocationErrorCode | null;
  startWatching: () => void;
  stopWatching: () => void;
}

export function useGeolocation(): UseGeolocationResult {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [samples, setSamples] = useState<LocationSample[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<GeolocationErrorCode | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const isSupported = useMemo(() => {
    const hasGeo = 'geolocation' in navigator;
    const secureContext = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    return hasGeo && secureContext;
  }, []);

  const handlePosition = (nextPosition: GeolocationPosition) => {
    setPosition(nextPosition);
    setStatus('live');
    setSamples((prev) => {
      const nextSample: LocationSample = {
        latitude: nextPosition.coords.latitude,
        longitude: nextPosition.coords.longitude,
        accuracy: nextPosition.coords.accuracy,
        timestamp: nextPosition.timestamp
      };

      const merged = [...prev, nextSample];
      return merged.slice(-50);
    });
    setError(null);
    setErrorCode(null);
  };

  const handleGeoError = (geoError: GeolocationPositionError) => {
    setStatus('error');

    switch (geoError.code) {
      case geoError.PERMISSION_DENIED:
        setErrorCode('PERMISSION_DENIED');
        setError(
          'Location permission denied. Please enable location access in your browser settings and reload the page.'
        );
        break;
      case geoError.POSITION_UNAVAILABLE:
        setErrorCode('POSITION_UNAVAILABLE');
        setError(
          'GPS signal unavailable — this is common indoors. Measurement can continue without GPS.'
        );
        break;
      case geoError.TIMEOUT:
        setErrorCode('TIMEOUT');
        setError(
          'GPS fix timed out — indoor signals can be slow. The app will keep trying in the background.'
        );
        break;
      default:
        setErrorCode('UNKNOWN');
        setError(geoError.message || 'Unable to get GPS position.');
    }

    console.warn('[useGeolocation] Error code:', geoError.code, 'Message:', geoError.message);
  };

  const startWatching = () => {
    if (!isSupported) {
      setError('GPS needs a secure HTTPS origin and location permission.');
      setErrorCode('UNKNOWN');
      setStatus('error');
      return;
    }

    if (watchIdRef.current !== null) {
      return;
    }

    setStatus('live');
    const id = navigator.geolocation.watchPosition(
      handlePosition,
      handleGeoError,
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 20000
      }
    );

    watchIdRef.current = id;
  };

  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus('locked');
  };

  useEffect(() => {
    if (!isSupported) {
      setError('GPS requires HTTPS and location permission.');
      setErrorCode('UNKNOWN');
      setStatus('error');
      return;
    }

    // Only use watchPosition — calling getCurrentPosition simultaneously
    // creates a race condition where its timeout can fire and set error
    // state right before watchPosition succeeds.
    startWatching();

    return () => {
      stopWatching();
    };
  }, [isSupported]);

  return {
    status,
    position,
    samples,
    isSupported,
    error,
    errorCode,
    startWatching,
    stopWatching
  };
}
