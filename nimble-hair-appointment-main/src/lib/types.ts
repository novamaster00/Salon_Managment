
export type UserRole = 'customer' | 'barber' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
<<<<<<< HEAD
=======
  success?:boolean;
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
}

export interface Barber {
  _id: string;
  name: string;
  email: string;
}

export interface Appointment {
  _id: string;
  name: string;
  phoneNumber: string;
  contact: string; // email
  barberId: string;
  service: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  status: AppointmentStatus;
  tokenNumber?: string;
<<<<<<< HEAD
=======
  
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
}

export interface WalkIn {
  _id: string;
  name: string ;
  customerName: string;
  phoneNumber: string;
  email: string;
  service: string;
  barberId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  tokenNumber: string;
}

export type AppointmentStatus = 'confirmed'|'pending_approval' | 'waiting' | 'ongoing' | 'completed' | 'cancelled'|'no-show'|'approved'|'rejected';


export interface Barber {
  _id: string;
  name: string;
  specialty?: string;
  availability?: string[];
  image?: string;
}

export interface QueueEntry {
  _id: string;
  barberId: string;
  date: string;
  tokenNumber: string;
  sourceType: 'appointment' | 'walkin';
  sourceId: string;
  estimatedTime: number;
  estimatedStartTime?: string;
  position: number;
  status: AppointmentStatus;
  startTime?: string;  // Make this optional since it might not be present
  endTime?: string;    // Make this optional since it might not be present
  createdAt: string;
  updatedAt: string;
  service?: string;
  sourceData?: {
    _id?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    barberId?: string;
    date?: string;
    startTime?: string;  // This is directly on sourceData as seen in the API response
    endTime?: string;    // This is directly on sourceData as seen in the API response
    estimatedTime?: number;
    service?: string;
    status?: string;
    notes?: string;
    tokenNumber?: string;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
    // Keep customerId for backward compatibility if needed
    customerId?: {
      name: string;
      email: string;
      phoneNumber: string;
      startTime?: string;
      endTime?: string;
    };
  };
}

export interface WorkingHours {
  _id: string;
  barberId: string | { _id: string; name: string };
  date: string;
  startTime: string;
  endTime: string;
}

export interface WorkingHoursInput {
  barberId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface Barber {
  _id: string;
  name: string;
}

export interface BlockedSlot {
  _id: string;
  barberId: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  date:string;
}

export interface AppointmentForm {
  _id?:string,
  name: string;
  phoneNumber: string;
  email: string; // email
  barberId: string;
  service: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm,
  status?: 'pending' | 'confirmed' | 'cancelled',
  isAvailable: boolean;
}

export interface WalkInForm {
  name: string;
  phoneNumber: string;
  email: string;
  service: string;
}

export interface AvailableSlotRequest {
  barberId: string;
  date: string; // YYYY-MM-DD
  requestedTime: string; // HH:mm
  service:string;
<<<<<<< HEAD
=======
  // email:string;//new add on because of reservation system. 
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
}

export interface StatusUpdateRequest {
  id: string;
  status: AppointmentStatus;
  appointmentId?:string;
  walkinId?:string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  phoneNumber?: string;
}

// You might also need this for the profile API responses
export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: UserRole;
}

export interface DashboardResponse {
  success: boolean;
  data: {
    date: string;
    workingHours: WorkingHours | null;
    metrics: {
      totalAppointments: number;
      totalWalkIns: number;
      pendingApprovals: number;
      inQueue: number;
      completed: number;
    };
    pendingAppointments: any[];
    currentService: null | any;
    waitingQueue: Array<QueueEntry>;
    completedServices: any[];
<<<<<<< HEAD
    queue: QueueEntry[];
  };
}
=======
    WalkIn: any[]; // Add this line to fix the TypeScript error
    queue: QueueEntry[];
 
  }
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ValidateTokenResponse {
  success: boolean;
  message: string;
  email?: string;
  remainingMinutes?: number;
}
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
