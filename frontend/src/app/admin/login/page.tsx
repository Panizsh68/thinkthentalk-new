
'use client';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import { useAdminAuth } from '@/lib/auth/admin-auth-provider';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/icons/logo';
import { PasswordInput } from '@/components/ui/password-input';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      await login(values.email, values.password);
      toast({ title: 'Login Successful', description: 'Welcome to the admin dashboard.' });
      router.push('/admin');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container flex min-h-screen items-center justify-center bg-background">
       <Card className="w-full max-w-md">
         <CardHeader className="text-center">
            <Logo className="h-12 w-auto mx-auto text-primary" />
            <CardTitle className="mt-4">Admin Panel</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
         </CardHeader>
         <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="admin-login-form">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                            <Input placeholder="admin@example.com" {...field} data-testid="admin-email-input" dir="ltr" />
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
                            <PasswordInput placeholder="••••••••" {...field} data-testid="admin-password-input" dir="ltr" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading} data-testid="admin-login-button">
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <LogIn className="mr-2 h-4 w-4" />
                        )}
                        <span>Login</span>
                    </Button>
                </form>
            </Form>
         </CardContent>
       </Card>
    </div>
  );
}
