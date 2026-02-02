import { 
  Worker, 
  Manager, 
  Shift, 
  AttendanceRecord, 
  SwapRequest, 
  Notification,
  StaffingHealth,
  ShiftMessage
} from '@/types/align';

// Mock Workers
export const workers: Worker[] = [
  {
    id: 'w1',
    name: 'Sarah Chen',
    role: 'worker',
    email: 'sarah.chen@email.com',
    phone: '+1 555-0101',
    avatar: '',
    weeklyHoursWorked: 28,
    weeklyHoursTarget: 32,
    willingnessForExtra: 'high',
    reliabilityScore: 94,
    position: 'Server',
  },
  {
    id: 'w2',
    name: 'Marcus Johnson',
    role: 'worker',
    email: 'marcus.j@email.com',
    phone: '+1 555-0102',
    avatar: '',
    weeklyHoursWorked: 35,
    weeklyHoursTarget: 32,
    willingnessForExtra: 'medium',
    reliabilityScore: 88,
    position: 'Bartender',
  },
  {
    id: 'w3',
    name: 'Emily Rodriguez',
    role: 'worker',
    email: 'emily.r@email.com',
    phone: '+1 555-0103',
    avatar: '',
    weeklyHoursWorked: 24,
    weeklyHoursTarget: 40,
    willingnessForExtra: 'high',
    reliabilityScore: 96,
    position: 'Server',
  },
  {
    id: 'w4',
    name: 'James Kim',
    role: 'worker',
    email: 'james.kim@email.com',
    phone: '+1 555-0104',
    avatar: '',
    weeklyHoursWorked: 30,
    weeklyHoursTarget: 32,
    willingnessForExtra: 'low',
    reliabilityScore: 82,
    position: 'Host',
  },
  {
    id: 'w5',
    name: 'Olivia Martinez',
    role: 'worker',
    email: 'olivia.m@email.com',
    phone: '+1 555-0105',
    avatar: '',
    weeklyHoursWorked: 20,
    weeklyHoursTarget: 24,
    willingnessForExtra: 'medium',
    reliabilityScore: 91,
    position: 'Server',
  },
  {
    id: 'w6',
    name: 'David Thompson',
    role: 'worker',
    email: 'david.t@email.com',
    phone: '+1 555-0106',
    avatar: '',
    weeklyHoursWorked: 38,
    weeklyHoursTarget: 40,
    willingnessForExtra: 'low',
    reliabilityScore: 85,
    position: 'Line Cook',
  },
];

// Current logged-in worker (for demo)
export const currentWorker = workers[0];

// Mock Manager
export const currentManager: Manager = {
  id: 'm1',
  name: 'Alex Rivera',
  role: 'manager',
  email: 'alex.rivera@align.com',
  phone: '+1 555-0001',
  avatar: '',
  teamSize: 12,
  location: 'Downtown Bistro',
};

// Today's date helpers
const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];

// Mock Shifts
export const shifts: Shift[] = [
  {
    id: 's1',
    date: formatDate(today),
    startTime: '09:00',
    endTime: '15:00',
    position: 'Server',
    location: 'Main Floor',
    assignedWorker: workers[0],
    status: 'in_progress',
    isVacant: false,
  },
  {
    id: 's2',
    date: formatDate(today),
    startTime: '11:00',
    endTime: '19:00',
    position: 'Bartender',
    location: 'Bar',
    assignedWorker: workers[1],
    status: 'scheduled',
    isVacant: false,
  },
  {
    id: 's3',
    date: formatDate(today),
    startTime: '14:00',
    endTime: '22:00',
    position: 'Server',
    location: 'Patio',
    assignedWorker: undefined,
    status: 'scheduled',
    isVacant: true,
  },
  {
    id: 's4',
    date: formatDate(today),
    startTime: '17:00',
    endTime: '23:00',
    position: 'Host',
    location: 'Entrance',
    assignedWorker: workers[3],
    status: 'scheduled',
    isVacant: false,
  },
  {
    id: 's5',
    date: formatDate(today),
    startTime: '10:00',
    endTime: '16:00',
    position: 'Line Cook',
    location: 'Kitchen',
    assignedWorker: workers[5],
    status: 'in_progress',
    isVacant: false,
  },
  {
    id: 's6',
    date: formatDate(today),
    startTime: '18:00',
    endTime: '00:00',
    position: 'Server',
    location: 'Main Floor',
    assignedWorker: undefined,
    status: 'scheduled',
    isVacant: true,
  },
  // Tomorrow's shifts
  {
    id: 's7',
    date: formatDate(new Date(today.getTime() + 86400000)),
    startTime: '08:00',
    endTime: '14:00',
    position: 'Server',
    location: 'Main Floor',
    assignedWorker: workers[0],
    status: 'scheduled',
    isVacant: false,
  },
  {
    id: 's8',
    date: formatDate(new Date(today.getTime() + 86400000)),
    startTime: '12:00',
    endTime: '20:00',
    position: 'Bartender',
    location: 'Bar',
    assignedWorker: workers[1],
    status: 'scheduled',
    isVacant: false,
  },
  // Day after tomorrow
  {
    id: 's9',
    date: formatDate(new Date(today.getTime() + 172800000)),
    startTime: '16:00',
    endTime: '22:00',
    position: 'Server',
    location: 'Patio',
    assignedWorker: workers[0],
    status: 'scheduled',
    isVacant: false,
  },
];

// Mock Attendance Records
export const attendanceRecords: AttendanceRecord[] = [
  {
    id: 'a1',
    shiftId: 's1',
    workerId: 'w1',
    status: 'present',
    checkInTime: '08:57',
    isProximityBased: true,
  },
  {
    id: 'a2',
    shiftId: 's5',
    workerId: 'w6',
    status: 'late',
    checkInTime: '10:12',
    isProximityBased: true,
    notes: 'Traffic delay - 12 min late',
  },
  {
    id: 'a3',
    shiftId: 's2',
    workerId: 'w2',
    status: 'not_checked_in',
    isProximityBased: false,
  },
  {
    id: 'a4',
    shiftId: 's4',
    workerId: 'w4',
    status: 'not_checked_in',
    isProximityBased: false,
  },
];

// Mock Swap Requests
export const swapRequests: SwapRequest[] = [
  {
    id: 'sr1',
    shiftId: 's7',
    requesterId: 'w1',
    requestedWorkerId: 'w2',
    reason: 'Doctor appointment',
    status: 'pending',
    createdAt: new Date(today.getTime() - 3600000).toISOString(),
    isOpenToAll: false,
    suggestedReplacements: [workers[2], workers[4]],
  },
];

// Mock Notifications
export const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'swap_request',
    title: 'Swap Request',
    message: 'Marcus wants to swap shifts with you for tomorrow',
    read: false,
    createdAt: new Date(today.getTime() - 1800000).toISOString(),
    relatedShiftId: 's7',
  },
  {
    id: 'n2',
    type: 'shift_assigned',
    title: 'New Shift',
    message: 'You\'ve been assigned a shift on Saturday',
    read: true,
    createdAt: new Date(today.getTime() - 86400000).toISOString(),
  },
  {
    id: 'n3',
    type: 'reminder',
    title: 'Shift Reminder',
    message: 'Your shift starts in 30 minutes',
    read: true,
    createdAt: new Date(today.getTime() - 7200000).toISOString(),
  },
];

// Manager notifications
export const managerNotifications: Notification[] = [
  {
    id: 'mn1',
    type: 'swap_request',
    title: 'Swap Request Pending',
    message: 'Sarah Chen requested a swap for tomorrow\'s shift',
    read: false,
    createdAt: new Date(today.getTime() - 1800000).toISOString(),
    relatedShiftId: 's7',
  },
  {
    id: 'mn2',
    type: 'message',
    title: 'Call-off Alert',
    message: 'Evening server shift is now vacant',
    read: false,
    createdAt: new Date(today.getTime() - 3600000).toISOString(),
    relatedShiftId: 's6',
  },
];

// Mock Messages
export const shiftMessages: ShiftMessage[] = [
  {
    id: 'msg1',
    shiftId: 's1',
    senderId: 'm1',
    senderName: 'Alex Rivera',
    message: 'Please remember we have a large party at 12pm today.',
    createdAt: new Date(today.getTime() - 7200000).toISOString(),
  },
];

// Today's Staffing Health
export const todayStaffingHealth: StaffingHealth = {
  totalShifts: 6,
  filledShifts: 4,
  vacantShifts: 2,
  status: 'near_capacity',
  shortBy: 2,
};

// Helper function to get shifts for a specific worker
export const getWorkerShifts = (workerId: string) => {
  return shifts.filter(s => s.assignedWorker?.id === workerId);
};

// Helper function to get today's shifts
export const getTodayShifts = () => {
  const todayStr = formatDate(today);
  return shifts.filter(s => s.date === todayStr);
};

// Helper function to get upcoming shifts for a worker
export const getUpcomingWorkerShifts = (workerId: string) => {
  const todayStr = formatDate(today);
  return shifts.filter(s => s.assignedWorker?.id === workerId && s.date >= todayStr);
};

// Helper function to get attendance for a shift
export const getAttendanceForShift = (shiftId: string) => {
  return attendanceRecords.find(a => a.shiftId === shiftId);
};

// Suggested replacements based on availability and reliability
export const getSuggestedReplacements = (excludeWorkerId: string) => {
  return workers
    .filter(w => w.id !== excludeWorkerId)
    .filter(w => w.weeklyHoursWorked < w.weeklyHoursTarget)
    .sort((a, b) => {
      // Prioritize by: willingness, reliability, available hours
      const willingnessScore = { high: 3, medium: 2, low: 1 };
      const aScore = willingnessScore[a.willingnessForExtra] * 10 + a.reliabilityScore / 10;
      const bScore = willingnessScore[b.willingnessForExtra] * 10 + b.reliabilityScore / 10;
      return bScore - aScore;
    })
    .slice(0, 3);
};
