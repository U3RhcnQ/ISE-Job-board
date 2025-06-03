import React, { useState, useEffect } from 'react';
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { useAuth } from '../hooks/useAuth.js';
import { NumericFormat } from 'react-number-format';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '../components/ui/alert-dialog.jsx';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Helper for display mode
const InfoItem = ({ label, children }) => (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-2 py-1.5 items-start'>
        <dt className='text-sm font-medium text-gray-500'>{label}:</dt>
        <dd className='text-sm text-gray-900 md:col-span-2'>{children}</dd>
    </div>
);

// Helper for form fields in edit mode
const FormField = ({ label, children, htmlFor }) => (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-2 py-2 items-center'>
        <label htmlFor={htmlFor} className='text-sm font-medium text-gray-700 md:text-left'>
            {label}:
        </label>
        <div className='md:col-span-2'>{children}</div>
    </div>
);

// Residency options for the Select dropdown
const residencySelectOptions = [
    { value: 'r1', label: 'R1' },
    { value: 'r2', label: 'R2' },
    { value: 'r1+r2', label: 'R1+R2' },
    { value: 'r3', label: 'R3' },
    { value: 'r4', label: 'R4' },
    { value: 'r5', label: 'R5' },
    { value: '__NONE__', label: 'N/A (Clear Selection)' }, // Special value for clearing
];

// Default structure for a new job form
const defaultInitialFormData = {
    company_id: null, // REQUIRED FOR CREATE - Ensure your form can set this
    company_name: '', // Useful for display/selection logic if paired with company_id
    job_title: '',
    website: '', // Not in create/update API spec, but keep for form consistency if used elsewhere
    salary: null,
    residency_title: '',
    residency: null,
    position_count: 1,
    description: '',
    small_description: '',
    approval: 'pending', // Form state, will be mapped for update, not sent for create
};

// Props for the modal:
// - jobId?: string (if undefined/null, it's "create" mode, otherwise "edit" mode)
// - user: object (current authenticated user from useAuth)
// - onOperationSuccess?: (data: any) => void (callback after successful create/update)
const JobDetailsModal = ({ jobId, onOperationSuccess }) => {
    // Determine mode based on jobId prop
    const isCreateMode = !jobId;
    const { user, token } = useAuth();

    // State for fetched job details (used in "edit" mode for viewing and resetting form)
    const [viewData, setViewData] = useState(null);
    // State for form data (for both "create" and "edit" modes)
    const [formData, setFormData] = useState(() =>
        isCreateMode ? { ...defaultInitialFormData } : null
    );
    // State for loading (primarily for fetching in "edit" mode)
    const [isLoading, setIsLoading] = useState(!isCreateMode);
    // State for errors (fetch or submit errors)
    const [error, setError] = useState(null);

    // State to control if the form is in an editable state
    // - true for "create" mode always
    // - toggled by user in "edit" mode
    const [isInEditState, setIsInEditState] = useState(isCreateMode);

    // State for submission process (e.g., Save/Create button clicked)
    const [isSubmitting, setIsSubmitting] = useState(false); // Renamed from isSaving

    // Derived permission to edit/create based on user role
    const canEditPermissions =
        user && (user.access_level === 'admin' || user.access_level === 'rep');

    // Effect to fetch job details if in "edit" mode
    useEffect(() => {
        if (isCreateMode) {
            let InitialFormData = { ...defaultInitialFormData };

            if (user.access_level === 'rep') {
                InitialFormData.company_id = user.company_id;
            }

            setFormData({ ...InitialFormData }); // Ensure form is reset for create
            setIsLoading(false);
            setIsInEditState(true); // Create mode always starts in edit state
            return;
        }

        // If not create mode, but no jobId or token, don't proceed (should be handled by parent ideally)
        if (!jobId || !token) {
            setIsLoading(false);
            setError(jobId ? 'Token not available for fetching.' : 'Job ID not provided for edit.');
            return;
        }

        setIsLoading(true);
        setError(null);
        const fetchJobDetails = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/job?job_id=${jobId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(
                        `Fetch error: ${response.status} - ${errorText || response.statusText}`
                    );
                }
                const data = await response.json();
                setViewData(data); // Store fetched data for viewing/resetting
                setFormData(data); // Initialize form with fetched data
                setIsInEditState(false); // Start in view mode for existing job
            } catch (err) {
                console.error('Fetch job details error:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobDetails();
    }, [jobId, token, isCreateMode, user.access_level, user.company_id]); // Rerun if these change

    // Generic input change handler
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Numeric input change handler for salary
    const handleNumericInputChange = (name, floatValue) => {
        setFormData((prev) => ({ ...prev, [name]: floatValue === undefined ? null : floatValue }));
    };

    // Integer input change handler for position_count
    const handleIntegerInputChange = (name, value) => {
        const intValue = parseInt(value, 10);
        setFormData((prev) => ({ ...prev, [name]: isNaN(intValue) ? null : intValue }));
    };

    // Select component change handler
    const handleSelectChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Toggle between view and edit form for an existing job
    const handleToggleEditState = () => {
        if (isCreateMode) return; // Not applicable in create mode

        if (!isInEditState) {
            // Entering edit form
            setFormData({ ...(viewData || defaultInitialFormData) }); // Sync form with latest view data
        }
        setIsInEditState(!isInEditState);
        setError(null); // Clear previous submit errors
    };

    // Handle cancel operation (either cancelling an edit or cancelling creation)
    const handleCancelOperation = () => {
        setError(null); // Clear errors
        if (isCreateMode) {
            // For create mode, "Cancel" usually means closing the modal.
            // We can reset the form, parent will handle closing via DialogClose or onOpenChange.
            setFormData({ ...defaultInitialFormData });
            // If onOperationSuccess is used to signal close, call it:
            // if (onOperationSuccess) onOperationSuccess(null, 'cancelCreate');
        } else {
            // Edit mode: cancel the edit, revert to view state
            setIsInEditState(false);
            setFormData({ ...(viewData || defaultInitialFormData) }); // Reset form to last saved/fetched state
        }
    };

    const handleDeleteOperation = async (job_id) => {
        console.log(`Attempting to delete job with ID: ${job_id}`);

        try {
            // --- Step 1: Call your API to delete the job ---
            // Replace this with your actual API call.
            // Example:
            const response = await fetch(`${API_BASE_URL}/remove-job?job_id=${job_id}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete the job from the server.');
            }
            console.log(`Job ${job_id} successfully deleted from server.`);

            if (onOperationSuccess) {
                onOperationSuccess();
            }

            console.log('Form data reset after successful deletion operation.');
        } catch (error) {
            console.error(`Error deleting job ${job_id}:`, error);
        }
    };

    const handleSaveChanges = async () => {
        console.log('DEBUG: handleSaveChanges CALLED. isCreateMode:', isCreateMode); // LOG A

        if (!formData) {
            console.error('DEBUG: formData is null or undefined. Aborting save.');
            setError('Form data is missing.');
            return;
        }

        console.log('DEBUG: Current formData:', JSON.stringify(formData, null, 2)); // LOG B

        if (
            isCreateMode &&
            (formData.company_id === null ||
                formData.company_id === undefined ||
                String(formData.company_id).trim() === '')
        ) {
            console.warn(
                'DEBUG: Company ID validation FAILED for create mode. company_id:',
                formData.company_id
            ); // LOG C
            setError('Company ID is required to create a job.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        let payload = {};
        const method = 'POST'; // Method is POST for both create and update as per user spec
        let endpoint = '';

        // Convert string approval to API integer format (for update only)
        const mapApprovalToApiInt = (approvalString) => {
            switch (approvalString?.toLowerCase()) {
                case 'approved':
                    return 1;
                case 'rejected':
                    return 0;
                case 'pending':
                    return 2;
                default:
                    return null; // API: blank/NULL - pending
            }
        };

        // Prepare salary as integer or null
        const salaryInt =
            formData.salary !== null &&
            formData.salary !== undefined &&
            !isNaN(parseFloat(String(formData.salary)))
                ? Math.round(parseFloat(String(formData.salary)))
                : null; // Or 0 if your API requires an int and cannot take null

        // Prepare position_count as integer or default
        const positionCountInt =
            formData.position_count !== null &&
            formData.position_count !== undefined &&
            !isNaN(parseInt(String(formData.position_count), 10))
                ? parseInt(String(formData.position_count), 10)
                : 0; // Default to 0 if not specified or invalid, adjust as needed

        if (isCreateMode) {
            endpoint = `${API_BASE_URL}/create-job`;
            payload = {
                id: parseInt(String(formData.company_id), 10), // Ensure it's an int
                description: formData.description || '', // Send empty string if null/undefined
                title: formData.job_title || '',
                salary: salaryInt,
                small_description: formData.small_description || '',
                residency: formData.residency === '__NONE__' ? null : formData.residency,
                residency_title: formData.residency_title || '',
                position_count: positionCountInt,
            };
        } else {
            // Update mode
            endpoint = `${API_BASE_URL}/update-job`;
            payload = {
                // Only include fields that are part of the update-job API spec
                job_id: jobId,
                position_count: positionCountInt,
                description: formData.description, // Send current value, API ignores if not changing or handles null
                title: formData.job_title,
                salary: salaryInt,
                small_description: formData.small_description,
                residency: formData.residency === '__NONE__' ? null : formData.residency,
                residency_title: formData.residency_title,
                approved: mapApprovalToApiInt(formData.approval),
            };
            // Note: As per "all properties can be left blank/null/not included...and it will stay as it currently is",
            // you might want to build the payload more dynamically for updates,
            // only including fields that have actually changed from `viewData`.
            // For simplicity here, we're sending all applicable fields from formData.
            // The backend needs to correctly interpret a passed `null` value vs. an omitted field.
        }

        try {
            console.log(`Attempting to ${method} data to ${endpoint}:`, payload);
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `API error: ${response.status}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage += ` - ${errorJson.message || errorJson.detail || errorText}`;
                } catch (e) {
                    console.error(e);
                    errorMessage += ` - ${errorText}`;
                }
                throw new Error(errorMessage);
            }
            const resultData = await response.json();
            console.log('Operation successful:', resultData);

            if (!isCreateMode) {
                setViewData(resultData);
                setFormData(resultData);
                setIsInEditState(false);
            }

            if (onOperationSuccess) {
                onOperationSuccess(resultData);
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };
    // ... (getApprovalBadgeVariant, approvalOptions, loading/error states, and JSX render remain largely the same)
    // Make sure your FormField for company_id (if creating) exists and works.
    // For example, in "Job Overview" section when creating:
    // <FormField label="Company ID" htmlFor="company_id"><Input type="number" name="company_id" id="company_id" value={formData?.company_id || ''} onChange={(e) => handleIntegerInputChange("company_id", e.target.value)} /></FormField>

    // Helper function for badge variants (approval status)
    const getApprovalBadgeVariant = (approvalStatus) => {
        switch (approvalStatus?.toLowerCase()) {
            case 'approved':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'rejected':
                return 'destructive';
            default:
                return 'outline';
        }
    };
    const approvalOptions = ['pending', 'approved', 'rejected']; // For select dropdown

    // --- Loading and Error States ---
    if (isLoading) {
        // Primarily for fetching in edit mode
        return (
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Loading...</DialogTitle>
                </DialogHeader>
                <div className='p-6 text-center'>Fetching job details...</div>
            </DialogContent>
        );
    }
    // If there was a fetch error in edit mode and no data was loaded
    if (error && !isCreateMode && !viewData && !isLoading) {
        return (
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className='text-red-600'>Error</DialogTitle>
                </DialogHeader>
                <div className='p-6 text-red-500'>{error}</div>
            </DialogContent>
        );
    }
    // If trying to edit but jobDetails (viewData) couldn't be set (e.g. invalid jobId, but fetch didn't error before)
    if (!isCreateMode && !viewData && !isLoading) {
        return (
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Not Found</DialogTitle>
                </DialogHeader>
                <div className='p-6'>Job details could not be found for editing.</div>
            </DialogContent>
        );
    }

    // Data source for viewing static info in "edit" mode (when not isInEditState)
    const displayDataForViewMode = viewData || defaultInitialFormData;

    return (
        <DialogContent className='w-[95vw] max-w-[95vw] md:w-[80vw] md:max-w-[80vw] lg:w-[70vw] lg:max-w-[70vw] h-[90vh] flex flex-col'>
            <DialogHeader className='m-6 mb-2'>
                <DialogTitle className='text-2xl flex items-center justify-between'>
                    <span>
                        {isCreateMode
                            ? 'Create New Job Listing'
                            : isInEditState && formData
                              ? `${formData.company_name || 'Edit Job'} - ${formData.job_title || ''}`
                              : `${displayDataForViewMode.company_name || 'Job Details'} - ${displayDataForViewMode.job_title || ''}`}
                    </span>
                    {/* Show badges only in edit mode (when viewing existing job details) and user is not student */}
                    {!isCreateMode &&
                        displayDataForViewMode.approval &&
                        user?.access_level !== 'student' && (
                            <div className='flex items-center space-x-1.5 ml-3'>
                                {displayDataForViewMode.residency && (
                                    <Badge
                                        variant='default'
                                        className='bg-green-100 text-green-800 border border-green-200 text-xs font-medium px-4 py-2 rounded-full'
                                    >
                                        {displayDataForViewMode.residency.toUpperCase()}
                                    </Badge>
                                )}
                                <Badge
                                    variant={getApprovalBadgeVariant(
                                        displayDataForViewMode.approval
                                    )}
                                    className={`ml-2 text-xs font-medium rounded-full px-4 py-2 ${
                                        displayDataForViewMode.approval?.toLowerCase() ===
                                        'approved'
                                            ? 'bg-green-100 text-green-700'
                                            : displayDataForViewMode.approval?.toLowerCase() ===
                                                'pending'
                                              ? 'bg-yellow-100 text-yellow-700'
                                              : displayDataForViewMode.approval?.toLowerCase() ===
                                                  'rejected'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {displayDataForViewMode.approval?.charAt(0).toUpperCase() +
                                        displayDataForViewMode.approval?.slice(1) || 'Unknown'}
                                </Badge>
                            </div>
                        )}
                </DialogTitle>
            </DialogHeader>

            <div className='flex-grow overflow-y-auto p-6 pt-0 space-y-6'>
                {/* Display submit error if any */}
                {error && isSubmitting && (
                    <div
                        className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4'
                        role='alert'
                    >
                        {error}
                    </div>
                )}

                {/* Form Sections: Render inputs if (isInEditState OR isCreateMode) AND user has permissions. Otherwise, render InfoItems. */}

                {/* Section 1: Job Overview */}
                <section>
                    <h3 className='text-xl font-semibold text-gray-800 mb-3 border-b pb-2'>
                        Job Overview
                    </h3>
                    <div className='space-y-1'>
                        {(isInEditState || isCreateMode) && canEditPermissions ? (
                            <>
                                {' '}
                                {/* EDIT/CREATE FORM FIELDS */}
                                {isCreateMode &&
                                    user?.access_level === 'rep' &&
                                    formData?.company_name && (
                                        // Display Rep's company name as info if available
                                        <InfoItem label='Company'>{formData.company_name}</InfoItem>
                                    )}
                                <FormField label='Company ID' htmlFor='company_id'>
                                    <Input
                                        type='number'
                                        name='company_id'
                                        id='company_id'
                                        value={
                                            user?.access_level === 'admin'
                                                ? formData?.company_id
                                                : user.company_id
                                        }
                                        onChange={(e) =>
                                            handleIntegerInputChange('company_id', e.target.value)
                                        }
                                        disabled={
                                            (isCreateMode && user?.access_level === 'rep') || // Rep creating: pre-filled, disabled
                                            !isCreateMode // Always disabled in edit mode for existing job
                                        }
                                        placeholder={
                                            user?.access_level === 'admin' && isCreateMode
                                                ? 'Enter Company ID'
                                                : user?.access_level === 'admin' && !isCreateMode
                                                  ? formData?.company_id
                                                  : user?.access_level === 'rep'
                                                    ? user.company_id
                                                    : '' // Fallback if all conditions are false
                                        }
                                    />
                                </FormField>
                                <FormField label='Website' htmlFor='website'>
                                    <Input
                                        name='website'
                                        id='website'
                                        value={formData?.website || ''}
                                        onChange={handleInputChange}
                                        placeholder='https://example.com'
                                        maxLength={40}
                                    />
                                </FormField>
                                <FormField label='Job Title' htmlFor='job_title'>
                                    <Input
                                        name='job_title'
                                        id='job_title'
                                        value={formData?.job_title || ''}
                                        onChange={handleInputChange}
                                        maxLength={40}
                                    />
                                </FormField>
                                <FormField label='Salary (€ per/month)' htmlFor='salary'>
                                    <NumericFormat
                                        name='salary'
                                        id='salary'
                                        value={formData?.salary || ''}
                                        customInput={Input}
                                        thousandSeparator=','
                                        decimalSeparator='.'
                                        allowNegative={false}
                                        decimalScale={2}
                                        fixedDecimalScale
                                        onValueChange={(values) =>
                                            handleNumericInputChange('salary', values.floatValue)
                                        }
                                    />
                                </FormField>
                                <FormField label='Residency / Type' htmlFor='residency_title'>
                                    <Input
                                        name='residency_title'
                                        id='residency_title'
                                        value={formData?.residency_title || ''}
                                        onChange={handleInputChange}
                                        maxLength={40}
                                    />
                                </FormField>
                                <FormField label='Residency Tag' htmlFor='residency'>
                                    <Select
                                        name='residency'
                                        value={formData?.residency || ''}
                                        onValueChange={(value) =>
                                            handleSelectChange(
                                                'residency',
                                                value === '__NONE__' ? null : value
                                            )
                                        }
                                    >
                                        <SelectTrigger id='residency'>
                                            <SelectValue placeholder='Select residency tag' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {residencySelectOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>
                                <FormField label='Positions Available' htmlFor='position_count'>
                                    <Input
                                        type='number'
                                        name='position_count'
                                        id='position_count'
                                        value={formData?.position_count || ''}
                                        onChange={(e) =>
                                            handleIntegerInputChange(
                                                'position_count',
                                                e.target.value
                                            )
                                        }
                                        min='0'
                                        max='100'
                                    />
                                </FormField>
                            </>
                        ) : (
                            // VIEW MODE (for existing job)
                            <>
                                <InfoItem label='Company'>
                                    {displayDataForViewMode.company_name}
                                </InfoItem>
                                {displayDataForViewMode.website && (
                                    <InfoItem label='Website'>
                                        <a
                                            href={
                                                displayDataForViewMode.website.startsWith('http')
                                                    ? displayDataForViewMode.website
                                                    : `//${displayDataForViewMode.website}`
                                            }
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='text-blue-600 hover:underline'
                                        >
                                            {displayDataForViewMode.website}
                                        </a>
                                    </InfoItem>
                                )}
                                <InfoItem label='Job Title'>
                                    {displayDataForViewMode.job_title}
                                </InfoItem>
                                <InfoItem label='Salary'>
                                    <NumericFormat
                                        value={displayDataForViewMode.salary}
                                        displayType='text'
                                        thousandSeparator=','
                                        decimalSeparator='.'
                                        prefix='€ '
                                        decimalScale={2}
                                        fixedDecimalScale
                                        min={0}
                                    />{' '}
                                    per/month
                                </InfoItem>
                                <InfoItem label='Residency / Type'>
                                    {displayDataForViewMode.residency_title || 'Not specified'}
                                </InfoItem>
                                <InfoItem label='Residency Tag'>
                                    {displayDataForViewMode.residency
                                        ? displayDataForViewMode.residency.toUpperCase()
                                        : 'N/A'}
                                </InfoItem>
                                <InfoItem label='Positions Available'>
                                    {displayDataForViewMode.position_count}
                                </InfoItem>
                            </>
                        )}
                    </div>
                </section>

                {/* Section 2: Description */}
                <section>
                    <h3 className='text-xl font-semibold text-gray-800 mb-3 border-b pb-2'>
                        Job Description
                    </h3>
                    {(isInEditState || isCreateMode) && canEditPermissions ? (
                        <>
                            <FormField label='Full Description' htmlFor='description'>
                                <Textarea
                                    name='description'
                                    id='description'
                                    value={formData?.description || ''}
                                    onChange={handleInputChange}
                                    rows={5}
                                />
                            </FormField>
                            <FormField
                                label='Short Description (for card)'
                                htmlFor='small_description'
                            >
                                <Textarea
                                    name='small_description'
                                    id='small_description'
                                    value={formData?.small_description || ''}
                                    onChange={handleInputChange}
                                    rows={3}
                                />
                            </FormField>
                        </>
                    ) : (
                        <p className='text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-md shadow-sm leading-relaxed'>
                            {displayDataForViewMode.description}
                        </p>
                    )}
                </section>

                {/* Section 3: Admin Only Status Section */}
                {user?.access_level === 'admin' && ( // Only admins can see/edit approval status section
                    <section>
                        <h3 className='text-xl font-semibold text-gray-800 mb-3 border-b pb-2'>
                            Admin Status
                        </h3>
                        <div className='space-y-1'>
                            {isInEditState || isCreateMode ? ( // In create mode, admin can set initial approval. In edit, admin can change.
                                <>
                                    <FormField label='Approval Status' htmlFor='approval'>
                                        <Select
                                            name='approval'
                                            value={formData?.approval || 'pending'}
                                            onValueChange={(value) =>
                                                handleSelectChange('approval', value)
                                            }
                                        >
                                            <SelectTrigger id='approval'>
                                                <SelectValue placeholder='Select status' />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {approvalOptions.map((opt) => (
                                                    <SelectItem key={opt} value={opt}>
                                                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormField>
                                </>
                            ) : (
                                // View mode for approval status
                                <InfoItem label='Approval Status'>
                                    <Badge
                                        variant={getApprovalBadgeVariant(
                                            displayDataForViewMode.approval
                                        )}
                                        className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                                            displayDataForViewMode?.approval?.toLowerCase() ===
                                            'approved'
                                                ? 'bg-green-100 text-green-700'
                                                : displayDataForViewMode?.approval?.toLowerCase() ===
                                                    'pending'
                                                  ? 'bg-yellow-100 text-yellow-700'
                                                  : displayDataForViewMode?.approval?.toLowerCase() ===
                                                      'rejected'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {displayDataForViewMode.approval?.charAt(0).toUpperCase() +
                                            displayDataForViewMode.approval?.slice(1) || 'Unknown'}
                                    </Badge>
                                </InfoItem>
                            )}
                        </div>
                    </section>
                )}
            </div>

            <DialogFooter className='mt-auto pt-4 pb-4 pr-6 border-t flex justify-end space-x-2'>
                {isCreateMode &&
                    canEditPermissions && ( // Buttons for CREATE mode
                        <>
                            <DialogClose asChild>
                                <Button
                                    type='button'
                                    variant='outline'
                                    onClick={handleCancelOperation}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type='button'
                                onClick={handleSaveChanges}
                                className={'bg-green-600 hover:bg-green-700'}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Create Job'}
                            </Button>
                        </>
                    )}
                {!isCreateMode &&
                    canEditPermissions && // Buttons for EDIT mode
                    (isInEditState ? ( // Form is active for editing
                        <>
                            <Button
                                type='button'
                                variant='outline'
                                onClick={handleCancelOperation}
                                disabled={isSubmitting}
                            >
                                Cancel Edit
                            </Button>
                            <Button
                                type='button'
                                onClick={handleSaveChanges}
                                className={'bg-green-600 hover:bg-green-700'}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                    ) : (
                        // Viewing existing job details
                        <>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant='destructive'>Delete Job</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Are you absolutely sure?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently
                                            delete this Job posting.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDeleteOperation(jobId)}
                                            className='bg-destructive hover:bg-destructive/90'
                                        >
                                            Yes, Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Button
                                type='button'
                                variant='default'
                                className={'bg-green-600 hover:bg-green-700'}
                                onClick={handleToggleEditState}
                            >
                                Edit
                            </Button>
                        </>
                    ))}
                {/* Always show a generic Close button if not in an active editing/creating state by a permitted user,
                    or if user doesn't have edit permissions (student viewing).
                    The DialogClose around specific cancel buttons handles those cases.
                 */}
                {!((isCreateMode || isInEditState) && canEditPermissions) && !isCreateMode && (
                    <DialogClose asChild>
                        <Button type='button' variant='outline'>
                            Close
                        </Button>
                    </DialogClose>
                )}
            </DialogFooter>
        </DialogContent>
    );
};

export default JobDetailsModal;
