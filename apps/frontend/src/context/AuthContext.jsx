import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './authDefinition';
import { useLocation } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Start true to check initial auth
    const [error, setError] = useState(null);
    const [logoutSuccess, setLogoutSuccess] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    /**
     * Centralized function to clear authentication data, set error, and stop loading.
     */
    const clearAuthData = useCallback((errorMessage = null) => {
        console.log('clearAuthData called. Message:', errorMessage);
        localStorage.removeItem('authToken');

        setToken(null);
        setUser(null);

        if (errorMessage) {
            setError(errorMessage);
        } else {
            setError(null);
        }

        setIsLoading(false); // Always ensure loading is stopped when auth data is cleared
    }, []); // No dependencies as it only uses setters from useState

    const fetchUserProfile = useCallback(
        async (currentToken) => {
            if (!currentToken) {
                // This condition should ideally be handled by the caller,
                // but as a safeguard:
                clearAuthData('No token provided to fetchUserProfile');
                return null;
            }

            console.log('fetchUserProfile: Starting with token.');
            setIsLoading(true); // Set loading true for this specific async operation
            setError(null); // Clear previous errors before a new fetch attempt
            setLogoutSuccess(null);

            let rawUserData = {}; // This object will accumulate data from all API calls

            try {
                // 1. Fetch Base Profile (e.g., name, email)
                const profileResponse = await fetch(`${API_BASE_URL}/profile`, {
                    headers: { Authorization: `Bearer ${currentToken}` },
                });

                if (!profileResponse.ok) {
                    let serverMessage = `Failed to fetch user profile (status: ${profileResponse.status})`;
                    if (profileResponse.status === 401 || profileResponse.status === 403) {
                        throw new Error('Session expired or invalid. Please login again.');
                    }
                    throw new Error(serverMessage);
                }

                const profileData = await profileResponse.json();
                rawUserData = { ...rawUserData, ...profileData };

                // Ensure a consistent internal ID, useful for subsequent calls
                rawUserData.internal_user_id = profileData.user_id;
                console.log('Fetched /profile data:', profileData);

                // 2. Fetch Access Level
                console.log('Fetching /access');
                const accessResponse = await fetch(`${API_BASE_URL}/access`, {
                    // Replace with your actual access endpoint
                    headers: { Authorization: `Bearer ${currentToken}` },
                });

                if (!accessResponse.ok) {
                    const errorData = await accessResponse.json().catch(() => ({}));
                    throw new Error(
                        errorData.message ||
                            `Failed to fetch access level (status: ${accessResponse.status})`
                    );
                }

                const accessData = await accessResponse.json();
                rawUserData = { ...rawUserData, ...accessData };
                console.log('Fetched /access data:', accessData);

                // Determine access level for conditional fetching
                const current_access_level = rawUserData.access_level;

                // 3. Fetch Role-Specific Information (Optional)
                if (current_access_level === 'rep') {
                    console.log('Fetching /rep-info for rep');
                    const companyInfoResponse = await fetch(
                        `${API_BASE_URL}/rep-info?user_id=${rawUserData.internal_user_id}`,
                        {
                            // Example endpoint
                            headers: { Authorization: `Bearer ${currentToken}` },
                        }
                    );
                    if (!companyInfoResponse.ok) {
                        const errorData = await companyInfoResponse.json().catch(() => ({}));
                        throw new Error(
                            errorData.message ||
                                `Failed to fetch company info for rep (status: ${companyInfoResponse.status})`
                        );
                    }
                    const companyData = await companyInfoResponse.json();
                    rawUserData = { ...rawUserData, ...companyData }; // Merge company data
                    console.log('Fetched /company-info data:', companyData);
                } else if (current_access_level === 'student') {
                    if (!rawUserData.internal_user_id) {
                        console.warn(
                            'Student ID not found in profile data to fetch student-specific info.'
                        );
                    } else {
                        console.log(
                            `Fetching /student-info for student ID: ${rawUserData.internal_user_id}`
                        );
                        const studentInfoResponse = await fetch(
                            `${API_BASE_URL}/student-info?user_id=${rawUserData.internal_user_id}`,
                            {
                                // Example
                                headers: { Authorization: `Bearer ${currentToken}` },
                            }
                        );
                        if (!studentInfoResponse.ok) {
                            const errorData = await studentInfoResponse.json().catch(() => ({}));
                            throw new Error(
                                errorData.message ||
                                    `Failed to fetch student info (status: ${studentInfoResponse.status})`
                            );
                        }
                        const studentData = await studentInfoResponse.json();
                        rawUserData = { ...rawUserData, ...studentData }; // Merge student data
                        console.log('Fetched /student-info data:', studentData);
                    }
                } else if (current_access_level === 'admin') {
                    console.log(
                        'Admin user. Additional data fetching can be added here if needed.'
                    );
                    // Example:
                    // const adminDataResponse = await fetch(`${API_BASE_URL}/admin-details`, { headers });
                    // if (!adminDataResponse.ok) throw new Error(...);
                    // const adminData = await adminDataResponse.json();
                    // rawUserData = { ...rawUserData, ...adminData };
                }

                // 4. AT THE END: Create the final 'processedUser' object by mapping from 'rawUserData'
                // This mapping should align with your UserProfile typedef in authDefinition.js (camelCase)
                const processedUser = {
                    user_id: rawUserData.internal_user_id, // Use the consistently stored ID
                    first_name: rawUserData.first_name || null,
                    last_name: rawUserData.last_name || null,
                    email: rawUserData.email,
                    access_level: current_access_level, // Use the determined access level

                    // Rep-specific fields (ensure UserProfile typedef includes these if they are part of it)
                    rep_id: rawUserData.rep_id || null,
                    company_id: rawUserData.company_id || null,

                    // Student-specific fields
                    year: rawUserData.year || null,
                    student_number: rawUserData.student_number || null,
                    ranked: rawUserData.ranked || false,
                };

                // A final sanity check for critical information
                if (!processedUser.access_level) {
                    console.error(
                        'Critical error: Processed user is missing access_level.',
                        processedUser,
                        rawUserData
                    );
                    throw new Error('User data processing failed to determine access level.');
                }

                console.log('Successfully processed all user data:', processedUser);
                setUser(processedUser);
                setIsLoading(false);
                return processedUser;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error('Error in fetchUserProfile:', errorMessage, err);
                clearAuthData(errorMessage); // Use centralized clearer
                return null; // Return null on failure as per old attempt's style
            }
        },
        [clearAuthData]
    ); // Added clearAuthData to dependencies

    // Effect for initial authentication check (similar to your old attempt's Effect 1)
    useEffect(() => {
        console.log('AuthProvider Mount: Checking for existing token.');
        const tokenFromStorage = localStorage.getItem('authToken');
        if (tokenFromStorage) {
            setToken(tokenFromStorage);
            // isLoading is true by default. The next effect or login will fetch data.
        } else {
            // No token, so not authenticated, not loading user data.
            clearAuthData(); // Clears user, token, sets error to null, isLoading to false
        }
    }, [clearAuthData]); // Run once on mount

    // Effect for fetching data when token is set and user is not (similar to your old attempt's Effect 2)
    useEffect(() => {
        if (token && !user) {
            // Only fetch if token exists and user isn't already loaded
            console.log(
                'AuthProvider Token/User Effect: Token present, user not loaded. Fetching profile.'
            );
            fetchUserProfile(token).then((fetchedUser) => {
                if (fetchedUser && fetchedUser.access_level) {
                    // Check for fetchedUser and access_level
                    // Navigation logic similar to your old attempt's handleNavigation
                    // This part is simplified; your old handleNavigation was more complex
                    console.log(`User fetched, navigating for role: ${fetchedUser.access_level}`);

                    const currentPath = location.pathname;
                    // Define paths from which we ALWAYS want to redirect after user profile is loaded
                    const pathsToRedirectFrom = ['/login'];

                    if (pathsToRedirectFrom.includes(currentPath)) {
                        switch (fetchedUser.access_level) {
                            case 'admin':
                                navigate('/jobs');
                                break;
                            case 'rep':
                                navigate('/company');
                                break;
                            case 'student':
                                navigate('/jobs');
                                break;
                            default:
                                console.warn(
                                    `Post-fetch: Unknown access level: ${fetchedUser.access_level}. Logging out.`
                                );
                                // If access level is unknown after fetching, treat as an error/logout
                                clearAuthData(`Unknown access level: ${fetchedUser.access_level}`);
                                navigate('/login'); // Redirect to log in
                        }
                    }
                } else if (fetchedUser && !fetchedUser.access_level) {
                    // User fetched but no access level, critical info missing
                    clearAuthData(
                        'User profile fetched but critical access level information is missing.'
                    );
                    navigate('/login');
                }

                // If fetchedUser is null, fetchUserProfile already called clearAuthData
            });
        }
    }, [token, user, fetchUserProfile, navigate, clearAuthData, location.pathname]);

    const login = async (email, password) => {
        setIsLoading(true); // Set loading for the overall login operation
        setError(null); // Clear previous login errors
        setLogoutSuccess(null);

        try {
            console.log('Attempting login for:', email);
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json(); // Try to get data even if response is not ok for error messages
            if (!response.ok) {
                throw new Error(data.message || `Login failed (status: ${response.status})`);
            }

            const receivedToken = data.token;
            if (!receivedToken) {
                throw new Error('Token not found in login response.');
            }

            localStorage.setItem('authToken', receivedToken);

            // This will trigger the useEffect to fetch user profile if user is null
            setToken(receivedToken);
            // Explicitly set user to null to ensure the useEffect condition (token && !user) is met
            setUser(null);

            // fetchUserProfile will be called by the useEffect due to token change and user being null.
            // fetchUserProfile will handle its own isLoading and error states,
            // and then navigate on success via the useEffect.
            // If fetchUserProfile fails, it calls clearAuthData.
            // The main login's setIsLoading(false) will be handled by the finally block.
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error('Login function error:', errorMessage, err);
            clearAuthData(errorMessage); // Use centralized clearer
            // No navigation here, user stays on login page to see the error
        } finally {
            // This ensures isLoading for the login *action* is set to false,
            // even if fetchUserProfile (triggered by useEffect) starts its own loading cycle.
            // However, since clearAuthData also sets isLoading to false, this might be redundant
            // if an error occurs. But it's good for the case where the /login API call fails before
            // token is set and useEffect runs.
            // The "old attempt" login didn't have a finally, relying on fetchAndSetFullUserData/clearAuthData
            // for all isLoading changes. This is slightly different.
            // For now, let's keep it to ensure the primary login action's loading state is reset.
            //setIsLoading(false);
        }
    };

    const logout = () => {
        setError(null);

        // Use clearAuthData, then perform additional app-specific cleanup and navigation
        clearAuthData(null); // Sets error to "User logged out.", clears auth, sets isLoading false
        setLogoutSuccess('Logged out successfully');
        // setError(null); // Optionally, clear the "User logged out." message immediately if preferred

        // App-specific items from your old attempt
        localStorage.removeItem('rankedItems');
        localStorage.removeItem('availableItems');

        navigate('/login');
    };

    const value = {
        token,
        user,
        isLoading,
        error,
        logoutSuccess,
        setLogoutSuccess,
        login,
        logout,
        // Ensure your UserProfile type includes userId for this check
        isAuthenticated: !!user && !!token && !!user.user_id,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
