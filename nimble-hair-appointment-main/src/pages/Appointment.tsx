
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getAllBarbers, checkAvailability, createAppointment } from '@/lib/api';
import { Barber, Appointment as AppointmentType } from '@/lib/types';
import Layout from '@/components/Layout';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  phoneNumber: z.string().min(10, { message: 'Please enter a valid phone number' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  barberId: z.string().min(1, { message: 'Please select a barber' }),
  service: z.string().min(1, { message: 'Please select a service' }),
  date: z.date({
    required_error: 'Please select a date',
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'Please select a valid time in HH:MM format' 
  }),
});

const SERVICES = [
  { id: 'haircut', name: 'Haircut' },
  { id: 'beard_trim', name: 'Beard Trim' },
  { id: 'haircut_beard', name: 'Haircut & Beard Trim' },
  { id: 'hair_color', name: 'Hair Color' },
  { id: 'kids_cut', name: 'Kids Haircut' },
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30',
];

export default function AppointmentPage() {
  const { toast } = useToast();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [checkedAppointment, setCheckedAppointment] = useState<AppointmentType | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      email: '',
      barberId: '',
      service: '',
      time: '',
    },
  });

  useEffect(() => {
    async function fetchBarbers() {
      try {
        const data = await getAllBarbers();
        setBarbers(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch barbers. Please try again later.',
          variant: 'destructive',
        });
      }
    }

    fetchBarbers();
  }, [toast]);

  async function handleCheck(values: z.infer<typeof formSchema>) {
    try {
      setIsChecking(true);
      setCheckedAppointment(null);
      
      const formattedDate = format(values.date, 'yyyy-MM-dd');
      
      const response = await checkAvailability({
        barberId: values.barberId,
        date: formattedDate,
        requestedTime: values.time,
        service: values.service
      });
      
      setCheckedAppointment(response);
      
      toast({
        title: 'Slot Available',
        description: 'This time slot is available. You can now book your appointment.',
      });
    } catch (error) {
      toast({
        title: 'Slot Unavailable',
        description: error instanceof Error ? error.message : 'This time slot is not available. Please select another time.',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  }

  async function handleBook() {
    if (!checkedAppointment) {
      toast({
        title: 'Error',
        description: 'Please check availability first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsBooking(true);
      
      const values = form.getValues();
      const formattedDate = format(values.date, 'yyyy-MM-dd');
      
      const response = await createAppointment({
        name: values.name,
        phoneNumber: values.phoneNumber,
        email: values.email,
        barberId: values.barberId,
        service: values.service,
        date: formattedDate,
        requestedTime: values.time,
      });
      
      toast({
        title: 'Appointment Booked',
        description: `Your appointment has been successfully booked. Your token number is ${response.tokenNumber || 'N/A'}.`,
      });
      
      // Reset form and state
      form.reset();
      setCheckedAppointment(null);
    } catch (error) {
      toast({
        title: 'Booking Failed',
        description: error instanceof Error ? error.message : 'Failed to book appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Book an Appointment</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCheck)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="barberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barber</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
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
                
                <FormField
                  control={form.control}
                  name="service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SERVICES.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              // Disable past dates and Sundays (assuming Sunday = 0)
                              return date < new Date(new Date().setHours(0, 0, 0, 0)) || 
                                     date.getDay() === 0;
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
                
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time} value={time}>
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
              
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <Button 
                  type="submit" 
                  className="bg-barbershop-navy hover:bg-barbershop-navy/90"
                  disabled={isChecking}
                >
                  {isChecking ? 'Checking...' : 'Check Availability'}
                </Button>
                
                <Button 
                  type="button" 
                  className="bg-barbershop-gold text-barbershop-navy hover:bg-barbershop-gold/90"
                  disabled={!checkedAppointment || isBooking}
                  onClick={handleBook}
                >
                  {isBooking ? 'Booking...' : 'Book Appointment'}
                </Button>
              </div>
            </form>
          </Form>
          
          {checkedAppointment && (
            <div className="mt-6 p-4 border border-green-200 bg-green-50 rounded-md">
              <div className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                <div>
                  <h3 className="font-semibold text-green-800">Time Slot Available</h3>
                  <p className="text-sm text-green-700 mt-1">
                    We've confirmed this slot is available. Click "Book Appointment" to secure your reservation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
