import { useParams } from 'react-router-dom'; // Added Link for potential navigation
import { useAuth } from '../hooks/useAuth.js';
import React, { useEffect, useMemo, useState } from 'react';

// Assuming these are your paths to shadcn/ui components
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button'; // For potential actions or back button
import { AlertCircle, CheckCircle2, Building, UserCheck, Globe } from 'lucide-react'; // Added more icons
import loadingSpinner from '../components/loadingSpinner.jsx';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Helper component for displaying label-value pairs
const InfoItem = ({ label, icon, children }) => (
    <div className='flex items-start py-3 border-b border-gray-100 last:border-b-0'>
        {icon && <div className='flex-shrink-0 w-6 mr-3 text-gray-500'>{icon}</div>}
        <dt className='w-1/3 text-sm font-medium text-gray-600'>{label}:</dt>
        <dd className='w-2/3 text-sm text-gray-800 break-words'>{children}</dd>
    </div>
);

const Company = () => {
    const { companyId: companyIdFromParams } = useParams();
    const { user, token, isLoading: authLoading, error: authError } = useAuth();

    const [companyData, setCompanyData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const effectiveCompanyId = useMemo(() => {
        if (companyIdFromParams) return companyIdFromParams;
        if (user && user.access_level === 'rep' && user.company_id != null) {
            return String(user.company_id);
        }
        return null;
    }, [companyIdFromParams, user]);

    useEffect(() => {
        if (authLoading) {
            setIsLoading(true);
            return;
        }
        if (!effectiveCompanyId) {
            setError('No Company ID specified or derived for your user.');
            setIsLoading(false);
            return;
        }
        if (!token) {
            setError('Authentication required to view company details.');
            setIsLoading(false);
            return;
        }

        const fetchCompanyDetails = async () => {
            setIsLoading(true);
            setError(null);
            setCompanyData(null);
            try {
                const response = await fetch(
                    `${API_BASE_URL}/company-info?company_id=${effectiveCompanyId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (!response.ok) {
                    let errorMsg = `Error ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMsg =
                            errorData.message ||
                            errorData.detail ||
                            `Failed to fetch company details. Status: ${response.status}`;
                    } catch (e) {
                        console.error(e);
                        const textError = await response.text().catch(() => '');
                        errorMsg = textError || errorMsg;
                    }
                    throw new Error(errorMsg);
                }
                const data = await response.json();
                // API provides: company_id, name, champion
                // We'll also assume it might provide industry, website_url for display
                setCompanyData(data);
            } catch (err) {
                console.error('Error fetching company details:', err);
                setError(err.message || 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchCompanyDetails();
    }, [effectiveCompanyId, token, authLoading]);

    // --- Loading State ---
    if (authLoading || (isLoading && !error && !companyData)) {
        return loadingSpinner({text: 'Loading Company Information...'});
    }

    // --- Error States ---
    const ErrorDisplay = ({ title, message }) => (
        <div className='container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-150px)]'>
            <Card className='w-full max-w-lg border-red-300 shadow-md'>
                <CardHeader className='bg-red-50'>
                    <div className='flex items-center text-red-700'>
                        <AlertCircle className='h-6 w-6 mr-3 flex-shrink-0' />
                        <CardTitle className='text-xl'>{title}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className='pt-6'>
                    <p className='text-sm text-red-600'>{message}</p>
                    <Button
                        variant='outline'
                        className='mt-4'
                        onClick={() => window.history.back()}
                    >
                        Go Back
                    </Button>
                </CardContent>
            </Card>
        </div>
    );

    if (authError) return <ErrorDisplay title='Authentication Error' message={String(authError)} />;
    if (error) return <ErrorDisplay title='Failed to Load Company Data' message={error} />;
    if (!companyData) {
        return (
            <ErrorDisplay
                title='Company Not Found'
                message={`No company data found for ID: ${effectiveCompanyId}. It might not exist or you may not have permission.`}
            />
        );
    }

    // --- Success: Display Company Data ---
    const isRepForThisCompany =
        user &&
        user.access_level === 'rep' &&
        String(user.company_id) === String(companyData.company_id);

    return (
        <div className='container mx-auto p-2 md:p-4'>
            {/* Page Header - styled like Jobs page */}
            <div className='text-center md:text-left pb-4 mb-8 border-b'>
                {' '}
                {/* Added mb-8 and border-b */}
                <h1 className='text-3xl font-bold'>
                    {companyData.name ? (
                        <>
                            Company Profile:{' '}
                            <span className='text-green-600'>{companyData.name}</span>
                        </>
                    ) : (
                        'Company Profile'
                    )}
                </h1>
                <p className='text-muted-foreground pt-1 pb-1'>
                    {companyData.champion
                        ? `Championed by ${companyData.champion}`
                        : 'Detailed information about this company.'}
                </p>
            </div>

            {/* Main Content Area for Company Details */}
            <div className='max-w-3xl mx-auto'>
                {' '}
                {/* Centered content area */}
                <Card className='overflow-hidden shadow-xl'>
                    <CardHeader className='bg-gray-50 p-6'>
                        {/* Company Name already in page header, could have a tagline or short desc here */}
                        <CardTitle className='text-2xl text-gray-800'>
                            {companyData.name || 'Company Details'}
                        </CardTitle>
                        {/* If company has a tagline or short description available in companyData: */}
                        {/* <CardDescription className="pt-1">{companyData.tagline || ""}</CardDescription> */}
                    </CardHeader>
                    <CardContent className='p-6 space-y-1'>
                        {' '}
                        {/* Reduced space-y for denser info items */}
                        <InfoItem label='Official Name' icon={<Building size={18} />}>
                            {companyData.name || 'N/A'}
                        </InfoItem>
                        <InfoItem label='Company ID' icon={<Building size={18} />}>
                            {companyData.company_id || 'N/A'}
                        </InfoItem>
                        <InfoItem label='Champion / Key Contact' icon={<UserCheck size={18} />}>
                            {companyData.champion || 'N/A'}
                        </InfoItem>
                        {/* Conditionally display other fields if they exist in companyData */}
                        {companyData.industry && (
                            <InfoItem label='Industry' icon={<Building size={18} />}>
                                {' '}
                                {/* Placeholder icon */}
                                {companyData.industry}
                            </InfoItem>
                        )}
                        {companyData.website_url && (
                            <InfoItem label='Website' icon={<Globe size={18} />}>
                                <a
                                    href={
                                        companyData.website_url.startsWith('http')
                                            ? companyData.website_url
                                            : `//${companyData.website_url}`
                                    }
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-green-600 hover:text-green-700 hover:underline font-medium'
                                >
                                    {companyData.website_url}
                                </a>
                            </InfoItem>
                        )}
                        {/* Add more InfoItems for other details from companyData as needed */}
                    </CardContent>
                </Card>
                {/* Rep-specific message/actions */}
                {isRepForThisCompany && (
                    <Card className='mt-6 bg-green-50 border-green-200 shadow-md'>
                        <CardHeader>
                            <div className='flex items-center'>
                                <CheckCircle2 className='h-6 w-6 text-green-600 mr-3' />
                                <CardTitle className='text-lg text-green-800'>
                                    Your Company Profile
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className='text-sm text-green-700'>
                                Welcome! You have administrative access to this company&#39;s
                                profile.
                            </p>
                            {/* Example: Link to edit company details if applicable */}
                            {/* <Button asChild variant="link" className="p-0 h-auto text-green-700 hover:text-green-800 mt-2">
                                <Link to={`/company/${effectiveCompanyId}/edit`}>Edit Company Details</Link>
                            </Button> */}
                        </CardContent>
                    </Card>
                )}
                {/* Potential section for jobs by this company, or other related actions */}
                {/* <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4">Jobs at {companyData.name}</h2>
                    // ... List jobs or link to filtered jobs page ...
                </div> */}
            </div>
        </div>
    );
};

export default Company;
