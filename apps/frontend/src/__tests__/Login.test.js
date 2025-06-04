// File: __tests__/Login.test.js
// Description: Tests for the Login component.

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login'; // Adjust path as needed
import { AuthContext } from '../context/authDefinition'; // Adjust path as needed

// Mock useNavigate
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
  useLocation: () => ({ state: null, pathname: '/login' }), // Mock useLocation
}));

const mockLogin = jest.fn();
const mockSetLogoutSuccess = jest.fn();

const renderWithAuthContext = (component, providerProps) => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={providerProps}>
        {component}
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockLogin.mockClear();
    mockedNavigate.mockClear();
    mockSetLogoutSuccess.mockClear();
  });

  // Test 1: Renders login form correctly
  test('renders login form with email, password inputs and login button', () => {
    renderWithAuthContext(<Login />, {
      login: mockLogin,
      isLoading: false,
      error: null,
      logoutSuccess: null,
      setLogoutSuccess: mockSetLogoutSuccess,
      isAuthenticated: false,
      user: null,
    });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password?/i)).toBeInTheDocument();
  });

  // Test 2: Allows typing in email and password fields
  test('allows user to type in email and password fields', () => {
    renderWithAuthContext(<Login />, {
      login: mockLogin,
      isLoading: false,
      error: null,
      logoutSuccess: null,
      setLogoutSuccess: mockSetLogoutSuccess,
      isAuthenticated: false,
      user: null,
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  // Test 3: Calls login function on form submission
  test('calls login function with email and password on form submission', async () => {
    renderWithAuthContext(<Login />, {
      login: mockLogin,
      isLoading: false,
      error: null,
      logoutSuccess: null,
      setLogoutSuccess: mockSetLogoutSuccess,
      isAuthenticated: false,
      user: null,
    });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  // Test 4: Displays error message if login fails
  test('displays error message if login prop provides an error', () => {
    const errorMessage = 'Invalid credentials';
    renderWithAuthContext(<Login />, {
      login: mockLogin,
      isLoading: false,
      error: errorMessage, // Provide an error message
      logoutSuccess: null,
      setLogoutSuccess: mockSetLogoutSuccess,
      isAuthenticated: false,
      user: null,
    });

    expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  // Test 5: Disables button and shows loading text when isLoading is true
  test('disables button and shows "Logging in..." when isLoading is true', () => {
    renderWithAuthContext(<Login />, {
      login: mockLogin,
      isLoading: true, // isLoading is true
      error: null,
      logoutSuccess: null,
      setLogoutSuccess: mockSetLogoutSuccess,
      isAuthenticated: false,
      user: null,
    });

    const loginButton = screen.getByRole('button', { name: /logging in.../i });
    expect(loginButton).toBeDisabled();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();
  });

  // Test 6: Redirects if user is already authenticated
  test('redirects to /jobs if user is already authenticated', () => {
    renderWithAuthContext(<Login />, {
      login: mockLogin,
      isLoading: false,
      error: null,
      logoutSuccess: null,
      setLogoutSuccess: mockSetLogoutSuccess,
      isAuthenticated: true, // User is authenticated
      user: { first_name: 'Test', access_level: 'student' },
    });

    expect(mockedNavigate).toHaveBeenCalledWith('/jobs', { replace: true });
  });

   // Test 7: Redirects to 'from' location if user is authenticated and 'from' exists
   test('redirects to "from" location if user is authenticated and location.state.from exists', () => {
    const fromLocation = { pathname: '/some-protected-page' };
    // Mock useLocation to return a state with 'from'
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
        state: { from: fromLocation },
        pathname: '/login',
    });

    renderWithAuthContext(<Login />, {
        login: mockLogin,
        isLoading: false,
        error: null,
        logoutSuccess: null,
        setLogoutSuccess: mockSetLogoutSuccess,
        isAuthenticated: true, // User is authenticated
        user: { first_name: 'Test', access_level: 'student' },
    });

    expect(mockedNavigate).toHaveBeenCalledWith(fromLocation.pathname, { replace: true });
    jest.restoreAllMocks(); // Restore original useLocation
  });


  // Test 8: Displays logout success message if logoutSuccess is true
  test('displays logout success message if logoutSuccess is true', async () => {
    jest.useFakeTimers();
    renderWithAuthContext(<Login />, {
      login: mockLogin,
      isLoading: false,
      error: null,
      logoutSuccess: true, // Logout was successful
      setLogoutSuccess: mockSetLogoutSuccess,
      isAuthenticated: false,
      user: null,
    });

    expect(screen.getByText(/logged out successfully/i)).toBeInTheDocument();

    // Fast-forward timers
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Ensure setLogoutSuccess was called to clear the message
    expect(mockSetLogoutSuccess).toHaveBeenCalledWith(null);
    jest.useRealTimers();
  });

  // Test 9: Clears logout success message after a delay
  test('clears logout success message after 3 seconds', async () => {
    jest.useFakeTimers();
    renderWithAuthContext(<Login />, {
      login: mockLogin,
      isLoading: false,
      error: null,
      logoutSuccess: true,
      setLogoutSuccess: mockSetLogoutSuccess,
      isAuthenticated: false,
      user: null,
    });

    expect(screen.getByText(/logged out successfully/i)).toBeInTheDocument();

    // Fast-forward time by 3000ms
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // The message should be cleared by calling setLogoutSuccess(null)
    expect(mockSetLogoutSuccess).toHaveBeenCalledWith(null);

    // To further test that the message is gone, you might need to re-render or check a condition
    // that depends on logoutSuccess being null. For simplicity, we trust setLogoutSuccess works.
    jest.useRealTimers();
  });

  // Test 10: "Forgot Password?" link navigates correctly
  test('"Forgot Password?" link has correct href', () => {
    renderWithAuthContext(<Login />, {
      login: mockLogin,
      isLoading: false,
      error: null,
      logoutSuccess: null,
      setLogoutSuccess: mockSetLogoutSuccess,
      isAuthenticated: false,
      user: null,
    });
    const forgotPasswordLink = screen.getByText(/forgot password?/i);
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
  });
});