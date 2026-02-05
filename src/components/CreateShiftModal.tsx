 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { Calendar, Clock, MapPin, Briefcase, Loader2 } from 'lucide-react';
 import { CreateShiftData, DatabaseShift } from '@/hooks/useShifts';
 import { TeamMember } from '@/hooks/useTeamMembers';
 
 interface CreateShiftModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSubmit: (data: CreateShiftData) => Promise<DatabaseShift | null>;
   workers: TeamMember[];
   editingShift?: DatabaseShift | null;
 }
 
 export const CreateShiftModal = ({
   open,
   onOpenChange,
   onSubmit,
   workers,
   editingShift,
 }: CreateShiftModalProps) => {
   const [loading, setLoading] = useState(false);
   const [formData, setFormData] = useState<CreateShiftData>(() => 
     editingShift ? {
       date: editingShift.date,
       start_time: editingShift.start_time,
       end_time: editingShift.end_time,
       position: editingShift.position,
       location: editingShift.location,
       notes: editingShift.notes || '',
       assigned_worker_id: editingShift.assigned_worker_id || undefined,
       latitude: editingShift.latitude || undefined,
       longitude: editingShift.longitude || undefined,
       check_in_radius_meters: editingShift.check_in_radius_meters || 100,
     } : {
       date: new Date().toISOString().split('T')[0],
       start_time: '09:00',
       end_time: '17:00',
       position: '',
       location: '',
       notes: '',
       check_in_radius_meters: 100,
     }
   );
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     await onSubmit(formData);
     setLoading(false);
     onOpenChange(false);
   };
 
   const updateField = <K extends keyof CreateShiftData>(
     field: K,
     value: CreateShiftData[K]
   ) => {
     setFormData(prev => ({ ...prev, [field]: value }));
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>{editingShift ? 'Edit Shift' : 'Create New Shift'}</DialogTitle>
           <DialogDescription>
             {editingShift ? 'Update the shift details below.' : 'Fill in the details for the new shift.'}
           </DialogDescription>
         </DialogHeader>
 
         <form onSubmit={handleSubmit} className="space-y-4">
           {/* Date */}
           <div className="space-y-2">
             <Label htmlFor="date" className="flex items-center gap-2">
               <Calendar className="w-4 h-4" />
               Date
             </Label>
             <Input
               id="date"
               type="date"
               value={formData.date}
               onChange={(e) => updateField('date', e.target.value)}
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
                 onChange={(e) => updateField('start_time', e.target.value)}
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="end_time">End Time</Label>
               <Input
                 id="end_time"
                 type="time"
                 value={formData.end_time}
                 onChange={(e) => updateField('end_time', e.target.value)}
                 required
               />
             </div>
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
               onChange={(e) => updateField('position', e.target.value)}
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
               onChange={(e) => updateField('location', e.target.value)}
               required
             />
           </div>
 
           {/* Location Coordinates for Check-in */}
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="latitude">Latitude (optional)</Label>
               <Input
                 id="latitude"
                 type="number"
                 step="0.000001"
                 placeholder="37.7749"
                 value={formData.latitude || ''}
                 onChange={(e) => updateField('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
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
                 onChange={(e) => updateField('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
               />
             </div>
           </div>
 
           {/* Check-in Radius */}
           <div className="space-y-2">
             <Label htmlFor="radius">Check-in Radius (meters)</Label>
             <Input
               id="radius"
               type="number"
               min="10"
               max="1000"
               value={formData.check_in_radius_meters || 100}
               onChange={(e) => updateField('check_in_radius_meters', parseInt(e.target.value))}
             />
           </div>
 
           {/* Assign Worker */}
           <div className="space-y-2">
             <Label>Assign Worker (optional)</Label>
             <Select
               value={formData.assigned_worker_id || 'unassigned'}
               onValueChange={(value) => 
                 updateField('assigned_worker_id', value === 'unassigned' ? undefined : value)
               }
             >
               <SelectTrigger>
                 <SelectValue placeholder="Leave vacant" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="unassigned">Leave vacant</SelectItem>
                 {workers.map((worker) => (
                   <SelectItem key={worker.id} value={worker.id}>
                     {worker.full_name} - {worker.position || 'No position'}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Notes */}
           <div className="space-y-2">
             <Label htmlFor="notes">Notes (optional)</Label>
             <Textarea
               id="notes"
               placeholder="Any additional information..."
               value={formData.notes}
               onChange={(e) => updateField('notes', e.target.value)}
               rows={3}
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
                   {editingShift ? 'Saving...' : 'Creating...'}
                 </>
               ) : (
                 editingShift ? 'Save Changes' : 'Create Shift'
               )}
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 };