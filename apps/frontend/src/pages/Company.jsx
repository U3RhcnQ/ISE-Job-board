import {useParams} from "react-router-dom";
import { useAuth } from '../hooks/useAuth.js'
import React, {useEffect, useMemo, useState} from "react";


const Company = () => {

    const { companyId: companyIdFromParams } = useParams(); // Get ID from URL
    const { user, token, isLoading: authLoading, error: authError } = useAuth(); // Access auth context

    const [companyData, setCompanyData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE_URL = 'http://localhost:8080/api/v1';

    const effectiveCompanyId = useMemo(() => {
        if (companyIdFromParams) {
            return companyIdFromParams;
        }
        if (user && user.access_level === "rep" && user.company_id != null) {
            return String(user.company_id); // Ensure it's a string, as useParams often provides strings
        }
        return null; // No ID available
    }, [companyIdFromParams, user]); // Recalculate if URL param or user object changes


    useEffect(() => {

        if (!effectiveCompanyId) {
            setError("No company ID provided");
            setIsLoading(false);
            return;
        }

        if (authLoading) {
            return <div className="container mx-auto p-8 text-center">Loading Company details...</div>;
        }

        if (!token) {
            setError("Not authenticated. Cannot fetch company data.");
            setIsLoading(false);
            // Optionally redirect to login
            // navigate('/login');
            return;
        }

        const fetchCompanyDetails = async () => {

            setIsLoading(true);
            setError(null);

            try {
                // Example: API endpoint to get company details by its ID
                // You'll need to create this endpoint on your backend.
                const response = await fetch(`${API_BASE_URL}/company-info?company_id=${effectiveCompanyId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`, // Send token if endpoint is protected
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                    throw new Error(errorData.message || `Failed to fetch company details for ID ${effectiveCompanyId}`);
                }
                const data = await response.json();
                setCompanyData(data);
            } catch (err) {
                console.error("Error fetching company details:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanyDetails();

    }, [effectiveCompanyId, token, authLoading]); // Re-run if companyId, token, or authLoading state changes

    if (authLoading || isLoading) {
        return <div>Loading company information...</div>;
    }

    if (authError) {
        return <div>Authentication Error: {authError}. Please try logging in again.</div>;
    }

    if (error) {
        return <div>Error loading company page: {error}</div>;
    }

    if (!companyData) {
        return <div>Company not found or no data available.</div>;
    }

    // Now you can use the companyData to render your page
    // And potentially the 'user' object from useAuth() for rep-specific views or actions
    return (
        <div>
            <h1>{companyData.name}</h1>
            <p>Company ID from URL: {effectiveCompanyId}</p>
            {user && user.access_level === 'rep' && user.company_id === companyData.id && (
                <p>Welcome, representative of this company!</p>
            )}
            {/* Display other company details from companyData */}
            <p>Industry: {companyData.industry}</p>
            <p>Website: <a href={companyData.website_url}>{companyData.website_url}</a></p>
            {/* ... more details ... */}
        </div>
    );
};


export default Company;