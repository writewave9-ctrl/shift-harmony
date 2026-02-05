 import { useState } from 'react';
 import { cn } from '@/lib/utils';
 import { StatusBadge } from '@/components/StatusBadge';
 import { WorkerCard } from '@/components/WorkerCard';
 import { WeeklyCalendar } from '@/components/WeeklyCalendar';
 import { AttendanceOverrideModal } from '@/components/AttendanceOverrideModal';
 import { ShiftMessaging } from '@/components/ShiftMessaging';
 import { CreateShiftModal } from '@/components/CreateShiftModal';
 import { useShifts, DatabaseShift, CreateShiftData } from '@/hooks/useShifts';
 import { useTeamMembers } from '@/hooks/useTeamMembers';
 import { useAuth } from '@/contexts/AuthContext';
 import { 
   ChevronLeft, 
   Calendar,
   Plus,
   User,
   Check,
   Filter,
   LayoutGrid,
   List,
   MessageCircle,
   UserCheck,
   Loader2,
   Pencil,
   Trash2
 } from 'lucide-react';
 import { useNavigate } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { AttendanceStatus, ShiftMessage, Shift, Worker } from '@/types/align';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
 } from '@/components/ui/dialog';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
 
 type ViewMode = 'list' | 'calendar';
 
 export const ManagerShifts = () => {
   const navigate = useNavigate();
   const { profile } = useAuth();
   const { shifts, loading, createShift, updateShift, deleteShift, assignWorker } = useShifts();
   const { workers } = useTeamMembers();
   
   const [selectedShift, setSelectedShift] = useState<DatabaseShift | null>(null);
   const [showAssignDialog, setShowAssignDialog] = useState(false);
   const [showOverrideModal, setShowOverrideModal] = useState(false);
   const [showMessaging, setShowMessaging] = useState(false);
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
   const [editingShift, setEditingShift] = useState<DatabaseShift | null>(null);
   const [assignmentDone, setAssignmentDone] = useState(false);
   const [filter, setFilter] = useState<'all' | 'vacant'>('all');
   const [viewMode, setViewMode] = useState<ViewMode>('list');
   const [messages, setMessages] = useState<ShiftMessage[]>([]);
 
   const filteredShifts = filter === 'vacant' 
     ? shifts.filter(s => s.is_vacant)
     : shifts;
 
   const formatDate = (dateStr: string) => {
     const date = new Date(dateStr);
     const today = new Date();
     const tomorrow = new Date(today);
     tomorrow.setDate(tomorrow.getDate() + 1);
 
     if (date.toDateString() === today.toDateString()) return 'Today';
     if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
     return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
   };
 
   const shiftsByDate = filteredShifts.reduce((acc, shift) => {
     const date = shift.date;
     if (!acc[date]) acc[date] = [];
     acc[date].push(shift);
     return acc;
   }, {} as Record<string, DatabaseShift[]>);
 
   const handleAssign = async (workerId: string) => {
     if (!selectedShift) return;
     await assignWorker(selectedShift.id, workerId);
     setAssignmentDone(true);
     setTimeout(() => {
       setShowAssignDialog(false);
       setAssignmentDone(false);
       setSelectedShift(null);
     }, 1500);
   };
 
   const handleAttendanceOverride = async (status: AttendanceStatus, notes: string, timestamp: string) => {
     if (!selectedShift || !profile?.id || !selectedShift.assigned_worker_id) return;
     
     try {
       const { error } = await supabase
         .from('attendance_records')
         .upsert({
           shift_id: selectedShift.id,
           worker_id: selectedShift.assigned_worker_id,
           status,
           override_notes: notes,
           override_timestamp: timestamp,
           manual_override_by: profile.id,
         }, {
           onConflict: 'shift_id,worker_id',
         });
 
       if (error) throw error;
       toast.success('Attendance updated');
     } catch (err) {
       console.error('Error updating attendance:', err);
       toast.error('Failed to update attendance');
     }
   };
 
   const handleSendMessage = (message: string) => {
     if (!selectedShift || !profile?.id) return;
     const newMessage: ShiftMessage = {
       id: `msg_${Date.now()}`,
       shiftId: selectedShift.id,
       senderId: profile.id,
       senderName: profile.full_name,
       message,
       createdAt: new Date().toISOString(),
     };
     setMessages(prev => [...prev, newMessage]);
   };
 
   const handleShiftClick = (shift: DatabaseShift) => {
     setSelectedShift(shift);
     if (shift.is_vacant) {
       setShowAssignDialog(true);
     }
   };
 
   const handleCreateShift = async (data: CreateShiftData) => {
     return createShift(data);
   };
 
   const handleEditShift = async (data: CreateShiftData) => {
     if (!editingShift) return null;
     return updateShift(editingShift.id, data);
   };
 
   const handleDeleteShift = async () => {
     if (!selectedShift) return;
     await deleteShift(selectedShift.id);
     setShowDeleteDialog(false);
     setSelectedShift(null);
   };
 
   const toWorkerCardData = (member: any) => ({
     id: member.id,
     name: member.full_name,
     role: 'worker' as const,
     email: member.email,
     phone: member.phone || undefined,
     avatar: member.avatar_url || undefined,
     weeklyHoursWorked: 0,
     weeklyHoursTarget: member.weekly_hours_target || 40,
     willingnessForExtra: member.willingness_for_extra || 'medium',
     reliabilityScore: member.reliability_score || 80,
     position: member.position || 'Team Member',
   });
 
   const shiftsForCalendar: Shift[] = shifts.map(s => ({
     id: s.id,
     date: s.date,
     startTime: s.start_time,
     endTime: s.end_time,
     position: s.position,
     location: s.location,
     status: s.status,
     isVacant: s.is_vacant,
     notes: s.notes || undefined,
     assignedWorker: s.assigned_worker ? {
       id: s.assigned_worker.id,
       name: s.assigned_worker.full_name,
       role: 'worker',
       email: '',
       weeklyHoursWorked: 0,
       weeklyHoursTarget: 40,
       willingnessForExtra: 'medium',
       reliabilityScore: 80,
       position: s.assigned_worker.position || 'Team Member',
     } : undefined,
   }));
 
   const shiftMessages_filtered = messages.filter(m => m.shiftId === selectedShift?.id);
 
   if (loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background pb-8">
       <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-4 lg:px-8">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => navigate('/manager')}
               className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors lg:hidden"
             >
               <ChevronLeft className="w-5 h-5" />
             </button>
             <div>
               <h1 className="text-lg font-semibold text-foreground">Shifts</h1>
               <p className="text-xs text-muted-foreground">{filteredShifts.length} total</p>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <div className="flex items-center border border-border rounded-lg p-0.5">
               <Button
                 variant={viewMode === 'list' ? 'default' : 'ghost'}
                 size="icon"
                 className="h-8 w-8"
                 onClick={() => setViewMode('list')}
               >
                 <List className="w-4 h-4" />
               </Button>
               <Button
                 variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                 size="icon"
                 className="h-8 w-8"
                 onClick={() => setViewMode('calendar')}
               >
                 <LayoutGrid className="w-4 h-4" />
               </Button>
             </div>
             <Button
               variant={filter === 'vacant' ? 'default' : 'outline'}
               size="sm"
               onClick={() => setFilter(filter === 'vacant' ? 'all' : 'vacant')}
               className="gap-1.5"
             >
               <Filter className="w-4 h-4" />
               {filter === 'vacant' ? 'Vacant' : 'All'}
             </Button>
             <Button size="sm" className="gap-1.5" onClick={() => setShowCreateModal(true)}>
               <Plus className="w-4 h-4" />
               <span className="hidden sm:inline">New Shift</span>
             </Button>
           </div>
         </div>
       </header>
 
       <div className="px-4 py-6 lg:px-8 space-y-6">
         {viewMode === 'calendar' && (
           <WeeklyCalendar 
             shifts={shiftsForCalendar} 
             onShiftClick={(shift) => {
               const dbShift = shifts.find(s => s.id === shift.id);
               if (dbShift) handleShiftClick(dbShift);
             }}
           />
         )}
 
         {viewMode === 'list' && (
           <>
             {Object.entries(shiftsByDate).map(([date, dateShifts]) => (
               <section key={date}>
                 <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                   <Calendar className="w-4 h-4" />
                   {formatDate(date)}
                 </h2>
                 <div className="space-y-3">
                   {dateShifts.map(shift => (
                     <div
                       key={shift.id}
                       className={cn(
                         'card-elevated rounded-xl p-4',
                         shift.is_vacant && 'border-warning/40 bg-warning-muted/20'
                       )}
                     >
                       <div className="flex items-start justify-between mb-2">
                         <div>
                           <h3 className="font-semibold text-foreground">{shift.position}</h3>
                           <p className="text-sm text-muted-foreground">
                             {shift.start_time} - {shift.end_time} • {shift.location}
                           </p>
                         </div>
                         {shift.is_vacant ? (
                           <span className="px-2.5 py-1 text-xs font-medium text-warning bg-warning/10 rounded-full border border-warning/20">
                             Needs Coverage
                           </span>
                         ) : (
                           <StatusBadge status="not_checked_in" />
                         )}
                       </div>
                       {shift.assigned_worker && (
                         <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                           <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                             <User className="w-3.5 h-3.5 text-primary" />
                           </div>
                           <span className="text-sm text-muted-foreground">
                             {shift.assigned_worker.full_name}
                           </span>
                         </div>
                       )}
                       
                       <div className="flex gap-2 mt-3">
                         {shift.is_vacant ? (
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="flex-1 gap-1.5"
                             onClick={() => {
                               setSelectedShift(shift);
                               setShowAssignDialog(true);
                             }}
                           >
                             <Plus className="w-4 h-4" />
                             Assign Worker
                           </Button>
                         ) : (
                           <>
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="flex-1 gap-1.5"
                               onClick={() => {
                                 setSelectedShift(shift);
                                 setShowOverrideModal(true);
                               }}
                             >
                               <UserCheck className="w-4 h-4" />
                               Attendance
                             </Button>
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="flex-1 gap-1.5"
                               onClick={() => {
                                 setSelectedShift(shift);
                                 setShowMessaging(true);
                               }}
                             >
                               <MessageCircle className="w-4 h-4" />
                               Message
                             </Button>
                           </>
                         )}
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-9 w-9"
                           onClick={() => {
                             setEditingShift(shift);
                             setShowCreateModal(true);
                           }}
                         >
                           <Pencil className="w-4 h-4" />
                         </Button>
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-9 w-9 text-destructive hover:text-destructive"
                           onClick={() => {
                             setSelectedShift(shift);
                             setShowDeleteDialog(true);
                           }}
                         >
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       </div>
                     </div>
                   ))}
                 </div>
               </section>
             ))}
 
             {filteredShifts.length === 0 && (
               <div className="text-center py-12">
                 <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                 <p className="text-muted-foreground">No shifts found</p>
                 <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                   <Plus className="w-4 h-4 mr-2" />
                   Create First Shift
                 </Button>
               </div>
             )}
           </>
         )}
       </div>
 
       <Dialog open={showAssignDialog} onOpenChange={(open) => {
         setShowAssignDialog(open);
         if (!open) setSelectedShift(null);
       }}>
         <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>Assign Worker</DialogTitle>
             <DialogDescription>
               {selectedShift && `${selectedShift.position} • ${selectedShift.start_time} - ${selectedShift.end_time}`}
             </DialogDescription>
           </DialogHeader>
 
           {assignmentDone ? (
             <div className="py-8 text-center">
               <div className="w-16 h-16 mx-auto rounded-full bg-success-muted flex items-center justify-center mb-4">
                 <Check className="w-8 h-8 text-success" />
               </div>
               <p className="font-semibold text-foreground">Worker Assigned!</p>
               <p className="text-sm text-muted-foreground mt-1">They've been notified of their shift</p>
             </div>
           ) : (
             <div className="space-y-4 pt-4">
               <div>
                 <p className="text-xs font-medium text-muted-foreground mb-2">RECOMMENDED</p>
                 <div className="space-y-2">
                   {workers.filter(w => w.willingness_for_extra === 'high').slice(0, 3).map(worker => (
                     <WorkerCard
                       key={worker.id}
                       worker={toWorkerCardData(worker)}
                       compact
                       onClick={() => handleAssign(worker.id)}
                     />
                   ))}
                 </div>
               </div>
 
               <div>
                 <p className="text-xs font-medium text-muted-foreground mb-2">ALL TEAM</p>
                 <div className="space-y-2">
                   {workers.filter(w => w.willingness_for_extra !== 'high').map(worker => (
                     <WorkerCard
                       key={worker.id}
                       worker={toWorkerCardData(worker)}
                       compact
                       onClick={() => handleAssign(worker.id)}
                     />
                   ))}
                 </div>
               </div>
             </div>
           )}
         </DialogContent>
       </Dialog>
 
       <AttendanceOverrideModal
         open={showOverrideModal}
         onOpenChange={setShowOverrideModal}
         shift={selectedShift ? {
           id: selectedShift.id,
           date: selectedShift.date,
           startTime: selectedShift.start_time,
           endTime: selectedShift.end_time,
           position: selectedShift.position,
           location: selectedShift.location,
           status: selectedShift.status,
           isVacant: selectedShift.is_vacant,
         } : null}
         worker={selectedShift?.assigned_worker ? {
           id: selectedShift.assigned_worker.id,
           name: selectedShift.assigned_worker.full_name,
           role: 'worker',
           email: '',
           weeklyHoursWorked: 0,
           weeklyHoursTarget: 40,
           willingnessForExtra: 'medium',
           reliabilityScore: 80,
           position: selectedShift.assigned_worker.position || 'Team Member',
         } : null}
         currentStatus={undefined}
         onOverride={handleAttendanceOverride}
       />
 
       <ShiftMessaging
         open={showMessaging}
         onOpenChange={setShowMessaging}
         shift={selectedShift ? {
           id: selectedShift.id,
           date: selectedShift.date,
           startTime: selectedShift.start_time,
           endTime: selectedShift.end_time,
           position: selectedShift.position,
           location: selectedShift.location,
           status: selectedShift.status,
           isVacant: selectedShift.is_vacant,
         } : null}
         messages={shiftMessages_filtered}
         currentUserId={profile?.id || ''}
         currentUserName={profile?.full_name || ''}
         onSendMessage={handleSendMessage}
       />
 
       <CreateShiftModal
         open={showCreateModal}
         onOpenChange={(open) => {
           setShowCreateModal(open);
           if (!open) setEditingShift(null);
         }}
         onSubmit={editingShift ? handleEditShift : handleCreateShift}
         workers={workers}
         editingShift={editingShift}
       />
 
       <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Shift?</AlertDialogTitle>
             <AlertDialogDescription>
               This will permanently delete this shift. This action cannot be undone.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={handleDeleteShift} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
               Delete
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   );
 };