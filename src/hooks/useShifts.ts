 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 
 export interface DatabaseShift {
   id: string;
   team_id: string;
   assigned_worker_id: string | null;
   date: string;
   start_time: string;
   end_time: string;
   position: string;
   location: string;
   status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
   is_vacant: boolean;
   notes: string | null;
   latitude: number | null;
   longitude: number | null;
   check_in_radius_meters: number | null;
   created_at: string;
   updated_at: string;
   assigned_worker?: {
     id: string;
     full_name: string;
     avatar_url: string | null;
     position: string | null;
   } | null;
 }
 
 export interface CreateShiftData {
   date: string;
   start_time: string;
   end_time: string;
   position: string;
   location: string;
   notes?: string;
   assigned_worker_id?: string;
   latitude?: number;
   longitude?: number;
   check_in_radius_meters?: number;
 }
 
 export interface UpdateShiftData extends Partial<CreateShiftData> {
   status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
   is_vacant?: boolean;
 }
 
 export function useShifts() {
   const { profile } = useAuth();
   const [shifts, setShifts] = useState<DatabaseShift[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const fetchShifts = async () => {
     if (!profile?.team_id) {
       setShifts([]);
       setLoading(false);
       return;
     }
 
     try {
       setLoading(true);
       const { data, error } = await supabase
         .from('shifts')
         .select(`
           *,
           assigned_worker:profiles!shifts_assigned_worker_id_fkey(
             id,
             full_name,
             avatar_url,
             position
           )
         `)
         .eq('team_id', profile.team_id)
         .order('date', { ascending: true })
         .order('start_time', { ascending: true });
 
       if (error) throw error;
       setShifts(data || []);
     } catch (err: any) {
       console.error('Error fetching shifts:', err);
       setError(err.message);
     } finally {
       setLoading(false);
     }
   };
 
   const createShift = async (shiftData: CreateShiftData) => {
     if (!profile?.team_id) {
       toast.error('No team assigned');
       return null;
     }
 
     try {
       const { data, error } = await supabase
         .from('shifts')
         .insert({
           team_id: profile.team_id,
           ...shiftData,
           is_vacant: !shiftData.assigned_worker_id,
         })
         .select(`
           *,
           assigned_worker:profiles!shifts_assigned_worker_id_fkey(
             id,
             full_name,
             avatar_url,
             position
           )
         `)
         .single();
 
       if (error) throw error;
       
       setShifts(prev => [...prev, data].sort((a, b) => 
         new Date(a.date + 'T' + a.start_time).getTime() - 
         new Date(b.date + 'T' + b.start_time).getTime()
       ));
       toast.success('Shift created successfully');
       return data;
     } catch (err: any) {
       console.error('Error creating shift:', err);
       toast.error('Failed to create shift');
       return null;
     }
   };
 
   const updateShift = async (shiftId: string, updates: UpdateShiftData) => {
     try {
       const updateData: any = { ...updates };
       if ('assigned_worker_id' in updates) {
         updateData.is_vacant = !updates.assigned_worker_id;
       }
 
       const { data, error } = await supabase
         .from('shifts')
         .update(updateData)
         .eq('id', shiftId)
         .select(`
           *,
           assigned_worker:profiles!shifts_assigned_worker_id_fkey(
             id,
             full_name,
             avatar_url,
             position
           )
         `)
         .single();
 
       if (error) throw error;
       
       setShifts(prev => prev.map(s => s.id === shiftId ? data : s));
       toast.success('Shift updated successfully');
       return data;
     } catch (err: any) {
       console.error('Error updating shift:', err);
       toast.error('Failed to update shift');
       return null;
     }
   };
 
   const deleteShift = async (shiftId: string) => {
     try {
       const { error } = await supabase
         .from('shifts')
         .delete()
         .eq('id', shiftId);
 
       if (error) throw error;
       
       setShifts(prev => prev.filter(s => s.id !== shiftId));
       toast.success('Shift deleted successfully');
       return true;
     } catch (err: any) {
       console.error('Error deleting shift:', err);
       toast.error('Failed to delete shift');
       return false;
     }
   };
 
   const assignWorker = async (shiftId: string, workerId: string | null) => {
     return updateShift(shiftId, { assigned_worker_id: workerId || undefined });
   };
 
   useEffect(() => {
     fetchShifts();
   }, [profile?.team_id]);
 
   // Set up realtime subscription — explicit team_id filter at the source
   // plus a per-team channel name (RLS still enforces server-side).
   useEffect(() => {
     if (!profile?.team_id) return;

     const channel = supabase
       .channel(`shifts:${profile.team_id}`)
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'shifts',
           filter: `team_id=eq.${profile.team_id}`,
         },
         () => {
           fetchShifts();
         }
       )
       .subscribe();

     return () => {
       supabase.removeChannel(channel);
     };
   }, [profile?.team_id]);
 
   return {
     shifts,
     loading,
     error,
     fetchShifts,
     createShift,
     updateShift,
     deleteShift,
     assignWorker,
   };
 }