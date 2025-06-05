import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
} from '../components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import LoadingSpinner from '../components/loadingSpinner.jsx';

const API_BASE_URL = '/api/v1';

const companyColumns = [
    { header: 'Company ID', accessor: 'company_id' },
    { header: 'Name', accessor: 'name' },
    { header: 'Address ID', accessor: 'address_id' },
    { header: 'Champion', accessor: 'champion' },
    // Assuming 'website' is part of the Company model for update/create, though not in the GET response sample
    // { header: 'Website', accessor: 'website' },
];

export const CompanyManagement = () => {
    const { token } = useAuth();
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

        const endpoint = isEditMode ? `${API_BASE_URL}/update-company?companyId=${currentCompany.company_id}` : `${API_BASE_URL}/add-company`;
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(endpoint, {
                method: method,
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

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6">Company Management</h1>

            <div className="p-6 bg-card border rounded-lg shadow">
                <h2 className="text-2xl font-semibold mb-4">Company List</h2>

                <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
                    <Input
                        type="text"
                        placeholder="Search companies by name, champion, or ID..."
                        value={CompanySearchTerm}
                        onChange={(e) => setCompanySearchTerm(e.target.value)}
                        className="flex-grow"
                    />
                    <Button onClick={handleAddCompanyClick} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
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
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddEditDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" onClick={handleSaveCompany}>
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

export default CompanyManagement;