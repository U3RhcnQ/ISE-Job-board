
// File: __tests__/AdminDashboard.test.js
// Description: Tests for the AdminDashboard component.

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from '../pages/AdminDashboard'; // Adjust path as needed
import { AuthContext } from '../context/authDefinition'; // Adjust path as needed
import { toast } from 'sonner'; // Mock sonner

// Mock fetch
global.fetch = jest.fn();

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock UI components that might interfere or are complex
jest.mock('../components/ui/scroll-area', () => ({
  ScrollArea: ({ children }) => <div data-testid="scroll-area">{children}</div>,
}));
jest.mock('../components/loadingSpinner', () => ({ text }) => <div data-testid="loading-spinner">{text}</div>);


const mockAdminUser = {
  user_id: 'admin001',
  first_name: 'Super',
  access_level: 'admin',
};

const mockStudentsData = [
  { userId: 's1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', year: 1, studentNumber: '123', classRank: 5, isRanked: true },
  { userId: 's2', firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', year: 2, studentNumber: '456', classRank: 2, isRanked: false },
];
const mockRepsData = [
  { userId: 'r1', firstName: 'Charlie', lastName: 'Brown', email: 'charlie@rep.com', repId: 'rep001', companyId: 'c1', companyName: 'Rep Inc.' },
];
const mockAdminsData = [
  { userId: 'a1', firstName: 'Diana', lastName: 'Prince', email: 'diana@admin.com' },
];
const mockCompaniesData = [
    { company_id: 'c1', name: 'Alpha Corp', website: 'alpha.com', champion: 'Eve', address_id: 'addr1' },
    { company_id: 'c2', name: 'Beta LLC', website: 'beta.com', champion: 'Frank', address_id: 'addr2' },
];


const renderWithAuthContext = (component, providerProps) => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={providerProps}>
        {component}
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
    toast.info.mockClear();

    // Default fetch mock for users (students initially)
    fetch.mockImplementation(async (url) => {
      if (url.includes('/get-users?userType=students')) {
        return { ok: true, json: async () => mockStudentsData };
      }
      if (url.includes('/get-users?userType=reps')) {
        return { ok: true, json: async () => mockRepsData };
      }
      if (url.includes('/get-users?userType=admins')) {
        return { ok: true, json: async () => mockAdminsData };
      }
      if (url.includes('/companies')) {
        return { ok: true, json: async () => mockCompaniesData };
      }
      if (url.includes('/delete-user')) {
        return { ok: true, json: async () => ({ message: 'User deleted successfully' }) };
      }
      if (url.includes('/delete-company')) {
        return { ok: true, json: async () => ({ message: 'Company deleted successfully' }) };
      }
      if (url.includes('/update-company')) { // For both Add (PUT with new ID) and Edit
        return { ok: true, json: async () => ({ message: 'Company processed successfully' }) };
      }
      if (url.includes('/allocate')) {
        return { ok: true, json: async () => ({ message: 'Allocation process initiated' }) };
      }
      return { ok: false, status: 404, json: async () => ({ message: 'Not Found' }), text: async () => 'Not Found' };
    });
  });

  // Test 1: Renders dashboard and fetches students by default
  test('renders dashboard and fetches students by default', async () => {
    renderWithAuthContext(<AdminDashboard />, { user: mockAdminUser, token: 'fake-token' });

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Company Management')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/get-users?userType=students',
        expect.objectContaining({ headers: { Authorization: 'Bearer fake-token' } })
      );
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Smith')).toBeInTheDocument();
    });
     await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/companies',
        expect.objectContaining({ headers: { Authorization: 'Bearer fake-token' } })
      );
      expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
    });
  });

  // Test 2: Switches tabs and fetches corresponding users
  test('switches tabs and fetches corresponding users (Reps)', async () => {
    renderWithAuthContext(<AdminDashboard />, { user: mockAdminUser, token: 'fake-token' });
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument()); // Wait for students to load

    fireEvent.click(screen.getByRole('tab', { name: /Company Reps/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/get-users?userType=reps',
        expect.objectContaining({ headers: { Authorization: 'Bearer fake-token' } })
      );
      expect(screen.getByText('Charlie')).toBeInTheDocument();
      expect(screen.getByText('Brown')).toBeInTheDocument();
      expect(screen.queryByText('Alice')).not.toBeInTheDocument(); // Students should be gone
    });
  });

  test('switches tabs and fetches corresponding users (Admins)', async () => {
    renderWithAuthContext(<AdminDashboard />, { user: mockAdminUser, token: 'fake-token' });
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('tab', { name: /Administrators/i }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/get-users?userType=admins',
        expect.objectContaining({ headers: { Authorization: 'Bearer fake-token' } })
      );
      expect(screen.getByText('Diana')).toBeInTheDocument();
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });
  });


  // Test 3: Filters users in the current tab
  test('filters users in the current (students) tab', async () => {
    renderWithAuthContext(<AdminDashboard />, { user: mockAdminUser, token: 'fake-token' });
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/Search in Students.../i);
    fireEvent.change(searchInput, { target: { value: 'Bob' } });

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: '' } }); // Clear search
     await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  // Test 4: Opens delete user dialog and deletes a user
  test('opens delete user dialog and deletes a user', async () => {
    renderWithAuthContext(<AdminDashboard />, { user: mockAdminUser, token: 'fake-token' });
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument()); // Wait for users

    // Find delete button for Alice (assuming it is the first one)
    // const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    // More specific selector if possible, e.g., within Alice's row
    const aliceRow = screen.getByText('Alice').closest('tr');
    const deleteAliceButton = Array.from(aliceRow.querySelectorAll('button')).find(btn => btn.textContent === 'Delete');

    fireEvent.click(deleteAliceButton);

    await waitFor(() => {
      expect(screen.getByText(/are you absolutely sure?/i)).toBeInTheDocument();
      expect(screen.getByText(/This will permanently delete the user Alice Smith/i)).toBeInTheDocument();
    });

    const confirmDeleteButton = screen.getByRole('button', { name: /yes, delete user/i });
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:8080/api/v1/delete-user?userId=${mockStudentsData[0].userId}`,
    expect.objectContaining({ method: 'DELETE' })
);
expect(toast.success).toHaveBeenCalledWith('User deleted successfully!');
expect(screen.queryByText('Alice')).not.toBeInTheDocument(); // Alice should be removed from UI
});
});

// Test 5: Calls edit user function (placeholder toast)
test('calls edit user function and shows info toast', async () => {
    renderWithAuthContext(<AdminDashboard />, { user: mockAdminUser, token: 'fake-token' });
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

    const aliceRow = screen.getByText('Alice').closest('tr');
    const editAliceButton = Array.from(aliceRow.querySelectorAll('button')).find(btn => btn.textContent === 'Edit');
    fireEvent.click(editAliceButton);

    await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith(expect.stringContaining(`Editing user: Alice Smith (ID: ${mockStudentsData[0].userId})`));
    });
});

// Test 6: Runs ranking allocation process
test('runs ranking allocation process', async () => {
    renderWithAuthContext(<AdminDashboard />, { user: mockAdminUser, token: 'fake-token' });
    await waitFor(() => expect(screen.getByText('Run Ranking Allocation')).toBeInTheDocument());

    // Default is R1, can also test changing it
    const runButton = screen.getByRole('button', { name: /Run for r1/i });
    fireEvent.click(runButton);

    expect(screen.getByRole('button', { name: /Allocating.../i})).toBeDisabled();
    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost:8080/api/v1/allocate?residency=r1',
            expect.objectContaining({ method: 'POST' })
        );
        expect(toast.success).toHaveBeenCalledWith('Allocation process initiated successfully!'); // Or the exact message from API
    });
    expect(screen.getByRole('button', { name: /Run for r1/i })).not.toBeDisabled();
});

// Test 7: Filters companies
test('filters companies', async () => {
    renderWithAuthContext(<AdminDashboard />, { user: mockAdminUser, token: 'fake-token' });
    await waitFor(() => expect(screen.getByText('Alpha Corp')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/Search companies by name, champion, or ID.../i);
    fireEvent.change(searchInput, { target: { value: 'Beta' } });

    await waitFor(() => {
        expect(screen.getByText('Beta LLC')).toBeInTheDocument();
        expect(screen.queryByText('Alpha Corp')).not.toBeInTheDocument();
    });
});

// Test 8: Opens Add New Company dialog, fills form, and saves
test('opens Add New Company dialog, fills form, and saves', async () => {
    renderWithAuthContext(<AdminDashboard />, { user: mockAdminUser, token: 'fake-token' });
    await waitFor(() => expect(screen.getByText('Alpha Corp')).toBeInTheDocument()); // Wait for companies

    fireEvent.click(screen.getByRole('button', { name: /Add New Company/i }));

    await waitFor(() => {
        expect(screen.getByText('Add New Company')).toBeInTheDocument(); // Dialog title
    });

    fireEvent.change(screen.getByRole('textbox', {name: /name/i}), { target: { value: 'Gamma Inc' } });
    fireEvent.change(screen.getByRole('textbox', {name: /website/i}), { target: { value: 'gamma.com' } });
    fireEvent.change(screen.getByRole('textbox', {name: /champion/i}), { target: { value: 'Carol' } });

    const saveButton = screen.getByRole('button', { name: /Add Company/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
        // The API call for add might be a POST or PUT to a general /companies endpoint
        // or a specific /add-company. The current code uses PUT to /update-company?companyId=null
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('http://localhost:8080/api/v1/update-company'), // companyId will be null
            expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify({ company_id: null, name: 'Gamma Inc', website: 'gamma.com', champion: 'Carol' }),
            })
        );
        expect(toast.success).toHaveBeenCalledWith('Company added successfully!'); // Or the exact message
        // Also check if companies list is re-fetched
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost:8080/api/v1/companies',
            expect.objectContaining({ headers: { Authorization: 'Bearer fake-token' } })
        );
    });
    // Optionally check if the new company appears in the list if the mock re-fetch returns it
});

// Test 9: Opens Edit Company dialog, fills form, and saves
test('opens Edit Company dialog, fills form, and saves', async () => {
    renderWithAuthContext(<AdminDashboard />, { user: mockAdminUser, token: 'fake-token' });
    await waitFor(() => expect(screen.getByText('Alpha Corp')).toBeInTheDocument());

    const alphaRow = screen.getByText('Alpha Corp').closest('tr');
    const editAlphaButton = Array.from(alphaRow.querySelectorAll('button')).find(btn => btn.textContent === 'Edit');
    fireEvent.click(editAlphaButton);


    await waitFor(() => {
        expect(screen.getByText('Edit Company')).toBeInTheDocument(); // Dialog title
        expect(screen.getByRole('textbox', {name: /name/i})).toHaveValue('Alpha Corp');
    });

    fireEvent.change(screen.getByRole('textbox', {name: /name/i}), { target: { value: 'Alpha Corp Updated' } });

    const saveButton = screen.getByRole('button', { name: /Save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
            `http://localhost:8080/api/v1/update-company?companyId=${mockCompaniesData[0].company_id}`,
            expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify({ ...mockCompaniesData[0], name: 'Alpha Corp Updated' }),
            })
        );
        expect(toast.success).toHaveBeenCalledWith('Company updated successfully!');
    });
});

// Test 10: Opens delete company dialog and deletes a company
test('opens delete company dialog and deletes a company', async () => {
    renderWithAuthContext(<AdminDashboard />, { user: mockAdminUser, token: 'fake-token' });
    await waitFor(() => expect(screen.getByText('Alpha Corp')).toBeInTheDocument());

    const alphaRow = screen.getByText('Alpha Corp').closest('tr');
    const deleteAlphaButton = Array.from(alphaRow.querySelectorAll('button')).find(btn => btn.textContent === 'Delete');
    fireEvent.click(deleteAlphaButton);

    await waitFor(() => {
        expect(screen.getByText(/are you absolutely sure?/i)).toBeInTheDocument();
        expect(screen.getByText(/This will permanently delete the company Alpha Corp/i)).toBeInTheDocument();
    });

    const confirmDeleteButton = screen.getByRole('button', { name: /yes, delete company/i });
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
            `http://localhost:8080/api/v1/delete-company?companyId=${mockCompaniesData[0].company_id}`,
            expect.objectContaining({ method: 'DELETE' })
        );
        expect(toast.success).toHaveBeenCalledWith('Company deleted successfully!');
        expect(screen.queryByText('Alpha Corp')).not.toBeInTheDocument();
    });
});

// Test 11: Handles error when fetching users
test('handles error when fetching users', async () => {
    fetch.mockImplementationOnce(async (url) => { // Only for the first call (students)
        if (url.includes('/get-users?userType=students')) {
            return { ok: false, status: 500, text: async () => 'Server Error Students' };
        }
        return { ok: true, json: async () => mockCompaniesData }; // companies fetch is still ok
    });

    renderWithAuthContext(<AdminDashboard />, { user: mockAdminUser, token: 'fake-token' });

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Error fetching Students: Failed to fetch Students: 500 Server Error Students'));
        // Check that "No students found" message is shown
        expect(screen.getByText(/no students found matching your criteria/i)).toBeInTheDocument();
    });
});

// Test 12: Handles error when fetching companies
test('handles error when fetching companies', async () => {
    fetch.mockImplementation(async (url) => {
        if (url.includes('/get-users?userType=students')) {
            return { ok: true, json: async () => mockStudentsData };
        }
        if (url.includes('/companies')) {
            return { ok: false, status: 500, text: async () => 'Server Error Companies' };
        }
        return { ok: false, status: 404, json: async () => ({ message: 'Not Found' }), text: async () => 'Not Found' };
    });
    renderWithAuthContext(<AdminDashboard />, { user: mockAdminUser, token: 'fake-token' });

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Error fetching companies: Failed to fetch companies: 500 Server Error Companies'));
        expect(screen.getByText(/no companies found matching your criteria/i)).toBeInTheDocument();
    });
});

});