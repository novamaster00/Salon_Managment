import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createWalkIn, getAllBarbers } from '@/lib/api';
import { WalkIn as WalkInType, Barber } from '@/lib/types';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Users } from 'lucide-react';

const formSchema = z.object({
  customerName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  customerPhone: z.string().min(10, { message: 'Please enter a valid phone number' }),
  customerEmail: z.string().email({ message: 'Please enter a valid email address' }),
  service: z.string().min(1, { message: 'Please select a service' }),
  barberId: z.string().min(1, { message: 'Please select a barber' }),
  arrivalTime: z.string().min(1, { message: 'Please select an arrival time' }),
  notes: z.string().optional(),
});

const SERVICES = [
  { name: 'Haircut' },
  { name: 'Beard Trim' },
  { name: 'Haircut & Beard Trim' },
  { name: 'Hair Color' },
  { name: 'Kids Haircut' },
];

export default function WalkInPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedWalkIn, setConfirmedWalkIn] = useState<WalkInType | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      service: '',
      barberId: '',
      arrivalTime: '',
      notes: '',
    },
  });

  // Fetch barbers when component mounts
  useEffect(() => {
    async function fetchBarbers() {
      try {
        setIsLoadingBarbers(true);
        const barberList = await getAllBarbers();
        setBarbers(barberList);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load barbers. Please refresh the page.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingBarbers(false);
      }
    }

    fetchBarbers();
  }, [toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      const response = await createWalkIn({
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail,
        service: values.service,
        barberId: values.barberId,
        date: today,
        arrivalTime: values.arrivalTime,
        notes: values.notes,
      });
      
      setConfirmedWalkIn(response);
      
      toast({
        title: 'Added to Queue',
        description: `You've been added to the walk-in queue.`,
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join walk-in queue. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Layout>
      <div className="app-container py-12">
        {/* Header section */}
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-barbershop-navy">Join Our Walk-in Queue</h1>
          <p className="text-gray-600 text-lg">
            Add yourself to today's walk-in queue and we'll notify you when it's your turn.
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          {confirmedWalkIn ? (
            <Card className="animate-fade-in border-0 shadow-xl">
              <CardHeader className="bg-barbershop-navy rounded-t-xl pb-6">
                <div className="mx-auto bg-barbershop-gold text-barbershop-navy rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Check className="h-8 w-8" />
                </div>
                <CardTitle className="text-center text-2xl text-white">You're in the Queue!</CardTitle>
              </CardHeader>
              
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <p className="text-gray-600 mb-3">Confirmed!</p>
                </div>
                
                <div className="space-y-5 bg-gray-50 p-6 rounded-xl">
                  <div className="flex justify-between items-center border-b pb-3">
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-semibold text-barbershop-navy">{confirmedWalkIn.customerName}</p>
                  </div>
                  
                  <div className="flex justify-between items-center border-b pb-3">
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="font-semibold text-barbershop-navy">{confirmedWalkIn.service}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">Estimated Start Time</p>
                    <p className="font-semibold text-barbershop-navy">
                      {confirmedWalkIn.startTime}
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 text-center">
                  <Button
                    onClick={() => setConfirmedWalkIn(null)}
                    className="bg-barbershop-navy hover:bg-barbershop-navy/90 text-white py-6 px-8"
                  >
                    Add Another Walk-in
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-barbershop-navy text-white rounded-t-xl">
                <div className="mx-auto bg-barbershop-gold text-barbershop-navy rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <CardTitle className="text-center text-2xl">Walk-in Registration</CardTitle>
              </CardHeader>
              
              <CardContent className="p-8">
                <div className="mb-6 bg-gray-50 p-5 rounded-xl border-l-4 border-barbershop-gold">
                  <h2 className="font-semibold text-lg mb-2 text-barbershop-navy">How it works</h2>
                  <p className="text-gray-600">
                    Fill out this form to join today's walk-in queue. Once submitted, you'll receive a confirmation and your
                    appointment details. We'll text you when it's almost your turn.
                  </p>
                </div>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} className="py-6" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} className="py-6" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="your.email@example.com" {...field} className="py-6" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
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
                              <SelectTrigger className="py-6">
                                <SelectValue placeholder="Select a service" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SERVICES.map((service, index) => (
                                <SelectItem key={index} value={service.name} className="py-3">
                                  {service.name}
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
                      name="barberId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Barber</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isLoadingBarbers || barbers.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger className="py-6">
                                <SelectValue placeholder={isLoadingBarbers ? "Loading barbers..." : "Select a barber"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {barbers.map((barber) => (
                                <SelectItem key={barber._id} value={barber._id} className="py-3">
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
                      name="arrivalTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Arrival Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} className="py-6" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any specific preferences or requests?" 
                              {...field} 
                              className="min-h-24"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-barbershop-gold text-barbershop-navy hover:bg-barbershop-gold/90 py-6 text-lg font-semibold"
                      disabled={isSubmitting || isLoadingBarbers}
                    >
                      {isSubmitting ? 'Processing...' : 'Join Queue'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}