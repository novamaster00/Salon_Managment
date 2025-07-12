
import { 
  AuthResponse, 
  Appointment, 
  WalkIn, 
  AvailableSlotRequest, 
  StatusUpdateRequest, 
  QueueEntry,
  Barber,
  WorkingHours,
  BlockedSlot,
  User,
  DashboardResponse ,
  AppointmentStatus,
  WorkingHoursInput
} from './types';

const API_URL = import.meta.env.VITE_BACKEND_URL; // Replace with actual API URL

// Helper function to handle API responses
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: any = new Error(`HTTP error! Status: ${response.status}`);
    error.status = response.status;
    
    try {
      const errorData = await response.json();
      error.message = errorData.message || error.message;
    } catch (e) {
      // If response isn't JSON, just use status text
    }
    
    throw error;
  }
  
  const data = await response.json();
  return data.data || data;
}

async function apiRequest<T>(
  endpoint: string, 
  method: string = 'POST', // Changed default to POST
  data?: any
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    method,
    headers,
    credentials: 'include',
    body: JSON.stringify(data || {}), // Always include a body for POST requests
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  
  return response.json();
}

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}
// Create headers with authorization token
function createHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  console.log('API login called with:', { email }); // Debug log
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    console.log('API response status:', response.status); // Debug log
    
    if (!response.ok) {
      // Try to get error message from response
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `API Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API response data:', data); // Debug response data
    
    // Validate response data has expected structure
    if (!data || !data.token || !data.user) {
      throw new Error('Invalid response format from server');
    }
    
    return data;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

export async function register(email: string, password: string, role: string, name?: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, role, name }),
  });
  return handleResponse<AuthResponse>(response);
}



export async function getWaitingQueue(barberId: string, date: string): Promise<QueueEntry[]> {
  const token = localStorage.getItem('token'); // Or however you store your auth token
  
  const response = await fetch(`${API_URL}/waiting-queue/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ barberId, date }),
    credentials: 'include',
  });
  
  return handleResponse<QueueEntry[]>(response);
}

// Add a new function to fetch all barbers
export async function getAllBarbers(): Promise<Barber[]> {
  const response = await fetch(`${API_URL}/barbers`, {
    method:'POST'
  });
  return handleResponse<Barber[]>(response);
}

// Appointment API calls
export async function checkAvailability(data: AvailableSlotRequest): Promise<Appointment> {
  const response = await fetch(`${API_URL}/appointments/available-slots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Appointment>(response);
}

export async function createAppointment(data: any): Promise<Appointment> {
  const response = await fetch(`${API_URL}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Appointment>(response);
}

//current status of working 
export async function updateAppointmentStatus(data: StatusUpdateRequest): Promise<any> {
  const response = await fetch(`${API_URL}/appointments/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({
      _id: data.id, // Waiting queue entry ID
      status: data.status,
      appointmentId: data.appointmentId, // Appointment document ID
    }),
  });
  return handleResponse(response);
}

// Walk-in API calls
export async function createWalkIn(data: any): Promise<WalkIn> {
  const response = await fetch(`${API_URL}/walkins`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<WalkIn>(response);
}

//current status of working 
export async function updateWalkInStatus(data: StatusUpdateRequest): Promise<any> {
  console.log("Data received in updateWalkInStatus:", data);
  const requestBody = {
    _id: data.id, // Waiting queue entry ID
    status: data.status,
    walkinId: data.walkinId // Walkin document ID (note: keeping the capital 'W' as in your original code)
  };
  console.log("Sending request body:", requestBody);
 
  const response = await fetch(`${API_URL}/walkins/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(requestBody),
  });
  return handleResponse(response);
}

export async function rejectAppointment(id: string, reason?: string): Promise<void> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_URL}/appointments/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      appointmentId: id,
      reason: reason || 'Appointment rejected by barber',
    }),
  });
  
  return handleResponse(response);
}


export async function getDashboard(barberId?: string, date?: string): Promise<DashboardResponse> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch(`${API_URL}/dashboard`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ barberId, date })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch dashboard data');
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    throw error;
  }
}

// Approve appointment (new function needed based on controller)
export const approveAppointment = async (appointmentId: string): Promise<void> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_URL}/appointments/${appointmentId}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
  });
  
  await handleResponse(response);
};



// Get working hours with filters (admin can see all, barber sees only their own)
export async function getWorkingHours(params?: { barberId?: string, date?: string, startDate?: string, endDate?: string }): Promise<WorkingHours[]> {
  const response = await fetch(`${API_URL}/working-hours`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify(params || {})
  });
  return handleResponse<WorkingHours[]>(response);
}

// Get my working hours (for barber)
export async function getMyWorkingHours(): Promise<WorkingHours[]> {
  const response = await fetch(`${API_URL}/working-hours/my`, {
    method: 'GET',
    headers: createHeaders()
  });
  return handleResponse<WorkingHours[]>(response);
}

// Add new working hours (barber adds their own, admin can add for any barber)
export async function addWorkingHours(workingHours: WorkingHoursInput): Promise<WorkingHours> {
  const response = await fetch(`${API_URL}/working-hours`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify(workingHours)
  });
  return handleResponse<WorkingHours>(response);
}

// Update existing working hours (barber can update own, admin can update any)
export async function updateWorkingHours(id: string, workingHours: WorkingHoursInput): Promise<WorkingHours> {
  const response = await fetch(`${API_URL}/working-hours`, {
    method: 'PUT',
    headers: createHeaders(),
    body: JSON.stringify({ 
      _id: id,
      barberId: workingHours.barberId,
      date: workingHours.date,
      startTime: workingHours.startTime,
      endTime: workingHours.endTime
    })
  });
  return handleResponse<WorkingHours>(response);
}

// Delete working hours (barber can delete own, admin can delete any)
export async function deleteWorkingHours(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/working-hours`, {
    method: 'DELETE',
    headers: createHeaders(),
    body: JSON.stringify({ id: id })
  });
  return handleResponse<void>(response);
}

// Create working hours with replacement when limit reached
// (barber replaces own hours, admin can replace for any barber)
export async function createWorkingHoursWithReplacement(workingHours: WorkingHoursInput): Promise<WorkingHours> {
  const response = await fetch(`${API_URL}/working-hours/confirm-replace`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify(workingHours)
  });
  return handleResponse<WorkingHours>(response);
}

// Get working hours by barber and date (accessible by everyone)
export async function getWorkingHoursByBarberAndDate(barberId: string, date: string): Promise<WorkingHours> {
  const response = await fetch(`${API_URL}/working-hours/barber-date`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify({ barberId, date })
  });
  return handleResponse<WorkingHours>(response);
}

// Get count of working hours for a barber
// (barber can check own count, admin can check any barber's count)
export async function getWorkingHoursCount(barberId?: string): Promise<{ count: number, limitReached: boolean }> {
  const url = `${API_URL}/working-hours/count/${barberId || ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: createHeaders()
  });
  return handleResponse<{ count: number, limitReached: boolean }>(response);
}


// Blocked Slots API calls
export async function getBlockedSlots(barberId: string) {
  const response = await fetch(`${API_URL}/blocked-slots?barberId=${barberId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch blocked slots:", errorText);
    throw new Error("Failed to fetch blocked slots");
  }

  const json = await response.json();
  return json.data;
}

export async function getBlockedSlot(id: string): Promise<BlockedSlot> {
  const response = await fetch(`${API_URL}/blocked-slots/single`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({ id })
  });
  return handleResponse<BlockedSlot>(response);
}

export async function addBlockedSlot(data: Omit<BlockedSlot, "_id">): Promise<BlockedSlot> {
  const response = await fetch(`${API_URL}/blocked-slots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<BlockedSlot>(response);
}

export async function createBlockedSlotWithReplacement(data: Omit<BlockedSlot, "_id">): Promise<BlockedSlot> {
  const response = await fetch(`${API_URL}/blocked-slots/confirm-replace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  
  return handleResponse<BlockedSlot>(response);
}

export async function updateBlockedSlot(id: string, data: Partial<BlockedSlot>): Promise<BlockedSlot> {
  // Make sure id is properly included in the URL
  const response = await fetch(`${API_URL}/blocked-slots/${id}`, {
    method: 'PUT',
    headers: {  
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<BlockedSlot>(response);
} 

export async function deleteBlockedSlot(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/blocked-slots`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({ id }),
  });
  return handleResponse<void>(response);
}



// User profile API calls
export async function getUserDetails(userId: string): Promise<User> {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return handleResponse<User>(response);
}

export async function updateUserProfile(userId: string, data: any): Promise<User> {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<User>(response);
}

export async function changeUserPassword(
  userId: string, 
  currentPassword: string, 
  newPassword: string
): Promise<void> {
  const response = await fetch(`${API_URL}/users/${userId}/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return handleResponse<void>(response);
}