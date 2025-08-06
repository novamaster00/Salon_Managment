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
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [completedServices, setCompletedServices] = useState([]);
  const [WalkIn, setWalkIns] = useState([]);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('queue');
  const [selectedDate, setSelectedDate] = useState(formatDateForApi(new Date()));

  const isAdmin = user?.role === 'admin';

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

      console.log("Dashboard API Response:", data); // Debug log

      // Set pending appointments from the response
      if (data?.data?.pendingAppointments) {
        setPendingAppointments(data.data.pendingAppointments);
      } else {
        setPendingAppointments([]);
      }

      // Set completed services from the response
      if (data?.data?.completedServices) {
        setCompletedServices(data.data.completedServices);
      } else {
        setCompletedServices([]);
      }

      // Set walk-ins if available
      if (data?.data?.WalkIn) {
        setWalkIns(data.data.WalkIn);
      }

      // Handle queue data - combine waiting queue with any other queue entries
      let allQueueEntries = [];

      // Add waiting queue entries
      if (data?.data?.waitingQueue) {
        allQueueEntries = [...data.data.waitingQueue];
      }

      // Add current service if it exists
      if (data?.data?.currentService) {
        allQueueEntries.push(data.data.currentService);
      }

      setQueue(allQueueEntries);

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

      // If status is completed, refresh to get updated completed services
      if (newStatus === 'completed') {
        await fetchDashboard();
      }

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

  async function handleApproveAppointment(appointmentId: string) {
    try {
      await approveAppointment(appointmentId);

      // Remove from pending appointments
      setPendingAppointments(pendingAppointments.filter(apt => apt._id !== appointmentId));

      // Refresh dashboard to get updated queue
      await fetchDashboard();

      toast({
        title: 'Appointment Approved',
        description: 'Appointment has been approved and added to queue.',
      });
    } catch (error) {
      toast({
        title: 'Approval Failed',
        description: error instanceof Error ? error.message : 'Failed to approve appointment. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleRejectAppointment(appointmentId: string) {
    try {
      await rejectAppointment(appointmentId);

      // Remove from pending appointments
      setPendingAppointments(pendingAppointments.filter(apt => apt._id !== appointmentId));

      toast({
        title: 'Appointment Rejected',
        description: 'Appointment has been rejected.',
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

  // Helper function for pending appointments
  function getPendingCustomerName(appointment): string {
    if (appointment.customerId && appointment.customerId.name) {
      return appointment.customerId.name;
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

  // Helper functions for completed services
  function getCompletedCustomerName(entry): string {
    if (entry.sourceData) {
      // For appointments
      if (entry.sourceData.customerId && entry.sourceData.customerId.name) {
        return entry.sourceData.customerId.name;
      }
      // For walk-ins
      if (entry.sourceData.customerName) {
        return entry.sourceData.customerName;
      }
    }
    return 'Customer';
  }

  function getCompletedService(entry): string {
    if (entry.sourceData && entry.sourceData.service) {
      return entry.sourceData.service;
    }
    return entry.service || 'N/A';
  }

  function getCompletedTime(entry): string {
    if (entry.sourceData && entry.sourceData.startTime) {
      return formatTime(entry.sourceData.startTime);
    }
    if (entry.updatedAt) {
      return formatTime(entry.updatedAt);
    }
    return 'N/A';
  }

  // Queue filtering
  const waitingQueue = queue.filter(entry => entry.status === 'waiting');
  const ongoingQueue = queue.filter(entry => entry.status === 'ongoing');
  // Use completedServices state instead of filtering queue
  const completedQueue = completedServices || [];

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
        <div className="flex flex-col items-center md:items-start gap-4 mb-8">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">
              {isAdmin ? 'Admin Dashboard' : 'Barber Dashboard'}
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your appointments and walk-ins
            </p>
          </div>

          <div className="w-full flex flex-col items-center gap-4 md:flex-row md:justify-end">
            {/* Date selector */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-barbershop-navy"
              />
            </div>

            {/* Buttons in column for mobile, row for desktop */}
            <div className="flex flex-col w-full md:w-auto md:flex-row gap-3 md:gap-2">
              <Link to="/working-hours">
                <Button variant="outline" className="w-full md:w-auto flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  Working Hours
                </Button>
              </Link>

              <Link to="/blocked-slots">
                <Button variant="outline" className="w-full md:w-auto flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Blocked Slots
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <div className="text-3xl font-bold">{pendingAppointments.length}</div>
              <p className="text-gray-500 text-sm">appointments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Completed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedQueue.length}</div>
              <p className="text-gray-500 text-sm">completed services</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="queue" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full gap-1">
            <TabsTrigger value="queue">
              <span className="text-xs sm:text-sm">Waiting ({waitingQueue.length})</span>
            </TabsTrigger>
            <TabsTrigger value="ongoing">
              <span className="text-xs sm:text-sm">Progress ({ongoingQueue.length})</span>
            </TabsTrigger>
            <TabsTrigger value="completed">
              <span className="text-xs sm:text-sm">Done ({completedQueue.length})</span>
            </TabsTrigger>
            <TabsTrigger value="pending">
              <span className="text-xs sm:text-sm">Pending ({pendingAppointments.length})</span>
            </TabsTrigger>
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
                            <div className="font-medium">{getCompletedCustomerName(entry)}</div>
                            <StatusBadge status="completed" />
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            Token: {entry.tokenNumber || 'N/A'} | Service: {getCompletedService(entry)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Completed: {getCompletedTime(entry)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Type: {entry.sourceType === 'appointment' ? 'Appointment' : 'Walk-in'}
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
                ) : pendingAppointments.length === 0 ? (
                  <div className="text-center p-6 text-gray-500">
                    No pending appointments
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingAppointments.map((appointment) => (
                      <div
                        key={appointment._id}
                        className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{getPendingCustomerName(appointment)}</div>
                            <StatusBadge status="pending_approval" />
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            Service: {appointment.service || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Requested Time: {appointment.requestedTime ? formatTime(appointment.requestedTime) : 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Date: {appointment.date}
                          </div>
                          {appointment.customerId?.email && (
                            <div className="text-sm text-gray-500">
                              Email: {appointment.customerId.email}
                            </div>
                          )}
                          {appointment.customerId?.phoneNumber && (
                            <div className="text-sm text-gray-500">
                              Phone: {appointment.customerId.phoneNumber}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="bg-red-100 hover:bg-red-200 border-red-300 text-red-700"
                            onClick={() => handleRejectAppointment(appointment._id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveAppointment(appointment._id)}
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