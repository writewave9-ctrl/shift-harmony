import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { qk } from '@/lib/queryClient';

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

async function fetchTemplates(teamId: string): Promise<ShiftTemplate[]> {
  const { data, error } = await supabase
    .from('shift_templates')
    .select('*')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []) as ShiftTemplate[];
}

export const useShiftTemplates = () => {
  const { profile } = useAuth();
  const teamId = profile?.team_id ?? null;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: teamId ? qk.templates.byTeam(teamId) : ['templates', 'no-team'],
    queryFn: () => fetchTemplates(teamId as string),
    enabled: !!teamId,
  });

  const invalidate = () => {
    if (teamId) qc.invalidateQueries({ queryKey: qk.templates.byTeam(teamId) });
  };

  const createTemplate = useMutation({
    mutationKey: ['templates', 'create'],
    mutationFn: async (data: CreateTemplateData) => {
      if (!teamId || !profile?.id) throw new Error('Team not configured');
      const { data: template, error } = await supabase
        .from('shift_templates')
        .insert({ ...data, team_id: teamId, created_by: profile.id })
        .select()
        .single();
      if (error) throw error;
      return template as ShiftTemplate;
    },
    onSuccess: () => { invalidate(); toast.success('Template created'); },
    onError: () => toast.error('Failed to create template'),
  });

  const updateTemplate = useMutation({
    mutationKey: ['templates', 'update'],
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTemplateData> }) => {
      const { data: template, error } = await supabase
        .from('shift_templates').update(data).eq('id', id).select().single();
      if (error) throw error;
      return template as ShiftTemplate;
    },
    onSuccess: () => { invalidate(); toast.success('Template updated'); },
    onError: () => toast.error('Failed to update template'),
  });

  const deleteTemplate = useMutation({
    mutationKey: ['templates', 'delete'],
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shift_templates').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Template deleted'); },
    onError: () => toast.error('Failed to delete template'),
  });

  return {
    templates: query.data ?? [],
    loading: query.isLoading,
    createTemplate: (data: CreateTemplateData) => createTemplate.mutateAsync(data).catch(() => null),
    updateTemplate: (id: string, data: Partial<CreateTemplateData>) =>
      updateTemplate.mutateAsync({ id, data }).catch(() => null),
    deleteTemplate: (id: string) => deleteTemplate.mutateAsync(id).then(() => true).catch(() => false),
    refetch: () => query.refetch(),
  };
};
