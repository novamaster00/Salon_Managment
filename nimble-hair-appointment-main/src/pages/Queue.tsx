import { useState, useEffect } from 'react';
import { getWaitingQueue, getAllBarbers } from '@/lib/api';
import { QueueEntry, Barber, AppointmentStatus } from '@/lib/types';
import Layout from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    fetchBarbers();
    // We'll fetch the queue after we have the barbers and selected one
  }, []);

  useEffect(() => {
    // Only fetch queue if we have a selected barber
    if (selectedBarber) {
      fetchQueue();
      
      // Refresh queue every 30 seconds
      const intervalId = setInterval(fetchQueue, 30000);
      return () => clearInterval(intervalId);
    }
  }, [selectedBarber, date]);

  async function fetchBarbers() {
    try {
      const data = await getAllBarbers();
      setBarbers(data);
      
      // Set the first barber as default if available
      if (data.length > 0) {
        setSelectedBarber(data[0]._id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch barbers. Please try again later.',
        variant: 'destructive',
      });
    }
  }

  async function fetchQueue() {
    if (!selectedBarber) return;
    
    setIsLoading(true);
    try {
      // Format the date as YYYY-MM-DD
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const data = await getWaitingQueue(selectedBarber, formattedDate);
      setQueue(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch waiting queue. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function formatTime(timeString: string) {
    // Handle different time formats
    if (!timeString) return 'N/A';
    
    // Check if the timeString is just hours and minutes (HH:MM)
    if (timeString.length === 5 && timeString.includes(':')) {
      // Create a date object with today's date and the time
      const [hours, minutes] = timeString.split(':').map(Number);
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);
      return today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If it's an ISO string, parse it normally
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'N/A';
    }
  }

  // Helper to get barber name by ID
  function getBarberNameById(id: string): string {
    const barber = barbers.find(b => b._id === id);
    return barber ? barber.name : 'Unknown';
  }

  // Helper to ensure status is of type AppointmentStatus
  function mapStatus(status: string): AppointmentStatus {
    // Map backend status to AppointmentStatus type
    // This handles any potential differences between backend and frontend status names
    const statusMap: Record<string, AppointmentStatus> = {
      'WAITING': 'waiting',
      'ONGOING': 'ongoing',
      'COMPLETED': 'completed',
      'CANCELLED': 'cancelled',
      'PENDING_APPROVAL': 'pending_approval',
      // Add default mappings for your standard statuses
      'waiting': 'waiting',
      'ongoing': 'ongoing',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'pending_approval': 'pending_approval'
    };
    
    return statusMap[status] || 'waiting'; // Default to 'waiting' if status is unknown
  }

  // Helper to get customer name from entry
  function getCustomerName(entry: QueueEntry): string {
    // Check all possible paths for the customer name
    if (entry.sourceData?.customerName) {
      // TypeScript doesn't know about this property, but it exists in the actual data
      return (entry.sourceData as any).customerName;
    }
    
    if (entry.sourceData?.customerId?.name) {
      return entry.sourceData.customerId.name;
    }
    
    if (entry.sourceData?.customerName) {
      return entry.sourceData.customerName;
    }
    
    return 'N/A';
  }
  
  // Helper to get service from entry
  function getService(entry: QueueEntry): string {
    // Check all possible paths for the service
    if (entry.service) {
      return entry.service;
    }
    
    if (entry.sourceData?.service) {
      return entry.sourceData.service;
    }
    
    return 'N/A';
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Current Queue</h1>
        
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-center">
          {/* Barber Selection */}
          <div className="w-full md:w-64">
            <Select
              value={selectedBarber}
              onValueChange={setSelectedBarber}
              disabled={barbers.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a barber" />
              </SelectTrigger>
              <SelectContent>
                {barbers.map((barber) => (
                  <SelectItem key={barber._id} value={barber._id}>
                    {barber.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Selection */}
          <div className="w-full md:w-64">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <Card>
          <CardHeader className="bg-barbershop-navy text-white">
            <CardTitle className="text-xl">
              {selectedBarber ? 
                `${getBarberNameById(selectedBarber)}'s Queue - ${format(date, 'MMM dd, yyyy')}` : 
                "Today's Waiting Queue"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : queue.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No customers are currently in the queue.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Token</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((entry) => (
                    <TableRow key={entry._id}>
                      <TableCell className="font-medium">{entry.tokenNumber}</TableCell>
                      <TableCell>{getCustomerName(entry)}</TableCell>
                      <TableCell>{getService(entry)}</TableCell>
                      <TableCell>{formatTime(entry.estimatedStartTime)}</TableCell>
                      <TableCell>
                        <StatusBadge status={mapStatus(entry.status)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>This queue updates automatically every 30 seconds.</p>
          <p>If your status changes to "In Progress", please proceed to your assigned barber.</p>
        </div>
      </div>
    </Layout>
  );
}