import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Ban,
  Check,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AvailabilityBlock {
  id: string;
  type: 'recurring' | 'specific';
  dayOfWeek?: number;
  specificDate?: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

interface AvailabilitySettingsProps {
  trigger?: React.ReactNode;
}

export const AvailabilitySettings = ({ trigger }: AvailabilitySettingsProps) => {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBlockType, setNewBlockType] = useState<'recurring' | 'specific'>('recurring');
  const [newBlockDay, setNewBlockDay] = useState(1);
  const [newBlockDate, setNewBlockDate] = useState<Date | undefined>();
  const [newBlockStart, setNewBlockStart] = useState('09:00');
  const [newBlockEnd, setNewBlockEnd] = useState('17:00');
  const [newBlockNotes, setNewBlockNotes] = useState('');

  const fetchBlocks = useCallback(async () => {
    if (!profile?.id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('worker_id', profile.id)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      setBlocks((data || []).map(d => ({
        id: d.id,
        type: d.specific_date ? 'specific' : 'recurring',
        dayOfWeek: d.day_of_week ?? undefined,
        specificDate: d.specific_date ?? undefined,
        startTime: d.start_time || '00:00',
        endTime: d.end_time || '23:59',
        notes: d.notes ?? undefined,
      })));
    } catch (err) {
      console.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { if (open) fetchBlocks(); }, [open, fetchBlocks]);

  const handleAddBlock = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const insertData: any = {
        worker_id: profile.id,
        availability_type: 'blocked',
        start_time: newBlockStart,
        end_time: newBlockEnd,
        notes: newBlockNotes || null,
      };

      if (newBlockType === 'recurring') {
        insertData.day_of_week = newBlockDay;
      } else if (newBlockDate) {
        insertData.specific_date = format(newBlockDate, 'yyyy-MM-dd');
      }

      const { data, error } = await supabase
        .from('availability_settings')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setBlocks(prev => [...prev, {
        id: data.id,
        type: newBlockType,
        dayOfWeek: data.day_of_week ?? undefined,
        specificDate: data.specific_date ?? undefined,
        startTime: data.start_time || '00:00',
        endTime: data.end_time || '23:59',
        notes: data.notes ?? undefined,
      }]);

      setShowAddForm(false);
      setNewBlockNotes('');
      toast({ title: 'Availability updated', description: 'Your blocked time has been saved.' });
    } catch (err) {
      console.error('Error adding block:', err);
      toast({ title: 'Error', description: 'Failed to save availability.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBlock = async (id: string) => {
    try {
      const { error } = await supabase
        .from('availability_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBlocks(prev => prev.filter(b => b.id !== id));
      toast({ title: 'Block removed', description: 'Your availability has been updated.' });
    } catch (err) {
      console.error('Error removing block:', err);
      toast({ title: 'Error', description: 'Failed to remove block.', variant: 'destructive' });
    }
  };

  const formatBlockTitle = (block: AvailabilityBlock) => {
    if (block.type === 'recurring' && block.dayOfWeek !== undefined) {
      return `Every ${DAYS_OF_WEEK[block.dayOfWeek]}`;
    }
    if (block.type === 'specific' && block.specificDate) {
      return format(new Date(block.specificDate), 'MMM d, yyyy');
    }
    return 'Time Block';
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <CalendarIcon className="w-4 h-4" />
            Availability
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-primary" />
            Blocked Times
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Set times when you're not available to work. Managers will see these when assigning shifts.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Existing Blocks */}
              <div className="space-y-3">
                {blocks.map(block => (
                  <div key={block.id} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">{formatBlockTitle(block)}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{block.startTime} - {block.endTime}</span>
                        </div>
                        {block.notes && <p className="text-xs text-muted-foreground mt-2">{block.notes}</p>}
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveBlock(block.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Block Form */}
              {showAddForm ? (
                <div className="p-4 rounded-xl border-2 border-dashed border-primary/50 space-y-4">
                  <div className="space-y-3">
                    <Label>Block Type</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant={newBlockType === 'recurring' ? 'default' : 'outline'} size="sm" onClick={() => setNewBlockType('recurring')}>Weekly</Button>
                      <Button type="button" variant={newBlockType === 'specific' ? 'default' : 'outline'} size="sm" onClick={() => setNewBlockType('specific')}>Specific Date</Button>
                    </div>
                  </div>

                  {newBlockType === 'recurring' ? (
                    <div className="space-y-3">
                      <Label>Day of Week</Label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day, index) => (
                          <Button key={day} type="button" variant={newBlockDay === index ? 'default' : 'outline'} size="sm" onClick={() => setNewBlockDay(index)}>{day.slice(0, 3)}</Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {newBlockDate ? format(newBlockDate, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={newBlockDate} onSelect={setNewBlockDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input type="time" value={newBlockStart} onChange={(e) => setNewBlockStart(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input type="time" value={newBlockEnd} onChange={(e) => setNewBlockEnd(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Input placeholder="e.g., Personal commitment" value={newBlockNotes} onChange={(e) => setNewBlockNotes(e.target.value)} />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowAddForm(false)}>Cancel</Button>
                    <Button className="flex-1" onClick={handleAddBlock} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full h-12 border-dashed" onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Blocked Time
                </Button>
              )}
            </>
          )}

          <div className="p-4 rounded-xl bg-info-muted">
            <p className="text-sm text-info">
              <strong>Tip:</strong> You can add multiple blocks for the same day if needed. 
              Managers will be notified if they try to assign you during blocked times.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
