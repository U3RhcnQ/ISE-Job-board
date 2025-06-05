// File: __tests__/App.test.js
// Description: Tests for the main App component, focusing on routing and layout.

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import App from '../App'; // Assuming App.jsx is in the src folder
import { AuthProvider, AuthContext } from '../context/AuthContext'; // Adjust path as needed

// Mock child components to simplify App testing
jest.mock('../pages/Login', () => () => <div data-testid="login-page">Login Page</div>);
jest.mock('../pages/Jobs', () => () => <div data-testid="jobs-page">Jobs Page</div>);
jest.mock('../pages/Ranking', () => () => <div data-testid="ranking-page">Ranking Page</div>);
jest.mock('../pages/ResidencyInfo', () => () => <div data-testid="residency-info-page">Residency Info Page</div>);
jest.mock('../pages/Company', () => () => <div data-testid="company-page">Company Page</div>);
jest.mock('../pages/AdminDashboard', () => () => <div data-testid="admin-dashboard-page">Admin Dashboard</div>);
jest.mock('../pages/JobDetailPage', () => () => <div data-testid="job-detail-page">Job Detail Page</div>);
jest.mock('../components/loadingSpinner', () => ({ text }) => <div data-testid="loading-spinner">{text}</div>);


// Custom render function to wrap components with necessary providers
const renderWithProviders = (
    ui,
    {
        providerProps = {
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            login: jest.fn(),
            logout: jest.fn(),
            // Add other context values if needed
        },
        route = '/',
        ...renderOptions
    } = {}
) => {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <AuthContext.Provider value={providerProps}>
                {ui}
            </AuthContext.Provider>
        </MemoryRouter>,
        renderOptions
    );
};


describe('App Component and Routing', () => {
    // Test 1: Renders Login page for unauthenticated users by default
    test('renders Login page for unauthenticated users on root path', () => {
        renderWithProviders(<App />);
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    // Test 2: Renders Login page when navigating to /login
    test('renders Login page when navigating to /login', () => {
        renderWithProviders(<App />, { route: '/login' });
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    // Test 3: Redirects to Login when accessing a protected route unauthenticated
    test('redirects to Login when accessing /jobs unauthenticated', () => {
        renderWithProviders(<App />, { route: '/jobs' });
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    // Test 4: Renders Jobs page for authenticated student user on root path
    test('renders Jobs page for authenticated student user on root path', () => {
        const studentUser = { access_level: 'student', first_name: 'Test' };
        renderWithProviders(<App />, {
            providerProps: {
                user: studentUser,
                isAuthenticated: true,
                isLoading: false,
                logout: jest.fn(),
            },
            route: '/',
        });
        expect(screen.getByTestId('jobs-page')).toBeInTheDocument();
        expect(screen.getByText(/Jobs Board/i)).toBeInTheDocument(); // Check for header presence
    });

    // Test 5: Renders Company page for authenticated rep user on root path
    test('renders Company page for authenticated rep user on root path', () => {
        const repUser = { access_level: 'rep', first_name: 'Test' };
        renderWithProviders(<App />, {
            providerProps: {
                user: repUser,
                isAuthenticated: true,
                isLoading: false,
                logout: jest.fn(),
            },
            route: '/',
        });
        expect(screen.getByTestId('company-page')).toBeInTheDocument();
    });

    // Test 6: Renders Jobs page for authenticated admin user on root path
    test('renders Jobs page for authenticated admin user on root path', () => {
        const adminUser = { access_level: 'admin', first_name: 'Test' };
        renderWithProviders(<App />, {
            providerProps: {
                user: adminUser,
                isAuthenticated: true,
                isLoading: false,
                logout: jest.fn(),
            },
            route: '/',
        });
        expect(screen.getByTestId('jobs-page')).toBeInTheDocument();
    });


    // Test 7: Header navigation for Student
    test('displays correct header links for student', () => {
        const studentUser = { access_level: 'student', first_name: 'Student' };
        renderWithProviders(<App />, {
            providerProps: { user: studentUser, isAuthenticated: true, isLoading: false, logout: jest.fn() },
            route: '/jobs', // A page where header is visible
        });
        expect(screen.getByText('Jobs Board')).toBeInTheDocument();
        expect(screen.getByText('Ranking')).toBeInTheDocument();
        expect(screen.getByText('Residency Info')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    // Test 8: Header navigation for Rep
    test('displays correct header links for rep', () => {
        const repUser = { access_level: 'rep', first_name: 'Rep' };
        renderWithProviders(<App />, {
            providerProps: { user: repUser, isAuthenticated: true, isLoading: false, logout: jest.fn() },
            route: '/jobs',
        });
        expect(screen.getByText('Jobs Board')).toBeInTheDocument();
        expect(screen.getByText('Your company')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    // Test 9: Header navigation for Admin
    test('displays correct header links for admin', () => {
        const adminUser = { access_level: 'admin', first_name: 'Admin' };
        renderWithProviders(<App />, {
            providerProps: { user: adminUser, isAuthenticated: true, isLoading: false, logout: jest.fn() },
            route: '/jobs',
        });
        expect(screen.getByText('Jobs Board')).toBeInTheDocument();
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Residency Info')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    // Test 10: Logout functionality
    test('calls logout function when logout button is clicked', () => {
        const mockLogout = jest.fn();
        const studentUser = { access_level: 'student', first_name: 'Student' };
        renderWithProviders(<App />, {
            providerProps: { user: studentUser, isAuthenticated: true, isLoading: false, logout: mockLogout },
            route: '/jobs',
        });
        fireEvent.click(screen.getByText('Logout'));
        expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    // Test 11: Mobile menu toggle
    test('toggles mobile menu on button click', () => {
        const studentUser = { access_level: 'student', first_name: 'Student' };
        renderWithProviders(<App />, {
            providerProps: { user: studentUser, isAuthenticated: true, isLoading: false, logout: jest.fn() },
            route: '/jobs',
        });

        // Menu should be closed initially on larger screens (hidden class applies to md:flex)
        // For mobile, we find the toggle button.
        // The actual visibility of the menu content is harder to test without inspecting styles or specific class changes.
        // We will check if the button exists and can be clicked.
        const menuButton = screen.getByRole('button', { name: /menu/i }); // Assuming an accessible name for the menu toggle
        expect(menuButton).toBeInTheDocument();
        fireEvent.click(menuButton);
        // After click, the icon should change to X, or the menu content should appear.
        // Let's assume the button's accessible name changes or an X icon appears.
        // If the menu content appears, we can check for a link within it.
        expect(screen.getByRole('link', { name: /Jobs Board/i })).toBeVisible(); // Check link in open menu
        fireEvent.click(menuButton); // Click again to close
        // Add assertion for menu being closed if possible, e.g., a link is no longer visible or accessible.
    });


    // Test 12: Protected Route - Student accessing Ranking page
    test('student can access /ranking', () => {
        const studentUser = { access_level: 'student', first_name: 'Test' };
        renderWithProviders(<App />, {
            providerProps: { user: studentUser, isAuthenticated: true, isLoading: false },
            route: '/ranking',
        });
        expect(screen.getByTestId('ranking-page')).toBeInTheDocument();
    });

    // Test 13: Protected Route - Rep cannot access Ranking page, redirects to their home (Company)
    test('rep cannot access /ranking and is redirected', () => {
        const repUser = { access_level: 'rep', first_name: 'Test' };
        renderWithProviders(<App />, {
            providerProps: { user: repUser, isAuthenticated: true, isLoading: false },
            route: '/ranking', // Attempt to access
        });
        // Rep's default page is /company
        expect(screen.getByTestId('company-page')).toBeInTheDocument();
        expect(screen.queryByTestId('ranking-page')).not.toBeInTheDocument();
    });

    // Test 14: Protected Route - Admin can access Admin Dashboard
    test('admin can access /admin-dashboard', () => {
        const adminUser = { access_level: 'admin', first_name: 'Test' };
        renderWithProviders(<App />, {
            providerProps: { user: adminUser, isAuthenticated: true, isLoading: false },
            route: '/admin-dashboard',
        });
        expect(screen.getByTestId('admin-dashboard-page')).toBeInTheDocument();
    });

    // Test 15: Protected Route - Student cannot access Admin Dashboard, redirects to their home (Jobs)
    test('student cannot access /admin-dashboard and is redirected', () => {
        const studentUser = { access_level: 'student', first_name: 'Test' };
        renderWithProviders(<App />, {
            providerProps: { user: studentUser, isAuthenticated: true, isLoading: false },
            route: '/admin-dashboard', // Attempt to access
        });
        // Student's default page is /jobs
        expect(screen.getByTestId('jobs-page')).toBeInTheDocument();
        expect(screen.queryByTestId('admin-dashboard-page')).not.toBeInTheDocument();
    });

    // Test 16: Navigating to a specific job detail page
    test('renders JobDetailPage when navigating to /job/:jobId for admin', () => {
        const adminUser = { access_level: 'admin', first_name: 'Test' };
        renderWithProviders(<App />, {
            providerProps: { user: adminUser, isAuthenticated: true, isLoading: false },
            route: '/job/123',
        });
        expect(screen.getByTestId('job-detail-page')).toBeInTheDocument();
    });

    // Test 17: Navigating to a specific company page by ID for admin
    test('renders CompanyPage when navigating to /company/:companyId for admin', () => {
        const adminUser = { access_level: 'admin', first_name: 'Test' };
        renderWithProviders(<App />, {
            providerProps: { user: adminUser, isAuthenticated: true, isLoading: false },
            route: '/company/abc',
        });
        expect(screen.getByTestId('company-page')).toBeInTheDocument();
    });

    // Test 18: Loading state in ProtectedRoute
    test('shows loading spinner when auth is loading in ProtectedRoute', () => {
        renderWithProviders(<App />, {
            providerProps: { user: null, isAuthenticated: false, isLoading: true }, // isLoading is true
            route: '/jobs',
        });
        expect(screen.getByTestId('loading-spinner')).toHaveTextContent('Loading...');
    });

});

// --- Mocking useAuth for components that use it directly ---
// It is generally better to test components in isolation, but for App.jsx,
// testing with a mocked AuthProvider or AuthContext.Provider is more straightforward.
// If child pages also use useAuth, they would need similar mocking in their own test files.

// Example of how AuthProvider could be used if App was not wrapping Routes itself
// (This is more for illustrating testing with AuthProvider directly)
// describe('App with AuthProvider', () => {
//   test('renders login page initially', () => {
//     render(
//       <MemoryRouter initialEntries={['/']}>
//         <AuthProvider> {/* Real AuthProvider, might require mocking localStorage or fetch */}
//           <App />
//         </AuthProvider>
//       </MemoryRouter>
//     );
//     expect(screen.getByTestId('login-page')).toBeInTheDocument();
//   });
// });


