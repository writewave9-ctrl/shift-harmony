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
  Loader2,
  LayoutGrid,
  List
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { formatTime } from '@/lib/formatTime';

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
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  
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
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-primary" />
              Availability
            </SheetTitle>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'calendar' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'list' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Set times when you're not available. Managers will see these when assigning shifts.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Calendar View */}
              {viewMode === 'calendar' && (
                <AvailabilityCalendar blocks={blocks} />
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-2">
                  {blocks.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No blocked times set. You're fully available!
                    </div>
                  ) : (
                    blocks.map(block => (
                      <div key={block.id} className="p-3.5 rounded-xl border border-border bg-card group">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground text-sm">{formatBlockTitle(block)}</p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{formatTime(block.startTime)} – {formatTime(block.endTime)}</span>
                            </div>
                            {block.notes && <p className="text-xs text-muted-foreground mt-1.5 truncate">{block.notes}</p>}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={() => handleRemoveBlock(block.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Add New Block Form */}
              {showAddForm ? (
                <div className="p-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/[0.02] space-y-4">
                  <div className="space-y-3">
                    <Label className="text-xs font-medium">Block Type</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant={newBlockType === 'recurring' ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setNewBlockType('recurring')}>Weekly</Button>
                      <Button type="button" variant={newBlockType === 'specific' ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setNewBlockType('specific')}>Specific Date</Button>
                    </div>
                  </div>

                  {newBlockType === 'recurring' ? (
                    <div className="space-y-3">
                      <Label className="text-xs font-medium">Day of Week</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {DAYS_OF_WEEK.map((day, index) => (
                          <Button key={day} type="button" variant={newBlockDay === index ? 'default' : 'outline'} size="sm" className="h-8 px-2.5 text-xs" onClick={() => setNewBlockDay(index)}>{day.slice(0, 3)}</Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-xs font-medium">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left text-sm">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {newBlockDate ? format(newBlockDate, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={newBlockDate} onSelect={setNewBlockDate} initialFocus className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Start</Label>
                      <Input type="time" value={newBlockStart} onChange={(e) => setNewBlockStart(e.target.value)} className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">End</Label>
                      <Input type="time" value={newBlockEnd} onChange={(e) => setNewBlockEnd(e.target.value)} className="text-sm" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Notes (Optional)</Label>
                    <Input placeholder="e.g., Personal commitment" value={newBlockNotes} onChange={(e) => setNewBlockNotes(e.target.value)} className="text-sm" />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                    <Button className="flex-1" size="sm" onClick={handleAddBlock} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full h-11 border-dashed text-sm" onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Blocked Time
                </Button>
              )}
            </>
          )}

          <div className="p-3.5 rounded-xl bg-info-muted">
            <p className="text-xs text-info leading-relaxed">
              <strong>Tip:</strong> Add multiple blocks per day if needed. 
              Managers will see these when scheduling shifts.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
