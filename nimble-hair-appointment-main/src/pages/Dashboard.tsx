import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getDashboard, 
  updateAppointmentStatus, 
  updateWalkInStatus,
  approveAppointment,
  rejectAppointment 
} from '@/lib/api';
import { QueueEntry, AppointmentStatus, DashboardResponse } from '@/lib/types';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useToast } from '@/hooks/use-toast';
import {
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Clock, Users, Calendar, ClipboardList, CheckCircle, XCircle } from 'lucide-react';

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['barber', 'admin']}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('queue');
  const [selectedDate, setSelectedDate] = useState(formatDateForApi(new Date()));
  
  const isAdmin = user?.role === 'admin' ;

  // Function to format date as YYYY-MM-DD
  function formatDateForApi(date) {
    return date.toISOString().split('T')[0];
  }

  useEffect(() => {
    fetchDashboard();
    
    // Refresh data every minute
    const intervalId = setInterval(fetchDashboard, 60000);
    
    return () => clearInterval(intervalId);
  }, [user, selectedDate]);

  async function fetchDashboard() {
    try {
      const barberId = isAdmin ? undefined : user?.id;
      const data = await getDashboard(barberId, selectedDate);
      setDashboardData(data);
      
      // Use the correct queue data from the response
      if (data && data.data && data.data.queue) {
        setQueue(data.data.queue);
      } else if (data && data.data && data.data.waitingQueue) {
        // Fallback to waitingQueue if queue is not available
        setQueue(data.data.waitingQueue);
      } else {
        // Initialize an empty queue if neither are available
        setQueue([]);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleStatusChange(entry: QueueEntry, newStatus: AppointmentStatus) {
    try {
      console.log("Entry in handleStatusChange:", entry);
      
      if (entry.sourceType === 'appointment') {
        console.log("Sending appointment status update with:", {
          id: entry._id, 
          status: newStatus,
          appointmentId: entry.sourceData?._id
        });
        
        await updateAppointmentStatus({
          id: entry._id,
          status: newStatus,
          appointmentId: entry.sourceData?._id
        });
      } else {
        console.log("Sending walk-in status update with:", {
          id: entry._id, 
          status: newStatus,
          walkinId: entry.sourceData?._id
        });
        
        await updateWalkInStatus({
          id: entry._id,
          status: newStatus,
          walkinId: entry.sourceData?._id
        });
      }
      
      // Update local state
      setQueue(queue.map(item => 
        item._id === entry._id 
          ? { ...item, status: newStatus } 
          : item
      ));
      
      toast({
        title: 'Status Updated',
        description: `Customer ${getCustomerName(entry)}'s status set to ${newStatus.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error("Status update error:", error);
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleApproveAppointment(entry: QueueEntry) {
    try {
      await approveAppointment(entry._id);
      
      // Update local state
      setQueue(queue.map(item => 
        item._id === entry._id 
          ? { ...item, status: 'approved' } 
          : item
      ));
      
      toast({
        title: 'Appointment Approved',
        description: `Appointment for ${getCustomerName(entry)} has been approved.`,
      });
    } catch (error) {
      toast({
        title: 'Approval Failed',
        description: error instanceof Error ? error.message : 'Failed to approve appointment. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleRejectAppointment(entry: QueueEntry) {
    try {
      await rejectAppointment(entry._id);
      
      // Update local state
      setQueue(queue.map(item => 
        item._id === entry._id 
          ? { ...item, status: 'rejected' } 
          : item
      ));
      
      toast({
        title: 'Appointment Rejected',
        description: `Appointment for ${getCustomerName(entry)} has been rejected.`,
      });
    } catch (error) {
      toast({
        title: 'Rejection Failed',
        description: error instanceof Error ? error.message : 'Failed to reject appointment. Please try again.',
        variant: 'destructive',
      });
    }
  }

  // Helper functions to extract data from sourceData or use direct properties if available
  function getCustomerName(entry: QueueEntry): string {
    if (entry.sourceData && entry.sourceData.customerName) {
      return entry.sourceData.customerName;
    }
    return 'Customer';
  }

  function getService(entry: QueueEntry): string {
    if (entry.sourceData && entry.sourceData.service) {
      return entry.sourceData.service;
    }
    return entry.service || 'N/A';
  }

  function getStartTime(entry: QueueEntry): string {
    // First try to use the sourceData.startTime directly as seen in the actual API response
    if (entry.sourceData && entry.sourceData.startTime) {
      // If startTime is already a full ISO string, use it
      if (typeof entry.sourceData.startTime === 'string' && entry.sourceData.startTime.includes('T')) {
        return entry.sourceData.startTime;
      }
      // Otherwise, combine date and time
      const dateStr = entry.date || selectedDate;
      return `${dateStr}T${entry.sourceData.startTime}:00`;
    }
    
    // Fall back to entry.startTime if available
    if (entry.startTime) {
      return entry.startTime;
    }
    
    // Return current time as last resort
    return new Date().toISOString();
  }

  const waitingQueue = queue.filter(entry => entry.status === 'waiting');
  const ongoingQueue = queue.filter(entry => entry.status === 'ongoing');
  const completedQueue = queue.filter(entry => entry.status === 'completed');
  const pendingQueue = queue.filter(entry => entry.status === 'pending_approval');

  function formatTime(timeStr: string) {
    try {
      // If it's a simple time format like "09:05", add the date
      if (timeStr.length <= 5) {
        const dateStr = selectedDate;
        const fullTimeStr = `${dateStr}T${timeStr}:00`;
        return new Date(fullTimeStr).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      
      // Otherwise parse as ISO string
      return new Date(timeStr).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return timeStr; // Return the original if parsing fails
    }
  }

  // Function to handle date change
  function handleDateChange(e) {
    setSelectedDate(e.target.value);
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {isAdmin ? 'Admin Dashboard' : 'Barber Dashboard'}
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your appointments and walk-ins
            </p>
          </div>
          
          <div className="flex gap-4 items-center flex-wrap">
            {/* Date selector input */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-barbershop-navy"
              />
            </div>
            
            <Link to="/working-hours">
              <Button variant="outline" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Working Hours
              </Button>
            </Link>
            
            <Link to="/blocked-slots">
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Blocked Slots
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Waiting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{waitingQueue.length}</div>
              <p className="text-gray-500 text-sm">customers in queue</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{ongoingQueue.length}</div>
              <p className="text-gray-500 text-sm">active customers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingQueue.length}</div>
              <p className="text-gray-500 text-sm">appointments</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Today's Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{queue.length}</div>
              <p className="text-gray-500 text-sm">appointments/walk-ins</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="queue" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="queue">Waiting ({waitingQueue.length})</TabsTrigger>
            <TabsTrigger value="ongoing">In Progress ({ongoingQueue.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedQueue.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending Approval ({pendingQueue.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="queue">
            <Card>
              <CardHeader>
                <CardTitle>Waiting Queue</CardTitle>
                <CardDescription>
                  Customers waiting for service. Select a customer to begin service.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center p-6">Loading...</div>
                ) : waitingQueue.length === 0 ? (
                  <div className="text-center p-6 text-gray-500">
                    No customers currently waiting
                  </div>
                ) : (
                  <div className="space-y-4">
                    {waitingQueue.map((entry) => (
                      <div 
                        key={entry._id} 
                        className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{getCustomerName(entry)}</div>
                            <StatusBadge status={entry.status} />
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            Token: {entry.tokenNumber} | Service: {getService(entry)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Time: {entry.sourceData?.startTime ? formatTime(entry.sourceData.startTime) : 'N/A'}
                          </div>
                        </div>
                        
                        <Button 
                          className="bg-barbershop-navy hover:bg-barbershop-navy/90"
                          onClick={() => handleStatusChange(entry, 'ongoing')}
                        >
                          Start Service
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ongoing">
            <Card>
              <CardHeader>
                <CardTitle>In Progress</CardTitle>
                <CardDescription>
                  Currently active customers receiving service
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center p-6">Loading...</div>
                ) : ongoingQueue.length === 0 ? (
                  <div className="text-center p-6 text-gray-500">
                    No active customers at the moment
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ongoingQueue.map((entry) => (
                      <div 
                        key={entry._id} 
                        className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{getCustomerName(entry)}</div>
                            <StatusBadge status={entry.status} />
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            Token: {entry.tokenNumber} | Service: {getService(entry)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Time: {entry.sourceData?.startTime ? formatTime(entry.sourceData.startTime) : 'N/A'}
                          </div>
                        </div>
                        
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleStatusChange(entry, 'completed')}
                        >
                          Complete Service
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed</CardTitle>
                <CardDescription>
                  Customers who have completed their service today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center p-6">Loading...</div>
                ) : completedQueue.length === 0 ? (
                  <div className="text-center p-6 text-gray-500">
                    No completed services yet today
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedQueue.map((entry) => (
                      <div 
                        key={entry._id} 
                        className="p-4 border rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{getCustomerName(entry)}</div>
                            <StatusBadge status={entry.status} />
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            Token: {entry.tokenNumber} | Service: {getService(entry)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Time: {entry.sourceData?.startTime ? formatTime(entry.sourceData.startTime) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approval</CardTitle>
                <CardDescription>
                  Appointments waiting for approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center p-6">Loading...</div>
                ) : pendingQueue.length === 0 ? (
                  <div className="text-center p-6 text-gray-500">
                    No pending appointments
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingQueue.map((entry) => (
                      <div 
                        key={entry._id} 
                        className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{getCustomerName(entry)}</div>
                            <StatusBadge status={entry.status} />
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            Service: {getService(entry)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Requested Time: {entry.sourceData?.startTime ? formatTime(entry.sourceData.startTime) : 'N/A'}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            className="bg-red-100 hover:bg-red-200 border-red-300 text-red-700"
                            onClick={() => handleRejectAppointment(entry)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveAppointment(entry)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}