
// File: __tests__/JobDetailPage.test.js
// Description: Tests for the JobDetailPage component.

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import JobDetailPage from '../pages/JobDetailPage'; // Adjust path as needed
import { AuthContext } from '../context/authDefinition';// Adjust path as needed
import { jobsData as mockJobsDataArray } from '../jobsData'; // Assuming this is an array

// Mock useParams
const mockParams = { jobId: '1' }; // Default mock job ID
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockParams,
}));

// Mock jobsData if it is not directly importable or needs modification for tests.
// If jobsData.js exports an array jobsData, then the import above is fine.
// Ensure the structure matches what the component expects.
const mockJob = mockJobsDataArray.find(j => j.id === parseInt(mockParams.jobId));


const renderWithAuthContext = (component, providerProps, route = `/job/${mockParams.jobId}`) => {
  return render(
    <AuthContext.Provider value={providerProps}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/job/:jobId" element={component} />
          <Route path="/jobs" element={<div>Jobs Page</div>} /> {/* For back link */}
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('JobDetailPage Component', () => {
  // Test 1: Renders loading state initially
  test('renders loading state initially', () => {
    // Temporarily make useEffect simulate a longer load
    const mockSetTimeout = jest.spyOn(global, 'setTimeout');
    mockSetTimeout.mockImplementationOnce(cb => cb()); // Make setTimeout immediate for other tests
    renderWithAuthContext(<JobDetailPage />, { user: { role: 'student' } });
    expect(screen.getByText(/loading job details.../i)).toBeInTheDocument();
    mockSetTimeout.mockRestore(); // Restore setTimeout
  });

  // Test 2: Renders "Job Not Found" if job does not exist
  test('renders "Job Not Found" if job does not exist', async () => {
    mockParams.jobId = '999'; // A non-existent job ID
    renderWithAuthContext(<JobDetailPage />, { user: { role: 'student' } });
    await waitFor(() => {
      expect(screen.getByText(/job not found/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to jobs/i })).toBeInTheDocument();
    });
    mockParams.jobId = '1'; // Reset for other tests
  });

  // Test 3: Renders job details correctly for a student
  test('renders job details correctly for a student', async () => {
    const studentUser = { role: 'student' };
    renderWithAuthContext(<JobDetailPage />, { user: studentUser });

    await waitFor(() => {
      expect(screen.getByText(mockJob.title)).toBeInTheDocument();
      expect(screen.getByText(mockJob.company)).toBeInTheDocument();
      expect(screen.getByText(mockJob.description)).toBeInTheDocument();
      expect(screen.getByText(mockJob.salary)).toBeInTheDocument();
      mockJob.tags.forEach(tag => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /apply now/i })).toBeInTheDocument();
      expect(screen.queryByText(/employer panel/i)).not.toBeInTheDocument();
    });
  });

  // Test 4: Renders job details correctly for a company employee of the same company
  test('renders job details with employer panel for an employee of the same company', async () => {
    const companyEmployeeUser = { role: 'employee', companyId: mockJob.companyId };
    renderWithAuthContext(<JobDetailPage />, { user: companyEmployeeUser });

    await waitFor(() => {
      expect(screen.getByText(mockJob.title)).toBeInTheDocument();
      expect(screen.getByText(/employer panel/i)).toBeInTheDocument();
      expect(screen.getByText(/view applicants/i)).toBeInTheDocument();
      expect(screen.getByText(/edit job listing/i)).toBeInTheDocument();
      if (mockJob.employeeNotes) {
        expect(screen.getByText(new RegExp(mockJob.employeeNotes, 'i'))).toBeInTheDocument();
      } else {
        expect(screen.getByText(/no internal notes/i)).toBeInTheDocument();
      }
      expect(screen.queryByRole('button', { name: /apply now/i })).not.toBeInTheDocument();
    });
  });

  // Test 5: Renders job details correctly for a company employee of a different company
  test('renders job details with message for an employee of a different company', async () => {
    const otherCompanyEmployeeUser = { role: 'employee', companyId: 'otherCompany123' };
    renderWithAuthContext(<JobDetailPage />, { user: otherCompanyEmployeeUser });

    await waitFor(() => {
      expect(screen.getByText(mockJob.title)).toBeInTheDocument();
      expect(screen.getByText(/you are viewing this job as an employee from a different company/i)).toBeInTheDocument();
      expect(screen.queryByText(/employer panel/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /apply now/i })).not.toBeInTheDocument();
    });
  });

  // Test 6: "Back to All Jobs" link works
  test('"Back to All Jobs" link navigates to /jobs', async () => {
    renderWithAuthContext(<JobDetailPage />, { user: { role: 'student' } });
    await waitFor(() => expect(screen.getByText(mockJob.title)).toBeInTheDocument());

    const backLink = screen.getByRole('link', { name: /back to all jobs/i });
    expect(backLink).toHaveAttribute('href', '/jobs');
    // fireEvent.click(backLink); // This would navigate in a full Router setup.
    // For MemoryRouter, checking href is usually sufficient for this type of test.
  });

  // Test 7: Displays job type and location if available
  test('displays job type and location if available', async () => {
    // Assuming mockJob has 'type' and 'location'
    renderWithAuthContext(<JobDetailPage />, { user: { role: 'student' } });
    await waitFor(() => {
      if (mockJob.location) {
        expect(screen.getByText(new RegExp(mockJob.location, 'i'))).toBeInTheDocument();
      } else {
        expect(screen.getByText(/not specified/i)).toBeInTheDocument(); // For location
      }
      if (mockJob.type) {
        expect(screen.getByText(new RegExp(mockJob.type, 'i'))).toBeInTheDocument();
      } else {
         // If type is also not specified, "Not specified" might appear twice.
         // This depends on how your component handles multiple missing fields.
        expect(screen.getAllByText(/not specified/i).length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // Test 8: Displays different job data when jobId param changes (if component re-fetches or re-filters)
  test('displays different job data when jobId param changes', async () => {
    // Find another job in mockJobsData
    const secondJobId = '2';
    const secondJob = mockJobsDataArray.find(j => j.id === parseInt(secondJobId));
    expect(secondJob).toBeDefined(); // Ensure second job exists for test

    mockParams.jobId = secondJobId; // Change the mocked jobId for useParams

    renderWithAuthContext(<JobDetailPage />, { user: { role: 'student' } }, `/job/${secondJobId}`);

    await waitFor(() => {
      expect(screen.getByText(secondJob.title)).toBeInTheDocument();
      expect(screen.getByText(secondJob.company)).toBeInTheDocument();
      expect(screen.queryByText(mockJob.title)).not.toBeInTheDocument(); // Old job title should not be there
    });
    mockParams.jobId = '1'; // Reset for other tests
  });
});