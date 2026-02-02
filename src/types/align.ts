// Align - Workforce Shift Management Types

export type UserRole = 'worker' | 'manager';

export type AttendanceStatus = 'present' | 'late' | 'not_checked_in' | 'manually_approved';

export type ShiftStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type SwapRequestStatus = 'pending' | 'approved' | 'declined' | 'expired';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  email: string;
  phone?: string;
}

export interface Worker extends User {
  role: 'worker';
  weeklyHoursWorked: number;
  weeklyHoursTarget: number;
  willingnessForExtra: 'low' | 'medium' | 'high';
  reliabilityScore: number; // 0-100, private
  position: string;
}

export interface Manager extends User {
  role: 'manager';
  teamSize: number;
  location: string;
}

export interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  location: string;
  assignedWorker?: Worker;
  status: ShiftStatus;
  isVacant: boolean;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  shiftId: string;
  workerId: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  isProximityBased: boolean;
  manualOverrideBy?: string;
  notes?: string;
}

export interface SwapRequest {
  id: string;
  shiftId: string;
  requesterId: string;
  requestedWorkerId?: string; // undefined if open to all
  reason: string;
  status: SwapRequestStatus;
  suggestedReplacements?: Worker[];
  createdAt: string;
  isOpenToAll: boolean;
}

export interface CallOffRequest {
  id: string;
  shiftId: string;
  workerId: string;
  reason: CallOffReason;
  customReason?: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
}

export type CallOffReason = 
  | 'sick'
  | 'family_emergency'
  | 'transportation'
  | 'personal'
  | 'other';

export interface Notification {
  id: string;
  type: 'swap_request' | 'shift_assigned' | 'approval' | 'reminder' | 'message';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  relatedShiftId?: string;
}

export interface ShiftMessage {
  id: string;
  shiftId: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface StaffingHealth {
  totalShifts: number;
  filledShifts: number;
  vacantShifts: number;
  status: 'fully_staffed' | 'near_capacity' | 'understaffed' | 'critical';
  shortBy: number;
}

export interface DaySchedule {
  date: string;
  shifts: Shift[];
  staffingHealth: StaffingHealth;
}
