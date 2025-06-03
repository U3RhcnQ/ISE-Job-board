// src/App.jsx
import React, { useState } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Button } from './components/ui/button';
import { Menu, X, LogOut, Briefcase, BarChart2, InfoIcon as InfoPageIcon } from 'lucide-react'; // Renamed InfoIcon
import loadingSpinner from "./components/loadingSpinner.jsx";
import { useAuth } from './hooks/useAuth.js';
import { AuthProvider } from './context/AuthContext';

// Page Components
import Login from './pages/Login';
import Jobs from './pages/Jobs';
import JobDetailPage from './pages/JobDetailPage';
import Ranking from './pages/Ranking';
import Company from './pages/Company';
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ResidencyInfo  from "./pages/ResidencyInfo";

// ProtectedRoute HOC
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return loadingSpinner({text: 'Loading...'});
    }

    if (!isAuthenticated) {
        return <Navigate to='/login' state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.access_level)) {
        // return <Navigate to="/unauthorised" replace />;
        return (
            <Navigate to='/' state={{ message: 'You do not have access to this page' }} replace />
        );
    }

    return children;
};

function AppLayout() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout, isAuthenticated } = useAuth();
    const location = useLocation(); // To close menu on navigation

    const commonLinkClasses =
        'w-full rounded-md p-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none';
    const commonButtonClasses = 'justify-start';

    // Close menu on navigation
    React.useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    return (
        <div className='min-h-screen bg-gray-100 dark:bg-slate-900 text-foreground'>
            {isAuthenticated && ( // Only show header if authenticated
                <header className='sticky top-0 z-50 w-full p-2 md:p-4'>
                    <div className='container mx-auto flex h-16 items-center justify-between rounded-full px-4 shadow-md md:px-6 bg-white'>
                        <Link to='/jobs' className='flex items-center gap-2'>
                            <span className='text-xl font-black text-primary hidden sm:inline'>
                                [ISE]
                            </span>
                        </Link>

                        <nav className='hidden md:flex items-center gap-1'>
                            {user?.access_level === 'student' && (
                                <>
                                    <Button asChild variant='ghost' className={commonButtonClasses}>
                                        <Link to='/jobs'>Jobs Board</Link>
                                    </Button>
                                    <Button asChild variant='ghost' className={commonButtonClasses}>
                                        <Link to='/ranking'>Ranking</Link>
                                    </Button>
                                    <Button asChild variant='ghost' className={commonButtonClasses}>
                                        <Link to='/info'>Residency Info</Link>
                                    </Button>
                                </>
                            )}
                            {user?.access_level === 'rep' && (
                                <>
                                    <Button asChild variant='ghost' className={commonButtonClasses}>
                                        <Link to='/jobs'>Jobs Board</Link>
                                    </Button>
                                    <Button asChild variant='ghost' className={commonButtonClasses}>
                                        <Link to='/company'>Your company</Link>
                                    </Button>
                                </>
                            )}
                            {user?.access_level === 'admin' && (
                                <>
                                    <Button asChild variant='ghost' className={commonButtonClasses}>
                                        <Link to='/jobs'>Jobs Board</Link>
                                    </Button>
                                    <Button asChild variant='ghost' className={commonButtonClasses}>
                                        <Link to='/admin-dashboard'>Admin Dashboard</Link>
                                    </Button>
                                    <Button asChild variant='ghost' className={commonButtonClasses}>
                                        <Link to='/info'>Residency Info</Link>
                                    </Button>
                                </>
                            )}
                        </nav>

                        <div className='hidden md:flex items-center gap-3'>
                            <Button variant='outline' size='sm' onClick={logout}>
                                <LogOut className='mr-2 h-4 w-4' /> Logout
                            </Button>
                        </div>

                        <div className='md:hidden'>
                            <Button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                variant='ghost'
                                size='icon'
                            >
                                {isMenuOpen ? (
                                    <X className='h-6 w-6' />
                                ) : (
                                    <Menu className='h-6 w-6' />
                                )}
                            </Button>
                        </div>
                    </div>

                    {isMenuOpen && (
                        <div className='md:hidden absolute top-full left-0 right-0 mx-2 mt-2 rounded-lg border bg-background p-4 shadow-lg'>
                            <nav className='flex flex-col items-start gap-2'>
                                <Link to='/jobs' className={commonLinkClasses}>
                                    <Briefcase className='inline mr-2 h-4 w-4' />
                                    Jobs Board
                                </Link>
                                <Link to='/ranking' className={commonLinkClasses}>
                                    <BarChart2 className='inline mr-2 h-4 w-4' />
                                    Ranking
                                </Link>
                                <Link to='/info' className={commonLinkClasses}>
                                    <InfoPageIcon className='inline mr-2 h-4 w-4' />
                                    Residency Info
                                </Link>
                                <div className='w-full border-t border-border pt-3 mt-3'>
                                    {user && (
                                        <div className='px-2 py-1.5 text-sm font-semibold text-muted-foreground'>
                                            Hi, {user.first_name}
                                        </div>
                                    )}
                                    <Button
                                        className={`w-full ${commonButtonClasses}`}
                                        variant='ghost'
                                        onClick={logout}
                                    >
                                        <LogOut className='mr-2 h-4 w-4' /> Logout
                                    </Button>
                                </div>
                            </nav>
                        </div>
                    )}
                </header>
            )}

            <main className='p-4 pt-4 md:p-8 md:pt-4'>
                <Routes>
                    <Route path='/login' element={<Login />} />
                    <Route
                        path='/jobs'
                        element={
                            <ProtectedRoute allowedRoles={['student', 'rep', 'admin']}>
                                <Jobs />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path='/ranking'
                        element={
                            <ProtectedRoute allowedRoles={['student']}>
                                <Ranking />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path='/info'
                        element={
                            <ProtectedRoute allowedRoles={['student', 'admin']}>
                                <ResidencyInfo />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path='/job/:jobId'
                        element={
                            <ProtectedRoute allowedRoles={['rep', 'admin']}>
                                <JobDetailPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path='/company'
                        element={
                            <ProtectedRoute allowedRoles={['rep', 'admin']}>
                                <Company />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path='/company/:companyId'
                        element={
                            <ProtectedRoute allowedRoles={['rep', 'admin']}>
                                <Company />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path='/admin-dashboard'
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    {/*Custom home depending on access level*/}
                    <Route
                        path='/'
                        element={
                            <ProtectedRoute>
                                {user?.access_level === 'student' && <Jobs />}
                                {user?.access_level === 'rep' && <Company />}
                                {user?.access_level === 'admin' && <Jobs />}
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppLayout />
        </AuthProvider>
    );
}

export default App;
