// src/context/authDefinition.js
import { createContext } from 'react';

/**
 * @typedef {object} UserProfile
 * This UserProfile type should match the structure of the 'user' object
 * you are creating in your `fetchUserProfile` function (which uses camelCase).
 * If your API sends snake_case, the mapping to camelCase happens in `fetchUserProfile`.
 * This typedef should reflect the JavaScript object.
 * @property {number} user_id      // snake_case
 * @property {string} first_name   // snake_case
 * @property {string} last_name    // snake_case
 * @property {string} email
 * @property {string} access_level // snake_case
 * @property {string} company
 * @property {number} year
 * @property {number} student_number
 * @property {boolean} ranked
 * @property {number} rep_id
 * @property {number} company_id
 */

/**
 * Defines the shape of the context value.
 * @type {{
 * token: string | null;
 * user: UserProfile | null; // Uses the UserProfile type defined above
 * isLoading: boolean;
 * error: string | null;
 * login: (email: string, password: string) => Promise<void>;
 * logout: () => void;
 * isAuthenticated: boolean;
 * }}
 */

const defaultContextValue = {
    token: null,
    user: null,
    isLoading: true,
    error: null,
    // eslint-disable-next-line no-unused-vars
    login: async (_email, _password) => {
        console.error("Login function not provided by AuthProvider");
        throw new Error('Login function not implemented in default context');
    },
    logout: () => {
        console.error("Logout function not provided by AuthProvider");
        throw new Error('Logout function not implemented in default context');
    },
    isAuthenticated: false,
};

// Make sure AuthContext is EXPORTED correctly:
export const AuthContext = createContext(defaultContextValue);