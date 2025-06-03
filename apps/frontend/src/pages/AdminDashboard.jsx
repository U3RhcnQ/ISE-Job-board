import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth'; // Assuming your auth hook path

// Assuming shadcn/ui components are set up
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
    AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner'; // Using sonner for toast notifications, common with shadcn/ui

const API_BASE_URL = 'http://localhost:8080/api/v1'; // Your API base URL

// Mock roles - replace with roles relevant to your application
const USER_ROLES = ['All', 'R1', 'R2', 'R3', 'R4', 'R5', 'Admin', 'Candidate'];
const RESIDENCY_LEVELS = ['R1', 'R2', 'R3', 'R4', 'R5'];

export const AdminDashboard = () => {
    const { user: adminUser, token } = useAuth();
    const [users, setUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [selectedResidency, setSelectedResidency] = useState(RESIDENCY_LEVELS[0]);
    const [isAllocating, setIsAllocating] = useState(false);

    // Dialog states
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null); // For a potential edit modal

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            if (!token) return;
            setIsLoadingUsers(true);
            try {
                const response = await fetch(`${API_BASE_URL}/users`, { // Assuming '/users' is your get-users endpoint
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch users: ${response.status}`);
                }
                const data = await response.json();
                setUsers(data || []); // Ensure data is an array
            } catch (error) {
                console.error('Fetch users error:', error);
                toast.error(`Error fetching users: ${error.message}`);
                setUsers([]);
            } finally {
                setIsLoadingUsers(false);
            }
        };
        fetchUsers();
    }, [token]);

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearchTerm =
                u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'All' || u.role === roleFilter;
            return matchesSearchTerm && matchesRole;
        });
    }, [users, searchTerm, roleFilter]);

    const handleDeleteUser = async (userId) => {
        if (!token) {
            toast.error("Authentication token not found.");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to delete user' }));
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
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

    // Placeholder for edit functionality
    const handleEditUser = (user) => {
        setUserToEdit(user);
        // Here you would typically open an edit modal/form
        toast.info(`Editing user: ${user.name} (ID: ${user.id}). Implement edit modal/form.`);
        console.log("Edit user:", user);
    };

    const handleRunRankingProcess = async () => {
        if (!token) {
            toast.error("Authentication token not found.");
            return;
        }
        setIsAllocating(true);
        toast.info(`Starting allocation for ${selectedResidency}...`);
        try {
            const response = await fetch(`${API_BASE_URL}/allocate?residency=${selectedResidency}`, {
                method: 'POST', // Or GET, depending on your API design. POST is often used for actions.
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Allocation failed' }));
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            const result = await response.json(); // Assuming API returns some confirmation
            toast.success(result.message || `Allocation process for ${selectedResidency} initiated successfully!`);
            console.log("Allocation result:", result);
        } catch (error) {
            console.error('Ranking process error:', error);
            toast.error(`Error running ranking process: ${error.message}`);
        } finally {
            setIsAllocating(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            {/* Section for Ranking Process */}
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
                        className="w-full sm:w-auto"
                    >
                        {isAllocating ? 'Allocating...' : `Run for ${selectedResidency}`}
                    </Button>
                </div>
                {isAllocating && <p className="text-sm text-muted-foreground mt-2">Allocation process is running...</p>}
            </div>

            {/* Section for User Management */}
            <div className="p-6 bg-card border rounded-lg shadow">
                <h2 className="text-2xl font-semibold mb-4">User Management</h2>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow"
                    />
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                            {USER_ROLES.map(role => (
                                <SelectItem key={role} value={role}>
                                    {role}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {isLoadingUsers ? (
                    <p>Loading users...</p>
                ) : (
                    <ScrollArea className="h-[500px] w-full border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    {/* Add other relevant headers like 'ID', 'Status', 'Last Login' etc. */}
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(u => (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-medium">{u.name || 'N/A'}</TableCell>
                                            <TableCell>{u.email || 'N/A'}</TableCell>
                                            <TableCell>{u.role || 'N/A'}</TableCell>
                                            {/* <TableCell>{u.id}</TableCell> */}
                                            <TableCell className="space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditUser(u)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => openDeleteDialog(u)}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">
                                            No users found.
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
                            This action cannot be undone. This will permanently delete the user
                            <span className="font-semibold"> {userToDelete?.name} ({userToDelete?.email}) </span>
                            and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => userToDelete && handleDeleteUser(userToDelete.id)}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Yes, delete user
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {/* You would add an EditUserModal component here, triggered by setUserToEdit */}
        </div>
    );
};

export default AdminDashboard;