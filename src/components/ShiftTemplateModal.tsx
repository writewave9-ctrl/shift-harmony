import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, MapPin, Briefcase, Loader2, FileText } from 'lucide-react';
import { ShiftTemplate, CreateTemplateData } from '@/hooks/useShiftTemplates';

interface ShiftTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTemplateData) => Promise<ShiftTemplate | null>;
  editingTemplate?: ShiftTemplate | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export const ShiftTemplateModal = ({
  open,
  onOpenChange,
  onSubmit,
  editingTemplate,
}: ShiftTemplateModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTemplateData>({
    name: '',
    position: '',
    location: '',
    start_time: '09:00',
    end_time: '17:00',
    notes: '',
    days_of_week: [],
    check_in_radius_meters: 100,
  });

  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        name: editingTemplate.name,
        position: editingTemplate.position,
        location: editingTemplate.location,
        start_time: editingTemplate.start_time,
        end_time: editingTemplate.end_time,
        latitude: editingTemplate.latitude || undefined,
        longitude: editingTemplate.longitude || undefined,
        check_in_radius_meters: editingTemplate.check_in_radius_meters || 100,
        notes: editingTemplate.notes || '',
        days_of_week: editingTemplate.days_of_week || [],
      });
    } else {
      setFormData({
        name: '',
        position: '',
        location: '',
        start_time: '09:00',
        end_time: '17:00',
        notes: '',
        days_of_week: [],
        check_in_radius_meters: 100,
      });
    }
  }, [editingTemplate, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
    onOpenChange(false);
  };

  const toggleDay = (day: number) => {
    const days = formData.days_of_week || [];
    if (days.includes(day)) {
      setFormData(prev => ({ ...prev, days_of_week: days.filter(d => d !== day) }));
    } else {
      setFormData(prev => ({ ...prev, days_of_week: [...days, day].sort() }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Shift Template'}</DialogTitle>
          <DialogDescription>
            {editingTemplate 
              ? 'Update template details for recurring shifts.'
              : 'Save a template to quickly create recurring shifts.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Template Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Morning Shift, Weekend Coverage"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Position
            </Label>
            <Input
              id="position"
              placeholder="e.g., Barista, Cashier, Server"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="e.g., Main Store, Downtown Branch"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              required
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Start Time
              </Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Days of Week */}
          <div className="space-y-2">
            <Label>Recurring Days (optional)</Label>
            <div className="flex gap-2 flex-wrap">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`
                    w-10 h-10 rounded-lg text-sm font-medium transition-all
                    ${formData.days_of_week?.includes(day.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                    }
                  `}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude (optional)</Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                placeholder="37.7749"
                value={formData.latitude || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  latitude: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude (optional)</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                placeholder="-122.4194"
                value={formData.longitude || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  longitude: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingTemplate ? 'Save Changes' : 'Create Template'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
