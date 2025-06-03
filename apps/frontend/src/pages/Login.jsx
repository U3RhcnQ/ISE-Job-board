import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Added Navigate and useLocation
import { useAuth } from '../hooks/useAuth.js';
import { AlertCircle } from 'lucide-react'; // For error display
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'; // Make sure you've added this: npm run ui alert

const Login = () => {
    // State for form inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Get auth state and functions from AuthContext
    const { login, isLoading, error, logoutSuccess, setLogoutSuccess, isAuthenticated, user } =
        useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        await login(email, password);
        // Navigation to original destination or '/jobs' is handled by login function success or useEffect below
    };

    // If user is already authenticated and tries to go to /login, redirect them.
    // Also handles redirection after successful login if login function itself doesn't redirect.
    useEffect(() => {
        if (isAuthenticated && user) {
            // Get the path the user was trying to access before being redirected to login, or default to /jobs
            const from = location.state?.from?.pathname || '/jobs';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, user, navigate, location.state]);

    // This useEffect hook will trigger when 'logoutSuccess' or 'setLogoutSuccess' changes.
    useEffect(() => {
        if (logoutSuccess) {
            //set a timer.
            const timerId = setTimeout(() => {
                // After 3 seconds, clear the success message.
                setLogoutSuccess(null);
            }, 3000);

            return () => clearTimeout(timerId);
        }
    }, [logoutSuccess, setLogoutSuccess]); // Dependencies for the effect

    return (
        // This outer div centers the card vertically and horizontally on the page.
        // min-h-[80vh] gives it a minimum height to push the card down into the viewport.
        <div className='flex items-center justify-center min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-9rem)] px-4 py-8'>
            {' '}
            {/* Adjusted min-height for navbar */}
            <Card className='w-full max-w-sm border-2 border-green-500 shadow-xl'>
                <CardHeader className='text-center space-y-2'>
                    <CardTitle className='text-4xl font-black'>[PETR]</CardTitle>
                    <CardDescription className='text-lg'>Jobs Board</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className='grid gap-4'>
                        {/* Display login errors here */}
                        {error && (
                            <Alert
                                variant='destructive'
                                className='bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50'
                            >
                                <AlertCircle className='h-4 w-4 text-red-600 dark:text-red-400' />
                                <AlertTitle className='text-red-700 dark:text-red-300'>
                                    Login Failed
                                </AlertTitle>
                                <AlertDescription className='text-red-600 dark:text-red-400'>
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}

                        {logoutSuccess && (
                            <Alert
                                variant='default'
                                className='bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700/50'
                            >
                                <AlertCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
                                <AlertTitle className='text-green-700 dark:text-green-300'>
                                    Logged out successfully
                                </AlertTitle>
                            </Alert>
                        )}

                        {/* Email Input Field */}
                        <div className='grid gap-1.5'>
                            <Label htmlFor='email'>Email</Label>
                            <Input
                                id='email'
                                type='email'
                                placeholder='Email'
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                className='h-10'
                            />
                        </div>

                        {/* Password Input Field */}
                        <div className='grid gap-1.5'>
                            <Label htmlFor='password'>Password</Label>
                            <Input
                                id='password'
                                type='password'
                                placeholder='Password'
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                className='h-10'
                            />
                        </div>

                        <Button
                            type='submit'
                            className='w-full bg-green-600 hover:bg-green-700 text-white mt-2 h-10'
                            disabled={isLoading}
                        >
                            {isLoading ? 'Logging in...' : 'LOGIN'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className='flex justify-center'>
                    <Button asChild variant='link' className='text-sm text-muted-foreground'>
                        <Link to='/forgot-password'>Forgot Password?</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;
