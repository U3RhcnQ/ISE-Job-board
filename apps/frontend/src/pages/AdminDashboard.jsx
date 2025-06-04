import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table';
import { ScrollArea } from '../components/ui/scroll-area';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../components/ui/alert-dialog'; // AlertDialogTrigger removed as we open dialog programmatically
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'; // Added Tabs
import { toast } from 'sonner';
import LoadingSpinner from '../components/loadingSpinner.jsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog.jsx';
import { Label } from '../components/ui/label.jsx';


const API_BASE_URL = 'http://localhost:8080/api/v1';

const USER_TYPES = {
    STUDENTS: 'students',
    REPS: 'reps',
    ADMINS: 'admins',
};

const USER_TYPE_LABELS = {
    [USER_TYPES.STUDENTS]: 'Students',
    [USER_TYPES.REPS]: 'Company Reps',
    [USER_TYPES.ADMINS]: 'Administrators',
};

// Define columns for each user type
const studentColumns = [
    { header: 'First Name', accessor: 'firstName', default: 'N/A' },
    { header: 'Last Name', accessor: 'lastName', default: 'N/A' },
    { header: 'Email', accessor: 'email' },
    { header: 'Year', accessor: 'year' },
    { header: 'Student #', accessor: 'studentNumber' },
    { header: 'Class Rank', accessor: 'classRank' },
    { header: 'User ID', accessor: 'userId' },
];

const repColumns = [
    { header: 'First Name', accessor: 'firstName', default: 'N/A' },
    { header: 'Last Name', accessor: 'lastName', default: 'N/A' },
    { header: 'Email', accessor: 'email' },
    { header: 'Rep ID', accessor: 'repId' },
    { header: 'Company ID', accessor: 'companyId' },
    { header: 'Company Name', accessor: 'companyName' },
    { header: 'User ID', accessor: 'userId' },
];

const adminColumns = [
    { header: 'First Name', accessor: 'firstName', default: 'N/A' },
    { header: 'Last Name', accessor: 'lastName', default: 'N/A' },
    { header: 'Email', accessor: 'email' },
    { header: 'User ID', accessor: 'userId' },
];

const companyColumns = [
    { header: 'Company ID', accessor: 'company_id' },
    { header: 'Name', accessor: 'name' },
    { header: 'Address ID', accessor: 'address_id' },
    { header: 'Champion', accessor: 'champion' },
    // Assuming 'website' is part of the Company model for update/create, though not in the GET response sample
    // { header: 'Website', accessor: 'website' },
];

const RESIDENCY_LEVELS = ['R1', 'R2', 'R3', 'R4', 'R5']; // Kept from original, if still needed

export const AdminDashboard = () => {
    const { token } = useAuth(); // adminUser removed as it's not used in this modified scope
    const [activeTab, setActiveTab] = useState(USER_TYPES.STUDENTS);
    const [userData, setUserData] = useState({
        [USER_TYPES.STUDENTS]: [],
        [USER_TYPES.REPS]: [],
        [USER_TYPES.ADMINS]: [],
    });
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');

    // Dialog states
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    // const [userToEdit, setUserToEdit] = useState(null); // Kept for potential edit functionality

    // States for Ranking Process (kept from original)
    const [selectedResidency, setSelectedResidency] = useState(RESIDENCY_LEVELS[0]);
    const [isAllocating, setIsAllocating] = useState(false);

    const [companies, setCompanies] = useState([]);
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
    const [CompanySearchTerm, setCompanySearchTerm] = useState('');

    // Dialog states for delete, add, and update
    const [companyToDelete, setCompanyToDelete] = useState(null);
    const [isCompanyDeleteDialogOpen, setIsCompanyDeleteDialogOpen] = useState(false);

    const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false); // For both Add and Edit
    const [currentCompany, setCurrentCompany] = useState({
        company_id: null,
        name: '',
        website: '', // Assuming website is a field for add/update
        champion: '',
    });
    const [isEditMode, setIsEditMode] = useState(false);

    // Fetch users based on active tab
    useEffect(() => {
        const fetchUsersByType = async () => {
            if (!token || !activeTab) return;
            setIsLoadingUsers(true);
            // Clear previous data for the tab to avoid showing stale data during load
            setUserData(prevData => ({ ...prevData, [activeTab]: [] }));
            try {
                const response = await fetch(`${API_BASE_URL}/get-users?userType=${activeTab}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Failed to fetch ${USER_TYPE_LABELS[activeTab]}: ${response.status} ${errorBody}`);
                }
                const data = await response.json();
                setUserData(prevData => ({ ...prevData, [activeTab]: Array.isArray(data) ? data : [] }));
            } catch (error) {
                console.error(`Fetch ${activeTab} error:`, error);
                toast.error(`Error fetching ${USER_TYPE_LABELS[activeTab]}: ${error.message}`);
                setUserData(prevData => ({ ...prevData, [activeTab]: [] }));
            } finally {
                setIsLoadingUsers(false);
            }
        };
        fetchUsersByType();
    }, [token, activeTab]);

    const currentFilteredUsers = useMemo(() => {
        const usersToFilter = userData[activeTab] || [];
        if (!userSearchTerm) {
            return usersToFilter;
        }
        return usersToFilter.filter(user => {
            const userSearchTermLower = userSearchTerm.toLowerCase();
            const name = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
            const email = user.email?.toLowerCase() || '';

            let matchesSearch = name.includes(userSearchTermLower) || email.includes(userSearchTermLower);

            if (activeTab === USER_TYPES.STUDENTS) {
                matchesSearch = matchesSearch ||
                    user.studentNumber?.toString().includes(userSearchTermLower) ||
                    user.year?.toString().includes(userSearchTermLower);
            } else if (activeTab === USER_TYPES.REPS) {
                matchesSearch = matchesSearch ||
                    user.companyName?.toLowerCase().includes(userSearchTermLower);
            }
            return matchesSearch;
        });
    }, [userData, activeTab, userSearchTerm]);

    const handleDeleteUser = async (userIdToDelete) => {
        if (!token) {
            toast.error("Authentication token not found.");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/delete-user?userId=${userIdToDelete}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to delete user' }));
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }

            setUserData(prevData => ({
                ...prevData,
                [activeTab]: prevData[activeTab].filter(u => u.userId !== userIdToDelete),
            }));
            toast.success('User deleted successfully!');
        } catch (error) {
            console.error('Delete user error:', error);
            toast.error(`Error deleting user: ${error.message}`);
        } finally {
            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };

    const openDeleteDialog = (user) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };

    // Placeholder for edit functionality (kept from original)
    const handleEditUser = (user) => {
        // setUserToEdit(user);
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email;
        toast.info(`Editing user: ${userName} (ID: ${user.userId}). Implement edit modal/form.`);
        console.log("Edit user:", user);
    };

    // Ranking process (kept from original)
    const handleRunRankingProcess = async () => {
        if (!token) {
            toast.error("Authentication token not found.");
            return;
        }
        setIsAllocating(true);
        toast.info(`Starting allocation for ${selectedResidency}...`);
        try {
            // Ensure this endpoint is correct as per your API
            const response = await fetch(`${API_BASE_URL}/allocate?residency=${selectedResidency}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Allocation failed' }));
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            const result = await response.json();
            toast.success(result.message || `Allocation process for ${selectedResidency} initiated successfully!`);
            console.log("Allocation result:", result);
        } catch (error) {
            console.error('Ranking process error:', error);
            toast.error(`Error running ranking process: ${error.message}`);
        } finally {
            setIsAllocating(false);
        }
    };


    // Fetch companies
    useEffect(() => {
        const fetchCompanies = async () => {
            if (!token) return;
            setIsLoadingCompanies(true);
            try {
                const response = await fetch(`${API_BASE_URL}/companies`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Failed to fetch companies: ${response.status} ${errorBody}`);
                }
                const data = await response.json();
                setCompanies(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Fetch companies error:', error);
                toast.error(`Error fetching companies: ${error.message}`);
                setCompanies([]);
            } finally {
                setIsLoadingCompanies(false);
            }
        };
        fetchCompanies();
    }, [token]);

    const currentFilteredCompanies = useMemo(() => {
        if (!CompanySearchTerm) {
            return companies;
        }
        const CompanySearchTermLower = CompanySearchTerm.toLowerCase();
        return companies.filter(company => {
            return (
                company.name?.toLowerCase().includes(CompanySearchTermLower) ||
                company.champion?.toLowerCase().includes(CompanySearchTermLower) ||
                company.company_id?.toString().includes(CompanySearchTermLower)
            );
        });
    }, [companies, CompanySearchTerm]);

    // Handlers for Add/Edit Dialog
    const handleAddCompanyClick = () => {
        setIsEditMode(false);
        setCurrentCompany({ company_id: null, name: '', website: '', champion: '' });
        setIsAddEditDialogOpen(true);
    };

    const handleEditCompanyClick = (company) => {
        setIsEditMode(true);
        setCurrentCompany({
            company_id: company.company_id,
            name: company.name,
            website: company.website || '', // Populate website if exists, otherwise empty
            champion: company.champion,
        });
        setIsAddEditDialogOpen(true);
    };

    const handleFormChange = (e) => {
        const { id, value } = e.target;
        setCurrentCompany(prev => ({ ...prev, [id]: value }));
    };

    const handleSaveCompany = async () => {
        if (!token) {
            toast.error("Authentication token not found.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/update-company?companyId=${currentCompany.company_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(currentCompany),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to process company' }));
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }

            const result = await response.json();
            toast.success(result.message || `Company ${isEditMode ? 'updated' : 'added'} successfully!`);

            // Re-fetch companies to update the table
            const fetchResponse = await fetch(`${API_BASE_URL}/companies`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (fetchResponse.ok) {
                const updatedCompanies = await fetchResponse.json();
                setCompanies(Array.isArray(updatedCompanies) ? updatedCompanies : []);
            }


        } catch (error) {
            console.error(`${isEditMode ? 'Update' : 'Add'} company error:`, error);
            toast.error(`Error ${isEditMode ? 'updating' : 'adding'} company: ${error.message}`);
        } finally {
            setIsAddEditDialogOpen(false);
        }
    };


    // Handlers for Delete Dialog
    const openCompanyDeleteDialog = (company) => {
        setCompanyToDelete(company);
        setIsCompanyDeleteDialogOpen(true);
    };

    const handleDeleteCompany = async (companyIdToDelete) => {
        if (!token) {
            toast.error("Authentication token not found.");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/delete-company?companyId=${companyIdToDelete}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to delete company' }));
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }

            setCompanies(prevData => prevData.filter(c => c.company_id !== companyIdToDelete));
            toast.success('Company deleted successfully!');
        } catch (error) {
            console.error('Delete company error:', error);
            toast.error(`Error deleting company: ${error.message}`);
        } finally {
            setIsCompanyDeleteDialogOpen(false);
            setCompanyToDelete(null);
        }
    };


    let columns = [];
    if (activeTab === USER_TYPES.STUDENTS) columns = studentColumns;
    else if (activeTab === USER_TYPES.REPS) columns = repColumns;
    else if (activeTab === USER_TYPES.ADMINS) columns = adminColumns;

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            {/* Section for Ranking Process (Kept from original) */}
            <div className="mb-8 p-6 bg-card border rounded-lg shadow">
                <h2 className="text-2xl font-semibold mb-4">Run Ranking Allocation</h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div className="w-full sm:w-auto">
                        <label htmlFor="residencyLevel" className="block text-sm font-medium text-muted-foreground mb-1">
                            Select Residency Level
                        </label>
                        <Select value={selectedResidency} onValueChange={setSelectedResidency}>
                            <SelectTrigger id="residencyLevel" className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Select Residency" />
                            </SelectTrigger>
                            <SelectContent>
                                {RESIDENCY_LEVELS.map(level => (
                                    <SelectItem key={level} value={level}>
                                        {level}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={handleRunRankingProcess}
                        disabled={isAllocating}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                    >
                        {isAllocating ? 'Allocating...' : `Run for ${selectedResidency}`}
                    </Button>
                </div>
                {isAllocating && <p className="text-sm text-muted-foreground mt-2">Allocation process is running...</p>}
            </div>
            <hr className="my-8" />

            {/* Section for User Management */}
            <div className="p-6 bg-card border rounded-lg shadow">
                <h2 className="text-2xl font-semibold mb-4">User Management</h2>

                <Tabs value={activeTab} onValueChange={(newTab) => { setUserSearchTerm(''); setActiveTab(newTab);}} className="w-full mb-6">
                    <TabsList className="grid w-full grid-cols-3">
                        {Object.values(USER_TYPES).map(type => (
                            <TabsTrigger key={type} value={type}>
                                {USER_TYPE_LABELS[type]}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Input
                        type="text"
                        placeholder={`Search in ${USER_TYPE_LABELS[activeTab]}...`}
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="flex-grow"
                    />
                    {/* Role filter removed, tabs handle user types. Add back if specific sub-filtering is needed */}
                </div>

                {isLoadingUsers ? (
                    <LoadingSpinner text={`Loading ${USER_TYPE_LABELS[activeTab]}...`} />
                ) : (
                    <ScrollArea className="h-[500px] w-full border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {columns.map(col => <TableHead key={col.accessor}>{col.header}</TableHead>)}
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentFilteredUsers.length > 0 ? (
                                    currentFilteredUsers.map(user => (
                                        <TableRow key={user.userId}>
                                            {columns.map(col => (
                                                <TableCell key={col.accessor} className="font-medium">
                                                    {user[col.accessor] !== null && user[col.accessor] !== undefined
                                                        ? String(user[col.accessor])
                                                        : (col.default || '')}
                                                </TableCell>
                                            ))}
                                            <TableCell className="space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditUser(user)} // Ensure handleEditUser is adapted if used
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => openDeleteDialog(user)}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length + 1} className="text-center">
                                            No {USER_TYPE_LABELS[activeTab].toLowerCase()} found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </div>

            {/*Company table*/}
            <hr className="my-8" />
            <div className="p-6 bg-card border rounded-lg shadow">
                <h2 className="text-2xl font-semibold mb-4">Company Management</h2>

                <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
                    <Input
                        type="text"
                        placeholder="Search companies by name, champion, or ID..."
                        value={CompanySearchTerm}
                        onChange={(e) => setCompanySearchTerm(e.target.value)}
                        className="flex-grow"
                    />
                    <Button onClick={handleAddCompanyClick} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                        Add New Company
                    </Button>
                </div>

                {isLoadingCompanies ? (
                    <LoadingSpinner text="Loading Companies..." />
                ) : (
                    <ScrollArea className="h-[500px] w-full border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {companyColumns.map(col => <TableHead key={col.accessor}>{col.header}</TableHead>)}
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentFilteredCompanies.length > 0 ? (
                                    currentFilteredCompanies.map(company => (
                                        <TableRow key={company.company_id}>
                                            {companyColumns.map(col => (
                                                <TableCell key={col.accessor} className="font-medium">
                                                    {company[col.accessor] !== null && company[col.accessor] !== undefined
                                                        ? String(company[col.accessor])
                                                        : (col.default || '')}
                                                </TableCell>
                                            ))}
                                            <TableCell className="space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditCompanyClick(company)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => openCompanyDeleteDialog(company)}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={companyColumns.length + 1} className="text-center">
                                            No companies found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user {' '}
                            <span className="font-semibold">
                                {userToDelete?.firstName || userToDelete?.lastName ? `${userToDelete?.firstName || ''} ${userToDelete?.lastName || ''}`.trim() : userToDelete?.email}
                                {' (ID: '}{userToDelete?.userId})
                            </span>
                            {' '} and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => userToDelete && handleDeleteUser(userToDelete.userId)}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Yes, delete user
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add/Edit Company Dialog */}
            <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'Edit Company' : 'Add New Company'}</DialogTitle>
                        <DialogDescription>
                            {isEditMode ? 'Make changes to the company details here.' : 'Fill in the details for the new company.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={currentCompany.name}
                                onChange={handleFormChange}
                                className="col-span-3"
                                maxLength={20}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="website" className="text-right">
                                Website
                            </Label>
                            <Input
                                id="website"
                                value={currentCompany.website}
                                onChange={handleFormChange}
                                className="col-span-3"
                                maxLength={20}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="champion" className="text-right">
                                Champion
                            </Label>
                            <Input
                                id="champion"
                                value={currentCompany.champion}
                                onChange={handleFormChange}
                                className="col-span-3"
                                maxLength={20}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddEditDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" onClick={handleSaveCompany} className={'bg-green-600 hover:bg-green-700'}>
                            {isEditMode ? 'Save changes' : 'Add Company'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isCompanyDeleteDialogOpen} onOpenChange={setIsCompanyDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the company {' '}
                            <span className="font-semibold">
                                {companyToDelete?.name} (ID: {companyToDelete?.company_id})
                            </span>
                            {' '} and remove all associated data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setCompanyToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => companyToDelete && handleDeleteCompany(companyToDelete.company_id)}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Yes, delete company
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
};

export default AdminDashboard;