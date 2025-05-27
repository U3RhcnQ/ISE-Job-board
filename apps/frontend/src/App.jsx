// src/App.jsx
import React, { useState } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X, UserCircle, LogOut, Briefcase, BarChart2, InfoIcon as InfoPageIcon } from 'lucide-react'; // Renamed InfoIcon
import { AuthProvider, useAuth } from './context/AuthContext';

// Page Components
import Login from './pages/Login';
import Jobs from './pages/Jobs';
import JobDetailPage from './pages/JobDetailPage';

// Placeholder Page Components
const Ranking = () => <div className="container mx-auto p-8"><h1 className="text-3xl font-bold">Ranking Page</h1><p>Content for Ranking will go here.</p></div>;
const ResidencyInfo = () => <div className="container mx-auto p-8"><h1 className="text-3xl font-bold">Residency Information Page</h1><p>Content for Residency Information will go here.</p></div>;

// ProtectedRoute HOC
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>; // Or a nice spinner
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
};

function AppLayout() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout, isAuthenticated } = useAuth();
    const location = useLocation(); // To close menu on navigation

    const commonLinkClasses = "w-full rounded-md p-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none";
    const commonButtonClasses = "justify-start";

    // Close menu on navigation
    React.useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);


    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-900 text-foreground">
            {isAuthenticated && ( // Only show header if authenticated
                <header className="sticky top-0 z-50 w-full p-2 md:p-4">
                    <div className="container mx-auto flex h-16 items-center justify-between rounded-full bg-background/80 px-4 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
                        <Link to="/jobs" className="flex items-center gap-2">
                            <Briefcase className="h-7 w-7 text-primary" />
                            <span className="text-xl font-black text-primary hidden sm:inline">[ISE]</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-1">
                            <Button asChild variant="ghost" className={commonButtonClasses}>
                                <Link to="/jobs">Jobs Board</Link>
                            </Button>
                            <Button asChild variant="ghost" className={commonButtonClasses}>
                                <Link to="/ranking">Ranking</Link>
                            </Button>
                            <Button asChild variant="ghost" className={commonButtonClasses}>
                                <Link to="/info">Residency Info</Link>
                            </Button>
                        </nav>

                        <div className="hidden md:flex items-center gap-3">
                            {user && <span className="text-sm text-muted-foreground">Hi, {user.first_name}</span>}
                            <Button variant="outline" size="sm" onClick={logout}>
                                <LogOut className="mr-2 h-4 w-4" /> Logout
                            </Button>
                        </div>

                        <div className="md:hidden">
                            <Button onClick={() => setIsMenuOpen(!isMenuOpen)} variant="ghost" size="icon">
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </Button>
                        </div>
                    </div>

                    {isMenuOpen && (
                        <div className="md:hidden absolute top-full left-0 right-0 mx-2 mt-2 rounded-lg border bg-background p-4 shadow-lg">
                            <nav className="flex flex-col items-start gap-2">
                                <Link to="/jobs" className={commonLinkClasses}><Briefcase className="inline mr-2 h-4 w-4"/>Jobs Board</Link>
                                <Link to="/ranking" className={commonLinkClasses}><BarChart2 className="inline mr-2 h-4 w-4"/>Ranking</Link>
                                <Link to="/info" className={commonLinkClasses}><InfoPageIcon className="inline mr-2 h-4 w-4"/>Residency Info</Link>
                                <div className="w-full border-t border-border pt-3 mt-3">
                                    {user && <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Hi, {user.first_name}</div>}
                                    <Button className={`w-full ${commonButtonClasses}`} variant="ghost" onClick={logout}>
                                        <LogOut className="mr-2 h-4 w-4" /> Logout
                                    </Button>
                                </div>
                            </nav>
                        </div>
                    )}
                </header>
            )}

            <main className="p-4 md:p-8">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
                    <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
                    <Route path="/job/:jobId" element={<ProtectedRoute><JobDetailPage /></ProtectedRoute>} />
                    <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
                    <Route path="/info" element={<ProtectedRoute><ResidencyInfo /></ProtectedRoute>} />
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