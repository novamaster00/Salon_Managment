import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
import { useToast } from '@/hooks/use-toast';
import { login } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { User } from '@/lib/types'; // Make sure to import User type

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login: authLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const from = (location.state as any)?.from?.pathname || '/';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      console.log('Submitting login with values:', values); // Debug log
      
      const response = await login(values.email, values.password);
      console.log('Login response:', response); // Debug log
      
      // Check if response has the expected structure
      if (!response || !response.token || !response.user) {
        throw new Error('Invalid response from server');
      }
      
      authLogin(response.token, response.user);
      
      toast({
        title: 'Login successful',
        description: `Welcome back${response.user.name ? `, ${response.user.name}` : ''}!`,
      });
      
      // Redirect based on user role from response
      if (response.user.role === 'admin' || response.user.role === 'barber') {
        navigate('/dashboard');
      } else {
        navigate(from);
      }
    } catch (error) {
      console.error('Login error:', error); // Debug log
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An error occurred during login',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Login</h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
           
            <Button 
              type="submit" 
              className="w-full bg-barbershop-navy hover:bg-barbershop-navy/90"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-barbershop-navy hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}