
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getBlockedSlots, addBlockedSlot, deleteBlockedSlot,createBlockedSlotWithReplacement,updateBlockedSlot   } from '@/lib/api';
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
  DialogTrigger,
  
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
import { format, addHours, isBefore } from 'date-fns';
import { CalendarIcon, Ban, Trash2,PencilIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlockedSlot } from '@/lib/types';


const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00',
];

const formSchema = z.object({
  date: z.date({
    required_error: 'Please select a date',
  }),
  startTime: z.string().min(1, { message: 'Please select a start time' }),
  endTime: z.string().min(1, { message: 'Please select an end time' }),
}).refine(data => data.startTime < data.endTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export default function BlockedSlotsPage() {
  return (
    <ProtectedRoute allowedRoles={['barber', 'admin']}>
      <BlockedSlotsContent />
    </ProtectedRoute>
  );
}

function BlockedSlotsContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingSlotData, setPendingSlotData] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startTime: '',
      endTime: '',
    },
  });

  useEffect(() => {
    if (user?.id) {
      fetchBlockedSlots();
    }
  }, [user?.id]);

  async function fetchBlockedSlots() {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const data = await getBlockedSlots(user.id);
      setBlockedSlots(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch blocked slots. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);


  // Add this function to handle edit button click
  function handleEdit(slot: BlockedSlot) {
    setIsEditMode(true);
    setEditingSlotId(slot._id);
    
    // Extract date from slot
    const slotDate = new Date(slot.date);
    
    // Set form values for editing
    form.reset({
      date: slotDate,
      startTime: slot.startTime,
      endTime: slot.endTime
    });
    
    setIsDialogOpen(true);
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user?.id) return;
    
    try {
      // Convert date and time to ISO string
      const startDateTime = new Date(values.date);
      const [startHours, startMinutes] = values.startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes, 0, 0);
      
      const endDateTime = new Date(values.date);
      const [endHours, endMinutes] = values.endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
      
      // Format date as YYYY-MM-DD using date-fns
      const formattedDate = format(values.date, "yyyy-MM-dd");
      
      // Format times in 24-hour format HH:mm
      const formattedStartTime = format(startDateTime, "HH:mm");
      const formattedEndTime = format(endDateTime, "HH:mm");
      
      // Create request data
      const requestData = {
        barberId: user.id,
        date: formattedDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime
      };
      
      // Check if we're editing or creating
      if (isEditMode && editingSlotId) {
        // Update existing slot
        try {
          const updatedSlot = await updateBlockedSlot(editingSlotId, requestData);;
          
          toast({
            title: 'Slot Updated',
            description: `Time slot on ${format(values.date, 'MMMM d, yyyy')} from ${values.startTime} to ${values.endTime} has been updated.`,
          });
          
          // Update local state
          setBlockedSlots(blockedSlots.map(slot => 
            slot._id === editingSlotId ? updatedSlot : slot
          ));
          
          // Reset edit mode
          setIsEditMode(false);
          setEditingSlotId(null);
          setIsDialogOpen(false);
          form.reset();
        } catch (error) {
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to update time slot.',
            variant: 'destructive',
          });
          console.error('Full error:', error);
        }
      } else {
        // Create new slot - existing code for creating new slots
        try {
          // First try to add normally
          const newBlockedSlot = await addBlockedSlot(requestData);
          
          toast({
            title: 'Slot Blocked',
            description: `Time slot on ${format(values.date, 'MMMM d, yyyy')} from ${values.startTime} to ${values.endTime} has been blocked.`,
          });
          
          // Update local state
          setBlockedSlots([...blockedSlots, newBlockedSlot]);
          
          setIsDialogOpen(false);
          form.reset();
        } catch (error) {
          // Check if it's a limit reached error
          if (error instanceof Error && error.message.includes('You already have 7 blocked slot entries')) {
            // Store the data and open the confirmation dialog
            setPendingSlotData(requestData);
            setIsConfirmDialogOpen(true);
          } else {
            toast({
              title: 'Error',
              description: error instanceof Error ? error.message : 'Failed to block time slot.',
              variant: 'destructive',
            });
            console.error('Full error:', error);
          }
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to block time slot.',
        variant: 'destructive',
      });
      console.error('Full error:', error);
    }
  }

  // Update dialog close handler to reset edit mode
  function handleDialogClose(open: boolean) {
    if (!open) {
      setIsEditMode(false);
      setEditingSlotId(null);
      form.reset();
    }
    setIsDialogOpen(open);
  }

  async function handleConfirmedReplace() {
    try {
      const newBlockedSlot = await createBlockedSlotWithReplacement(pendingSlotData);
      
      toast({
        title: 'Slots Replaced',
        description: `All previous blocked slots were removed and a new slot has been added.`,
      });
      
      // Fetch all slots again since we replaced everything
      await fetchBlockedSlots();
      
      setIsConfirmDialogOpen(false);
      setPendingSlotData(null);
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to replace blocked slots.',
        variant: 'destructive',
      });
      console.error('Full error:', error);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteBlockedSlot(id);
      
      toast({
        title: 'Slot Unblocked',
        description: 'The blocked time slot has been removed.',
      });
      
      // Update local state
      setBlockedSlots(blockedSlots.filter(slot => slot._id !== id));
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unblock time slot.',
        variant: 'destructive',
      });
    }
  }

  function formatDateTime(isoString: string) {
    const date = new Date(isoString);
    return format(date, "yyyy-MM-dd 'at' hh:mm "); // Added 'a' for AM/PM
  }

  // Filter out past blocked slots
  const currentBlockedSlots = blockedSlots.filter(slot => 
    !isBefore(new Date(slot.endTime), new Date())
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Blocked Time Slots</h1>
            <p className="text-gray-500 mt-1">
              Block specific time slots when you're unavailable
            </p>
          </div>
          
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-barbershop-navy hover:bg-barbershop-navy/90"
          >
            Block New Time Slot
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Blocked Slots</CardTitle>
            <CardDescription>
              These time slots will not be available for appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center p-6">Loading blocked slots...</div>
            ) : currentBlockedSlots.length === 0 ? (
              <div className="text-center p-6 border rounded-md bg-gray-50">
                <Ban className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium">No Blocked Slots</h3>
                <p className="text-gray-500 mb-4">
                  You haven't blocked any time slots yet. Block slots when you're unavailable for appointments.
                </p>
                <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                  Block a Time Slot
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
        {currentBlockedSlots.map((slot) => {
          const start = new Date(`${slot.date}T${slot.startTime}`);
          const end = new Date(`${slot.date}T${slot.endTime}`);

          return (
            <div key={slot._id} className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <div className="font-medium">
                  {format(start, 'MMMM d, yyyy')}
                </div>
                <div className="text-gray-600">
                  {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleEdit(slot)}
                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleDelete(slot._id)}
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
        
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Blocked Time Slot' : 'Block a Time Slot'}</DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? 'Modify the date and time range for this blocked slot' 
                  : 'Select a date and time range when you\'ll be unavailable'}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                  <Button 
                    type="submit" 
                    className="bg-barbershop-navy hover:bg-barbershop-navy/90"
                  >
                    Block Time Slot
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
        {/* Confirmation Dialog */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Replace All Blocked Slots</DialogTitle>
              <DialogDescription>
                You already have 7 blocked slot entries. Adding more will delete all your existing blocked slots. 
                Do you want to continue?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsConfirmDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="bg-barbershop-navy hover:bg-barbershop-navy/90"
                onClick={handleConfirmedReplace}
              >
                Yes, Replace All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </Layout>
  );
}
