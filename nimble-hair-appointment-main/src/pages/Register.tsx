import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { register as apiRegister } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';


const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),

  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
    // .refine((val) => val.endsWith('@gmail.com'), {
    //   message: 'Email must be a Gmail address',
    // }),

  phone: z.string()
    .regex(/^\d{10}$/, { message: 'Phone number must be exactly 10 digits' }),

  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),

  confirmPassword: z.string(),

  role: z.enum(['customer', 'barber', 'admin'], {
    required_error: 'Please select a role'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login: authLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone:'',
      role: 'customer'
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const response = await apiRegister(
        values.email, 
        values.password, 
        values.role,
        values.name,
        values.phone,
      );
      
      setUserEmail(values.email);
      setIsRegistered(true);

      //authLogin(response.token, response.user);
      
      toast({
        title: 'Registration successful!',
        description: 'Please check your email to verify your account before logging in.',
        duration: 6000,
      });
      
      // // Redirect based on role
      // if (values.role === 'admin' || values.role === 'barber') {
      //   navigate('/dashboard');
      // } else {  
      //   navigate('/');
      // }
    } catch (error) {
      console.error('Registration error, error');
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An error occurred during registration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }


  if (isRegistered) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white p-8 rounded-xl shadow-lg border">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email!</h1>
              <p className="text-gray-600 mb-4">
                We've sent a verification link to <strong>{userEmail}</strong>
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
              <ol className="text-sm text-blue-800 text-left space-y-1">
                <li>1. Check your email inbox</li>
                <li>2. Click the verification link</li>
                <li>3. Return here to log in</li>
              </ol>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/login')} 
                className="w-full bg-barbershop-gold text-barbershop-navy hover:bg-barbershop-gold/90"
              >
                Proceed to Login
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsRegistered(false);
                  form.reset();
                }}
                className="w-full"
              >
                Register Another Account
              </Button>
            </div>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>Didn't receive the email? Check your spam folder or contact support.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Create an Account</h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>phone</FormLabel>
                  <FormControl>
                    <Input placeholder="81115564897" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>I am a:</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="customer" />
                        </FormControl>
                        <FormLabel className="cursor-pointer">Customer</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="barber" />
                        </FormControl>
                        <FormLabel className="cursor-pointer">Barber</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="admin" />
                        </FormControl>
                        <FormLabel className="cursor-pointer">Admin</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-barbershop-gold text-barbershop-navy hover:bg-barbershop-gold/90 font-bold shadow-md py-3 rounded-xl text-lg transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Register'}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-barbershop-navy hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
 }

