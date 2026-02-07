import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TeamSettings {
  id: string;
  team_id: string;
  default_check_in_radius_meters: number;
  notification_shift_reminder_hours: number;
  notification_swap_requests: boolean;
  notification_attendance_alerts: boolean;
  allow_worker_shift_requests: boolean;
  auto_approve_swaps: boolean;
}

export function useTeamSettings() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<TeamSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!profile?.team_id) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('team_settings')
        .select('*')
        .eq('team_id', profile.team_id)
        .maybeSingle();

      if (error) throw error;
      setSettings(data as TeamSettings);
    } catch (err) {
      console.error('Error fetching team settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSettings = async () => {
    if (!profile?.team_id) return null;

    try {
      const { data, error } = await supabase
        .from('team_settings')
        .insert({ team_id: profile.team_id })
        .select()
        .single();

      if (error) throw error;
      setSettings(data as TeamSettings);
      return data;
    } catch (err) {
      console.error('Error creating team settings:', err);
      return null;
    }
  };

  const updateSettings = async (updates: Partial<Omit<TeamSettings, 'id' | 'team_id'>>) => {
    if (!settings?.id) {
      // Create settings if they don't exist
      const created = await createSettings();
      if (!created) {
        toast.error('Failed to create settings');
        return false;
      }
    }

    try {
      const { error } = await supabase
        .from('team_settings')
        .update(updates)
        .eq('team_id', profile?.team_id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Settings updated');
      return true;
    } catch (err) {
      console.error('Error updating settings:', err);
      toast.error('Failed to update settings');
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [profile?.team_id]);

  return {
    settings,
    loading,
    updateSettings,
    createSettings,
    refetch: fetchSettings,
  };
}
