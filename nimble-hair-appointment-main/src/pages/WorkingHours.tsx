import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getWorkingHours, getMyWorkingHours, getAllBarbers, addWorkingHours, deleteWorkingHours, createWorkingHoursWithReplacement, updateWorkingHours } from '@/lib/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, isBefore } from 'date-fns';
import { CalendarIcon, Clock, Trash2, PencilIcon, Calendar as CalendarIcon2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkingHours, WorkingHoursInput } from '@/lib/types';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00',
];

// Extended schema for admins who need to select a barber
const adminFormSchema = z.object({
  barberId: z.string({
    required_error: "Please select a barber",
  }),
  date: z.date({
    required_error: "Please select a date",
  }),
  startTime: z.string().min(1, { message: "Please select a start time" }),
  endTime: z.string().min(1, { message: "Please select an end time" }),
}).refine(data => data.startTime < data.endTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

// Basic schema for barbers
const barberFormSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  startTime: z.string().min(1, { message: "Please select a start time" }),
  endTime: z.string().min(1, { message: "Please select an end time" }),
}).refine(data => data.startTime < data.endTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export default function WorkingHoursPage() {
  return (
    <ProtectedRoute allowedRoles={['barber', 'admin']}>
      <WorkingHoursContent />
    </ProtectedRoute>
  );
}

function WorkingHoursContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingHoursData, setPendingHoursData] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingHoursId, setEditingHoursId] = useState<string | null>(null);
  const [barbers, setBarbers] = useState<{ _id: string, name: string }[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);

  // Use the appropriate schema based on user role
  const formSchema = user?.role === 'admin' ? adminFormSchema : barberFormSchema;
  
  // Create the form with the appropriate schema
  const form = useForm<z.infer<typeof adminFormSchema> | z.infer<typeof barberFormSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startTime: '09:00',
      endTime: '17:00',
      ...(user?.role === 'admin' && { barberId: '' }),
    },
  });

  useEffect(() => {
    if (user?.id) {
      // If user is admin, fetch all barbers first
      if (user.role === 'admin') {
        fetchAllBarbers();
      } else {
        // For barbers, directly fetch their working hours
        fetchWorkingHours();
      }
    }
  }, [user?.id, user?.role]);

  // This effect will trigger when selectedBarberId changes
  useEffect(() => {
    if (user?.role === 'admin' && selectedBarberId) {
      fetchWorkingHours();
    }
  }, [selectedBarberId]);

  async function fetchAllBarbers() {
    try {
      const barberList = await getAllBarbers();
      setBarbers(barberList);
      
      // If barbers are fetched and we need to select one, select the first one
      if (barberList.length > 0 && user?.role === 'admin') {
        setSelectedBarberId(barberList[0]._id);
        form.setValue('barberId', barberList[0]._id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch barbers. Please try again later.',
        variant: 'destructive',
      });
    }
  }

  async function fetchWorkingHours() {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      let data;
      
      if (user.role === 'barber') {
        // Barbers get their own working hours
        data = await getMyWorkingHours();
      } else if (user.role === 'admin' && selectedBarberId) {
        // Admins can view working hours for a specific barber
        data = await getWorkingHours({ barberId: selectedBarberId });
      } else if (user.role === 'admin') {
        // Admins can view all working hours if no specific barber is selected
        data = await getWorkingHours();
      }
      
      setWorkingHours(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch working hours. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handle barber selection change (admin only)
  function handleBarberChange(barberId: string) {
    setSelectedBarberId(barberId);
    form.setValue('barberId', barberId);
  }

  async function onSubmit(values: any) {
    if (!user?.id) return;
    
    try {
      // Convert date and time to proper format
      const formattedDate = format(values.date, "yyyy-MM-dd");
      
      // Create request data
      const requestData: WorkingHoursInput = {
        // For admin, use selected barber; for barber, use own ID
        barberId: user.role === 'admin' ? values.barberId : user.id,
        date: formattedDate,
        startTime: values.startTime,
        endTime: values.endTime
      };

      // Check if we're editing or creating
      if (isEditMode && editingHoursId) {
        // Update existing working hours
        try {
          const updatedHours = await updateWorkingHours(editingHoursId, requestData);
          
          toast({
            title: 'Working Hours Updated',
            description: `Hours on ${format(values.date, 'MMMM d, yyyy')} from ${values.startTime} to ${values.endTime} have been updated.`,
          });
          
          // Update local state
          setWorkingHours(workingHours.map(hours => 
            hours._id === editingHoursId ? updatedHours : hours
          ));
          
          // Reset edit mode
          setIsEditMode(false);
          setEditingHoursId(null);
          setIsDialogOpen(false);
          resetForm();
        } catch (error) {
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to update working hours.',
            variant: 'destructive',
          });
          console.error('Full error:', error);
        }
      } else {
        // Create new working hours
        try {
          // First try to add normally
          const newWorkingHours = await addWorkingHours(requestData);
          
          toast({
            title: 'Working Hours Added',
            description: `Hours on ${format(values.date, 'MMMM d, yyyy')} from ${values.startTime} to ${values.endTime} have been added.`,
          });
          
          // Update local state
          setWorkingHours([...workingHours, newWorkingHours]);
          
          setIsDialogOpen(false);
          resetForm();
        } catch (error) {
          // Check if it's a limit reached error
          if (error instanceof Error && error.message.includes('You already have 7 working hours entries')) {
            // Store the data and open the confirmation dialog
            setPendingHoursData(requestData);
            setIsConfirmDialogOpen(true);
          } else {
            toast({
              title: 'Error',
              description: error instanceof Error ? error.message : 'Failed to add working hours.',
              variant: 'destructive',
            });
            console.error('Full error:', error);
          }
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save working hours.',
        variant: 'destructive',
      });
      console.error('Full error:', error);
    }
  }

  function resetForm() {
    form.reset({
      startTime: '09:00',
      endTime: '17:00',
      ...(user?.role === 'admin' ? { barberId: selectedBarberId || '' } : {}),
    });
  }

  // Handle edit button click
  function handleEdit(hours: WorkingHours) {
    setIsEditMode(true);
    setEditingHoursId(hours._id);
    
    // Extract date from hours
    const hoursDate = new Date(hours.date);
    
    // Set form values for editing
    if (user?.role === 'admin') {
      form.reset({
        barberId: typeof hours.barberId === 'object' && hours.barberId !== null 
          ? hours.barberId._id 
          : (typeof hours.barberId === 'string' ? hours.barberId : ''),
        date: hoursDate,
        startTime: hours.startTime,
        endTime: hours.endTime
      });
    }else {
      form.reset({
        date: hoursDate,
        startTime: hours.startTime,
        endTime: hours.endTime
      });
    }
    
    setIsDialogOpen(true);
  }

  // Update dialog close handler to reset edit mode
  function handleDialogClose(open: boolean) {
    if (!open) {
      setIsEditMode(false);
      setEditingHoursId(null);
      resetForm();
    }
    setIsDialogOpen(open);
  }

  async function handleConfirmedReplace() {
    try {
      const newWorkingHours = await createWorkingHoursWithReplacement(pendingHoursData);
      
      toast({
        title: 'Hours Replaced',
        description: `All previous working hours were removed and new hours have been added.`,
      });
      
      // Fetch all hours again since we replaced everything
      await fetchWorkingHours();
      
      setIsConfirmDialogOpen(false);
      setPendingHoursData(null);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to replace working hours.',
        variant: 'destructive',
      });
      console.error('Full error:', error);
    }
  }

  async function handleDelete(id: string) {
    console.log(id);
    try {
      await deleteWorkingHours(id);
      
      toast({
        title: 'Hours Removed',
        description: 'The working hours have been removed.',
      });
      
      // Update local state
      setWorkingHours(workingHours.filter(hours => hours._id !== id));
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove working hours.',
        variant: 'destructive',
      });
    }
  }

  // Filter out past working hours
  const currentWorkingHours = workingHours.filter(hours => {
    const endDateTime = new Date(`${hours.date}T${hours.endTime}`);
    // return !isBefore(endDateTime, new Date());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Keep if the date is today or in the future
    return endDateTime.getDate() >= today.getDate() || 
           !isBefore(endDateTime, new Date());
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Working Hours</h1>
            <p className="text-gray-500 mt-1">
              {user?.role === 'admin' 
                ? 'Manage working hours for all barbers' 
                : 'Set your available hours for appointments'}
            </p>
          </div>
          
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-barbershop-navy hover:bg-barbershop-navy/90"
          >
            Add Working Hours
          </Button>
        </div>
        
        {/* Admin-only barber selector */}
        {user?.role === 'admin' && (
          <div className="mb-6">
            <FormItem className="max-w-xs">
              <FormLabel>Select Barber</FormLabel>
              <Select 
                value={selectedBarberId || ''} 
                onValueChange={handleBarberChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a barber" />
                </SelectTrigger>
                <SelectContent>
                  {barbers.map(barber => (
                    <SelectItem key={barber._id} value={barber._id}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          </div>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>
              {user?.role === 'admin' && selectedBarberId 
                ? `Working Hours for ${barbers.find(b => b._id === selectedBarberId)?.name || 'Selected Barber'}`
                : 'Your Working Hours'}
            </CardTitle>
            <CardDescription>
              {user?.role === 'admin'
                ? 'Times when the barber will be available for appointments'
                : 'These are the times when you\'re available for appointments'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center p-6">Loading working hours...</div>
            ) : currentWorkingHours.length === 0 ? (
              <div className="text-center p-6 border rounded-md bg-gray-50">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative mb-4">
                    <CalendarIcon2 className="h-16 w-16 text-gray-300" />
                    <Clock className="h-8 w-8 text-gray-400 absolute bottom-0 right-0" />
                  </div>
                  <h3 className="text-lg font-medium">No Working Hours</h3>
                  <p className="text-gray-500 mb-4">
                    {user?.role === 'admin' && selectedBarberId
                      ? 'This barber hasn\'t set any working hours yet.'
                      : 'You haven\'t set any working hours yet. Set your available hours to accept appointments.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {currentWorkingHours.map((hours) => {
                  return (
                    <div key={hours._id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {format(new Date(hours.date), 'MMMM d, yyyy')}
                        </div>
                        <div className="text-gray-600">
                          {hours.startTime} - {hours.endTime}
                        </div>
                        {user?.role === 'admin' && (
                          <div className="text-sm text-gray-500">
                          Barber: {typeof hours.barberId === 'object' && hours.barberId !== null 
                            ? hours.barberId.name 
                            : (typeof hours.barberId === 'string' ? 'Unknown' : 'Not assigned')}
                        </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleEdit(hours)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleDelete(hours._id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Add/Edit Working Hours Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Working Hours' : 'Add Working Hours'}</DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? 'Modify the date and time range for these working hours' 
                  : 'Select a date and time range when the barber will be available for appointments'}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Admin-only barber selector in dialog */}
                {user?.role === 'admin' && (
                  <FormField
                    control={form.control}
                    name="barberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barber</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a barber" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {barbers.map((barber) => (
                              <SelectItem key={barber._id} value={barber._id}>
                                {barber.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              return isBefore(date, new Date(new Date().setHours(0, 0, 0, 0)));
                            }}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[200px]">
                            {TIME_SLOTS.map((time) => (
                              <SelectItem key={`start-${time}`} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[200px]">
                            {TIME_SLOTS.map((time) => (
                              <SelectItem key={`end-${time}`} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit">
                    {isEditMode ? 'Update Hours' : 'Add Hours'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Confirmation Dialog for Replacing Hours */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Warning: Limit Reached</DialogTitle>
              <DialogDescription>
                You already have 7 working hours entries. Adding more will delete all existing entries.
                Are you sure you want to proceed?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmedReplace}
              >
                Replace All Hours
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}