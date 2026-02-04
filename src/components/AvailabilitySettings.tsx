import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Check
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AvailabilityBlock {
  id: string;
  type: 'recurring' | 'specific';
  dayOfWeek?: number;
  specificDate?: Date;
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
  const [open, setOpen] = useState(false);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([
    {
      id: '1',
      type: 'recurring',
      dayOfWeek: 0, // Sunday
      startTime: '00:00',
      endTime: '23:59',
      notes: 'Not available on Sundays',
    },
  ]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBlock, setNewBlock] = useState<Partial<AvailabilityBlock>>({
    type: 'recurring',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
  });

  const handleAddBlock = () => {
    if (!newBlock.startTime || !newBlock.endTime) return;

    const block: AvailabilityBlock = {
      id: Date.now().toString(),
      type: newBlock.type || 'recurring',
      dayOfWeek: newBlock.type === 'recurring' ? newBlock.dayOfWeek : undefined,
      specificDate: newBlock.type === 'specific' ? newBlock.specificDate : undefined,
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      notes: newBlock.notes,
    };

    setBlocks([...blocks, block]);
    setShowAddForm(false);
    setNewBlock({
      type: 'recurring',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
    });

    toast({
      title: 'Availability updated',
      description: 'Your blocked time has been saved.',
    });
  };

  const handleRemoveBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    toast({
      title: 'Block removed',
      description: 'Your availability has been updated.',
    });
  };

  const formatBlockTitle = (block: AvailabilityBlock) => {
    if (block.type === 'recurring' && block.dayOfWeek !== undefined) {
      return `Every ${DAYS_OF_WEEK[block.dayOfWeek]}`;
    }
    if (block.type === 'specific' && block.specificDate) {
      return format(block.specificDate, 'MMM d, yyyy');
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

          {/* Existing Blocks */}
          <div className="space-y-3">
            {blocks.map(block => (
              <div
                key={block.id}
                className="p-4 rounded-xl border border-border bg-card"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {formatBlockTitle(block)}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{block.startTime} - {block.endTime}</span>
                    </div>
                    {block.notes && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {block.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveBlock(block.id)}
                  >
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
                  <Button
                    type="button"
                    variant={newBlock.type === 'recurring' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewBlock({ ...newBlock, type: 'recurring' })}
                  >
                    Weekly
                  </Button>
                  <Button
                    type="button"
                    variant={newBlock.type === 'specific' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewBlock({ ...newBlock, type: 'specific' })}
                  >
                    Specific Date
                  </Button>
                </div>
              </div>

              {newBlock.type === 'recurring' ? (
                <div className="space-y-3">
                  <Label>Day of Week</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day, index) => (
                      <Button
                        key={day}
                        type="button"
                        variant={newBlock.dayOfWeek === index ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewBlock({ ...newBlock, dayOfWeek: index })}
                      >
                        {day.slice(0, 3)}
                      </Button>
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
                        {newBlock.specificDate 
                          ? format(newBlock.specificDate, 'PPP')
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newBlock.specificDate}
                        onSelect={(date) => setNewBlock({ ...newBlock, specificDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={newBlock.startTime}
                    onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={newBlock.endTime}
                    onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  placeholder="e.g., Personal commitment"
                  value={newBlock.notes || ''}
                  onChange={(e) => setNewBlock({ ...newBlock, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddBlock}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-12 border-dashed"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Blocked Time
            </Button>
          )}

          {/* Info */}
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
