 import { useState, useCallback } from 'react';
 
 export interface GeolocationPosition {
   latitude: number;
   longitude: number;
   accuracy: number;
 }
 
 export interface GeolocationError {
   code: number;
   message: string;
 }
 
 export function useGeolocation() {
   const [position, setPosition] = useState<GeolocationPosition | null>(null);
   const [error, setError] = useState<GeolocationError | null>(null);
   const [loading, setLoading] = useState(false);
 
   const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
     return new Promise((resolve, reject) => {
       if (!navigator.geolocation) {
         const err = { code: 0, message: 'Geolocation is not supported by this browser' };
         setError(err);
         reject(err);
         return;
       }
 
       setLoading(true);
       setError(null);
 
       navigator.geolocation.getCurrentPosition(
         (pos) => {
           const location = {
             latitude: pos.coords.latitude,
             longitude: pos.coords.longitude,
             accuracy: pos.coords.accuracy,
           };
           setPosition(location);
           setLoading(false);
           resolve(location);
         },
         (err) => {
           const error = {
             code: err.code,
             message: getErrorMessage(err.code),
           };
           setError(error);
           setLoading(false);
           reject(error);
         },
         {
           enableHighAccuracy: true,
           timeout: 10000,
           maximumAge: 0,
         }
       );
     });
   }, []);
 
   const calculateDistance = useCallback(
     (lat1: number, lon1: number, lat2: number, lon2: number): number => {
       const R = 6371e3; // Earth's radius in meters
       const φ1 = (lat1 * Math.PI) / 180;
       const φ2 = (lat2 * Math.PI) / 180;
       const Δφ = ((lat2 - lat1) * Math.PI) / 180;
       const Δλ = ((lon2 - lon1) * Math.PI) / 180;
 
       const a =
         Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
         Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
       const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 
       return R * c; // Distance in meters
     },
     []
   );
 
   const isWithinRadius = useCallback(
     async (
       targetLat: number,
       targetLon: number,
       radiusMeters: number
     ): Promise<{ withinRadius: boolean; distance: number; position: GeolocationPosition }> => {
       const pos = await getCurrentPosition();
       const distance = calculateDistance(pos.latitude, pos.longitude, targetLat, targetLon);
       return {
         withinRadius: distance <= radiusMeters,
         distance,
         position: pos,
       };
     },
     [getCurrentPosition, calculateDistance]
   );
 
   return {
     position,
     error,
     loading,
     getCurrentPosition,
     calculateDistance,
     isWithinRadius,
   };
 }
 
 function getErrorMessage(code: number): string {
   switch (code) {
     case 1:
       return 'Location permission denied. Please enable location services.';
     case 2:
       return 'Unable to determine your location. Please try again.';
     case 3:
       return 'Location request timed out. Please try again.';
     default:
       return 'An unknown error occurred while getting your location.';
   }
 }