
// File: __tests__/Company.test.js
// Description: Tests for the Company component.

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Company from '../pages/Company'; // Adjust path as needed
import { AuthContext } from '../context/authDefinition'; // Adjust path as needed

// Mock fetch
global.fetch = jest.fn();

// Mock useParams
let mockCompanyIdFromParams = null;
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ companyId: mockCompanyIdFromParams }),
}));

const mockCompanyData = {
    company_id: 'comp123',
    name: 'Test Company Inc.',
    champion: 'John Doe',
    industry: 'Technology',
    website_url: 'www.testcompany.com',
};

const renderWithAuthContext = (component, providerProps, route = '/company') => {
    return render(
        <AuthContext.Provider value={providerProps}>
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path="/company" element={component} />
                    <Route path="/company/:companyId" element={component} />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );
};

describe('Company Component', () => {
    beforeEach(() => {
        fetch.mockClear();
        mockCompanyIdFromParams = null; // Reset param
        // Default successful fetch
        fetch.mockResolvedValue({
            ok: true,
            json: async () => mockCompanyData,
        });
    });

    // Test 1: Renders loading state when auth is loading
    test('renders loading state when auth is loading', () => {
        renderWithAuthContext(<Company />, {
            user: null,
            token: 'fake-token',
            isLoading: true, // Auth loading
            error: null,
        });
        expect(screen.getByText(/Loading Company Information.../i)).toBeInTheDocument();
    });

    // Test 2: Renders error if no company ID is available (neither from params nor user)
    test('renders error if no company ID is available', async () => {
        renderWithAuthContext(<Company />, {
            user: { access_level: 'student' }, // User without company_id
            token: 'fake-token',
            isLoading: false,
            error: null,
        });
        await waitFor(() => {
            expect(screen.getByText(/No Company ID specified or derived for your user./i)).toBeInTheDocument();
        });
    });

    // Test 3: Renders error if no token is available
    test('renders error if no token is available', async () => {
        mockCompanyIdFromParams = 'comp123'; // Provide a company ID via params
        renderWithAuthContext(<Company />, {
            user: { access_level: 'student' },
            token: null, // No token
            isLoading: false,
            error: null,
        }, '/company/comp123');
        await waitFor(() => {
            expect(screen.getByText(/Authentication required to view company details./i)).toBeInTheDocument();
        });
    });

    // Test 4: Fetches and displays company data for a rep user (using user.company_id)
    test('fetches and displays company data for a rep user', async () => {
        const repUser = { access_level: 'rep', company_id: 'comp123', first_name: 'Rep' };
        renderWithAuthContext(<Company />, {
            user: repUser,
            token: 'fake-token',
            isLoading: false,
            error: null,
        });

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                `http://localhost:8080/api/v1/company-info?company_id=${repUser.company_id}`,
{ headers: { Authorization: 'Bearer fake-token' } }
);
expect(screen.getByText(/Test Company Inc./i)).toBeInTheDocument();
expect(screen.getByText(/Championed by John Doe/i)).toBeInTheDocument();
expect(screen.getByText(mockCompanyData.industry)).toBeInTheDocument();
expect(screen.getByText(mockCompanyData.website_url)).toHaveAttribute('href', `//${mockCompanyData.website_url}`);
// Rep specific message
expect(screen.getByText(/Your Company Profile/i)).toBeInTheDocument();
expect(screen.getByText(/Welcome! You have administrative access/i)).toBeInTheDocument();
});
});

// Test 5: Fetches and displays company data using companyId from URL params (e.g., for an admin)
test('fetches and displays company data using companyId from URL params', async () => {
    mockCompanyIdFromParams = 'compXYZ';
    const adminUser = { access_level: 'admin', first_name: 'Admin' };
    fetch.mockResolvedValueOnce({ // New mock data for this specific ID
        ok: true,
        json: async () => ({ ...mockCompanyData, company_id: 'compXYZ', name: 'Admin Viewed Company' }),
    });

    renderWithAuthContext(<Company />, {
        user: adminUser,
        token: 'fake-token',
        isLoading: false,
        error: null,
    }, `/company/${mockCompanyIdFromParams}`);

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
            `http://localhost:8080/api/v1/company-info?company_id=${mockCompanyIdFromParams}`,
            { headers: { Authorization: 'Bearer fake-token' } }
        );
        expect(screen.getByText(/Admin Viewed Company/i)).toBeInTheDocument();
        // Admin should not see the "Your Company Profile" message unless it is their own company
        expect(screen.queryByText(/Your Company Profile/i)).not.toBeInTheDocument();
    });
});


// Test 6: Handles API error when fetching company details (non-ok response with JSON error)
test('handles API error when fetching company details (non-ok JSON)', async () => {
    mockCompanyIdFromParams = 'compErr';
    fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Company not found via API' }),
    });
    renderWithAuthContext(<Company />, {
        user: { access_level: 'admin' },
        token: 'fake-token',
        isLoading: false,
        error: null,
    }, `/company/${mockCompanyIdFromParams}`);

    await waitFor(() => {
        expect(screen.getByText(/Failed to Load Company Data/i)).toBeInTheDocument();
        expect(screen.getByText(/Company not found via API/i)).toBeInTheDocument();
    });
});

// Test 7: Handles API error when fetching company details (non-ok response with text error)
test('handles API error when fetching company details (non-ok text)', async () => {
    mockCompanyIdFromParams = 'compErrText';
    fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error from API',
        json: () => Promise.reject(new Error("Not JSON")) // Ensure json() fails
    });
    renderWithAuthContext(<Company />, {
        user: { access_level: 'admin' },
        token: 'fake-token',
        isLoading: false,
        error: null,
    }, `/company/${mockCompanyIdFromParams}`);

    await waitFor(() => {
        expect(screen.getByText(/Failed to Load Company Data/i)).toBeInTheDocument();
        expect(screen.getByText(/Internal Server Error from API/i)).toBeInTheDocument();
    });
});

// Test 8: Handles network error when fetching company details
test('handles network error when fetching company details', async () => {
    mockCompanyIdFromParams = 'compNetErr';
    fetch.mockRejectedValueOnce(new Error('Network failure'));
    renderWithAuthContext(<Company />, {
        user: { access_level: 'admin' },
        token: 'fake-token',
        isLoading: false,
        error: null,
    }, `/company/${mockCompanyIdFromParams}`);

    await waitFor(() => {
        expect(screen.getByText(/Failed to Load Company Data/i)).toBeInTheDocument();
        expect(screen.getByText(/Network failure/i)).toBeInTheDocument();
    });
});

// Test 9: Displays "Company Not Found" if API returns data but it is effectively null/empty after processing
test('displays "Company Not Found" if API returns no data for a valid ID', async () => {
    mockCompanyIdFromParams = 'compValidButNoData';
    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null, // API returns null or empty object
    });
    renderWithAuthContext(<Company />, {
        user: { access_level: 'admin' },
        token: 'fake-token',
        isLoading: false,
        error: null,
    }, `/company/${mockCompanyIdFromParams}`);

    await waitFor(() => {
        expect(screen.getByText(/Company Not Found/i)).toBeInTheDocument();
        expect(screen.getByText(`No company data found for ID: ${mockCompanyIdFromParams}. It might not exist or you may not have permission.`)).toBeInTheDocument();
    });
});

// Test 10: Renders InfoItems correctly
test('renders InfoItems with labels and values', async () => {
    const repUser = { access_level: 'rep', company_id: 'comp123' };
    renderWithAuthContext(<Company />, {
        user: repUser,
        token: 'fake-token',
        isLoading: false,
        error: null,
    });

    await waitFor(() => {
        expect(screen.getByText('Official Name:')).toBeInTheDocument();
        expect(screen.getByText(mockCompanyData.name)).toBeInTheDocument();
        expect(screen.getByText('Company ID:')).toBeInTheDocument();
        expect(screen.getByText(mockCompanyData.company_id)).toBeInTheDocument();
        expect(screen.getByText('Champion / Key Contact:')).toBeInTheDocument();
        expect(screen.getByText(mockCompanyData.champion)).toBeInTheDocument();
        expect(screen.getByText('Industry:')).toBeInTheDocument();
        expect(screen.getByText(mockCompanyData.industry)).toBeInTheDocument();
        expect(screen.getByText('Website:')).toBeInTheDocument();
        expect(screen.getByText(mockCompanyData.website_url)).toBeInTheDocument();
    });
});

// Test 11: Website link is correct and opens in new tab
test('website link is correct and opens in new tab', async () => {
    const repUser = { access_level: 'rep', company_id: 'comp123' };
    renderWithAuthContext(<Company />, {
        user: repUser,
        token: 'fake-token',
        isLoading: false,
        error: null,
    });

    await waitFor(() => {
        const websiteLink = screen.getByText(mockCompanyData.website_url);
        expect(websiteLink).toHaveAttribute('href', `//${mockCompanyData.website_url}`);
        expect(websiteLink).toHaveAttribute('target', '_blank');
        expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
});

// Test 12: Handles company data with missing optional fields gracefully
test('handles company data with missing optional fields gracefully', async () => {
    mockCompanyIdFromParams = 'compMissingFields';
    const partialCompanyData = {
        company_id: 'compPartial',
        name: 'Partial Info Ltd.',
        // champion, industry, website_url are missing
    };
    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => partialCompanyData,
    });

    renderWithAuthContext(<Company />, {
        user: { access_level: 'admin' },
        token: 'fake-token',
        isLoading: false,
        error: null,
    }, `/company/${mockCompanyIdFromParams}`);

    await waitFor(() => {
        expect(screen.getByText(/Partial Info Ltd./i)).toBeInTheDocument();
        expect(screen.getByText('Champion / Key Contact:')).toBeInTheDocument();
        // Check that 'N/A' or similar is shown for missing fields, or the InfoItem is not rendered.
        // Based on InfoItem: <dd>{children || 'N/A'}</dd> - but children is just companyData.champion.
        // The component structure is: <InfoItem label="Champion / Key Contact">{companyData.champion || 'N/A'}</InfoItem>
        const championDd = screen.getByText('Champion / Key Contact:').closest('div').querySelector('dd');
        expect(championDd).toHaveTextContent('N/A');

        expect(screen.queryByText('Industry:')).not.toBeInTheDocument(); // Conditionally rendered
        expect(screen.queryByText('Website:')).not.toBeInTheDocument(); // Conditionally rendered
    });
});
});