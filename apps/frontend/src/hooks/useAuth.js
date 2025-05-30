// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../context/authDefinition';

/**
 * Custom hook to access the authentication context.
 * @returns {{token: (string|null),
 * user: (UserProfile|null),
 * isLoading: boolean,
 * error: (string|null),
 * login: (function(string, string): Promise<void>),
 * logout: (function(): void), isAuthenticated: boolean}}
 */

export const useAuth = () => useContext(AuthContext);