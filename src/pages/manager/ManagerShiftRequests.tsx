import { useState } from 'react';
import { ManagerRequestsSkeleton } from '@/components/PageSkeletons';
import { useShiftRequests } from '@/hooks/useShiftRequests';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import {
  ChevronLeft,
  Loader2,
  User,
  Calendar,
  MapPin,
  Check,
  X,
  Clock,
  HandHelping,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { ShiftRequest } from '@/hooks/useShiftRequests';

export const ManagerShiftRequests = () => {
  const navigate = useNavigate();
  const { requests, loading, approveRequest, declineRequest, pendingRequests } = useShiftRequests();
  const [selectedRequest, setSelectedRequest] = useState<ShiftRequest | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    const success = await approveRequest(
      selectedRequest.id, 
      selectedRequest.shift_id, 
      selectedRequest.worker_id
    );
    setProcessing(false);
    if (success) {
      setSelectedRequest(null);
    }
  };

  const handleDecline = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    const success = await declineRequest(selectedRequest.id);
    setProcessing(false);
    if (success) {
      setSelectedRequest(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  if (loading) return <ManagerRequestsSkeleton />;

  const pendingList = requests.filter(r => r.status === 'pending');
  const reviewedList = requests.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/manager')}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors lg:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <HandHelping className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Shift Requests</h1>
          </div>
          {pendingList.length > 0 && (
            <span className="ml-auto text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
              {pendingList.length} pending
            </span>
          )}
        </div>
      </header>

      <div className="px-4 lg:px-8 py-6">
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending ({pendingList.length})</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed ({reviewedList.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingList.length > 0 ? (
              pendingList.map(request => (
                <Card 
                  key={request.id}
                  className="cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => setSelectedRequest(request)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{request.worker?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{request.worker?.position || 'Team Member'}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {request.shift && formatDate(request.shift.date)}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {request.shift?.start_time} - {request.shift?.end_time}
                          </span>
                        </div>
                        {request.notes && (
                          <p className="mt-2 text-xs text-muted-foreground italic">"{request.notes}"</p>
                        )}
                      </div>
                      <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded-full">
                        Pending
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <HandHelping className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No pending requests</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Workers can request open shifts from their shifts page
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviewed" className="space-y-4">
            {reviewedList.length > 0 ? (
              reviewedList.map(request => (
                <Card key={request.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{request.worker?.full_name}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {request.shift && formatDate(request.shift.date)}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            {request.shift?.position}
                          </span>
                        </div>
                      </div>
                      <span className={cn(
                        'text-xs font-medium px-2 py-1 rounded-full',
                        request.status === 'approved' 
                          ? 'text-primary bg-primary/10' 
                          : 'text-destructive bg-destructive/10'
                      )}>
                        {request.status === 'approved' ? 'Approved' : 'Declined'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No reviewed requests yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Shift Request</DialogTitle>
            <DialogDescription>
              Review and respond to this shift request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 pt-4">
              {/* Worker Info */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{selectedRequest.worker?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.worker?.position || 'Team Member'}
                  </p>
                </div>
              </div>

              {/* Shift Info */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">REQUESTED SHIFT</p>
                <div className="p-4 rounded-xl border border-border/50">
                  <p className="font-medium">{selectedRequest.shift?.position}</p>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {selectedRequest.shift && formatDate(selectedRequest.shift.date)}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {selectedRequest.shift?.start_time} - {selectedRequest.shift?.end_time}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {selectedRequest.shift?.location}
                    </p>
                  </div>
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Note from worker:</p>
                  <p className="text-sm">"{selectedRequest.notes}"</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleDecline}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </>
                  )}
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleApprove}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerShiftRequests;
