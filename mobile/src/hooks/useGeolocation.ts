import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

interface State {
  loading: boolean;
  error: string | null;
  coords: { latitude: number; longitude: number } | null;
}

function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function useGeolocation() {
  const [state, setState] = useState<State>({ loading: false, error: null, coords: null });

  const refresh = async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({ loading: false, error: 'Location permission denied', coords: null });
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setState({ loading: false, error: null, coords });
      return coords;
    } catch (e: any) {
      setState({ loading: false, error: e?.message ?? 'Location error', coords: null });
      return null;
    }
  };

  useEffect(() => { void refresh(); }, []);

  const isWithinRadius = async (
    lat: number | null,
    lon: number | null,
    radiusMeters: number,
  ) => {
    if (lat == null || lon == null) return { within: true, distance: null };
    const c = state.coords ?? (await refresh());
    if (!c) return { within: false, distance: null };
    const d = distanceMeters(c, { latitude: lat, longitude: lon });
    return { within: d <= radiusMeters, distance: d };
  };

  return { ...state, refresh, isWithinRadius };
}
