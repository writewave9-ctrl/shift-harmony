import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ShiftTemplate {
  id: string;
  team_id: string;
  name: string;
  position: string;
  location: string;
  start_time: string;
  end_time: string;
  latitude: number | null;
  longitude: number | null;
  check_in_radius_meters: number | null;
  notes: string | null;
  days_of_week: number[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateData {
  name: string;
  position: string;
  location: string;
  start_time: string;
  end_time: string;
  latitude?: number;
  longitude?: number;
  check_in_radius_meters?: number;
  notes?: string;
  days_of_week?: number[];
}

export const useShiftTemplates = () => {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    if (!profile?.team_id) return;

    try {
      const { data, error } = await supabase
        .from('shift_templates')
        .select('*')
        .eq('team_id', profile.team_id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [profile?.team_id]);

  const createTemplate = async (data: CreateTemplateData): Promise<ShiftTemplate | null> => {
    if (!profile?.team_id || !profile?.id) {
      toast.error('Team not configured');
      return null;
    }

    try {
      const { data: template, error } = await supabase
        .from('shift_templates')
        .insert({
          ...data,
          team_id: profile.team_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [...prev, template]);
      toast.success('Template created');
      return template;
    } catch (err: any) {
      console.error('Error creating template:', err);
      toast.error('Failed to create template');
      return null;
    }
  };

  const updateTemplate = async (id: string, data: Partial<CreateTemplateData>): Promise<ShiftTemplate | null> => {
    try {
      const { data: template, error } = await supabase
        .from('shift_templates')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => prev.map(t => t.id === id ? template : t));
      toast.success('Template updated');
      return template;
    } catch (err: any) {
      console.error('Error updating template:', err);
      toast.error('Failed to update template');
      return null;
    }
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shift_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted');
      return true;
    } catch (err: any) {
      console.error('Error deleting template:', err);
      toast.error('Failed to delete template');
      return false;
    }
  };

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates,
  };
};
