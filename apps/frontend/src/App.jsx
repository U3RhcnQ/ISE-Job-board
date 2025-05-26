import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Import icons for the mobile menu and user avatar
import { Menu, X, UserCircle } from 'lucide-react';

// Import your page components
import Info from './pages/Info'; // Assuming you will create this page
import Login from './pages/Login';
import Jobs from './pages/Jobs';

// Placeholder pages for the new links
const Ranking = () => <h1 className="text-3xl font-bold">Ranking Page</h1>;
const ResidencyInfo = () => <h1 className="text-3xl font-bold">Residency Information Page</h1>;


function App() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 text-foreground">
            {/* The header container gives padding to the floating navbar */}
            <header className="sticky top-0 z-50 w-full p-2 md:p-4">
                {/* The visible "floating" navbar with shadow and rounded corners, but no border */}
                <div className="container mx-auto flex h-16 items-center justify-between rounded-full bg-background/80 px-4 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">

                    {/* Left Side: Logo */}
                    <Link to="/jobs" className="flex items-center gap-2">
                        <span className="text-2xl font-black">[ISE]</span>
                    </Link>

                    {/* Center: Desktop Navigation */}
                    <nav className="hidden md:flex gap-1">
                        <Button asChild variant="ghost">
                            <Link to="/jobs">Jobs Board</Link>
                        </Button>
                        <Button asChild variant="ghost">
                            <Link to="/ranking">Ranking</Link>
                        </Button>
                        <Button asChild variant="ghost">
                            <Link to="/info">Residency Information</Link>
                        </Button>
                    </nav>

                    {/* Right Side: My Account Button */}
                    <div className="hidden md:flex ">
                        <Button className={"bg-green-600 hover:bg-green-700 text-white"}>
                            <UserCircle className="mr-2 h-5 w-5" />
                            My Account
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <Button onClick={() => setIsMenuOpen(!isMenuOpen)} variant="ghost" size="icon">
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden mt-2 rounded-lg border bg-background p-4 shadow-lg">
                        <nav className="flex flex-col items-start gap-2">
                            <Link to="/jobs" onClick={() => setIsMenuOpen(false)} className="w-full rounded-md p-2 text-left hover:bg-accent">Jobs Board</Link>
                            <Link to="/ranking" onClick={() => setIsMenuOpen(false)} className="w-full rounded-md p-2 text-left hover:bg-accent">Ranking</Link>
                            <Link to="/info" onClick={() => setIsMenuOpen(false)} className="w-full rounded-md p-2 text-left hover:bg-accent">Residency Information</Link>
                            <div className="w-full border-t pt-4 mt-2">
                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                                    <UserCircle className="mr-2 h-5 w-5" />
                                    My Account
                                </Button>
                            </div>
                        </nav>
                    </div>
                )}
            </header>

            {/* Page Content */}
            <main className="w-full max-w-7xl mx-auto p-2 md:p-4">
                <Routes>
                    {/* The root path "/" should probably go to the login or jobs page */}
                    <Route path="/" element={<Jobs />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/ranking" element={<Ranking />} />
                    <Route path="/info" element={<ResidencyInfo />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;