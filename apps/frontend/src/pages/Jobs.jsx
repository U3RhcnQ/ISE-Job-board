import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Button} from "../components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "../components/ui/card";
import {Badge} from "../components/ui/badge";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "../components/ui/select";
import {Users} from "lucide-react";
import { NumericFormat } from "react-number-format";
import { useAuth } from "../hooks/useAuth.js"

// Shadcn/ui Dialog components
import { Dialog } from "../components/ui/dialog";
import JobDetailsModal from "../components/JobDetailsModal";
import JobActionCard from "../components/JobActionCard";

const API_BASE_URL = "http://localhost:8080/api/v1";



const JobCard = ({ id, company, title, salary, description, tags, positionCount, user, onViewDetailsRequest, approval }) => {

    return (
        <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{company} - {title}</CardTitle>
                        <CardDescription><NumericFormat value={salary.toFixed(0)} displayType={'text'} thousandSeparator={true} prefix={'€ '} /> per/month </CardDescription>
                    </div>
                    <div className="flex flex-shrink-0 gap-1">
                        <Badge variant="default" className={
                            approval === 'approved' ? 'bg-green-100 text-green-700'
                                : approval === 'pending' ? 'bg-yellow-100 text-yellow-700'
                                    : approval === 'rejected' ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-100 text-gray-700' }
                        >
                            {approval.charAt(0).toUpperCase() + approval.slice(1)}
                        </Badge>
                        {tags.map(tag => (
                            <Badge key={tag} variant="default" className="bg-green-100 text-green-800 border border-green-200">{tag}</Badge>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center pt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    {positionCount} Positions
                </div>
                <div className="flex gap-2">
                    {user.access_level === "admin" && (
                        <Button className={"bg-green-600 hover:bg-green-700"} onClick={() => onViewDetailsRequest(id)}>Edit</Button>
                    )}
                    {user.access_level === "rep" && (
                        <Button className={"bg-green-600 hover:bg-green-700"} onClick={() => onViewDetailsRequest(id)}>Edit</Button>
                    )}
                    {user.access_level === "student" && (
                        <Button className={"bg-green-600 hover:bg-green-700"} onClick={() => onViewDetailsRequest(id)}>Read More</Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};

const Jobs = () => {


    const { user, token, isLoading: authIsLoading } = useAuth(); // Renamed isLoading to avoid conflict

    // State for fetched jobs
    const [jobsData, setJobsData] = useState([]);
    // State for API loading status
    const [jobsIsLoading, setJobsIsLoading] = useState(true);
    const [jobsError, setJobsError] = useState(null);
    // State for the active filter ('All', 'R1', 'R2', 'R1+R2')
    const [activeFilter, setActiveFilter] = useState('All');
    // NEW: State for the sort order
    const [sortOrder, setSortOrder] = useState('date-newest');

    // State for the centralized JobDetailsModal
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    // `modalTargetJobId` is null for "create" mode, or a job ID string for "edit" mode
    const [modalTargetJobId, setModalTargetJobId] = useState(null);

    const fetchJobs = useCallback(async () => {
        // Guard: Only fetch if auth is complete and token is available
        if (authIsLoading || !token) {
            // If auth is done but no token, it means user is not logged in or token is invalid.
            if (!authIsLoading && !token) {
                setJobsData([]); // Clear any existing jobs
                setJobsIsLoading(false);
                // Optionally set a specific message if needed, though the main render handles !user
            }
            return; // Don't proceed if auth is still loading or no token
        }

        console.log("Fetching jobs with token..."); // Debug log
        setJobsIsLoading(true);
        setJobsError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/jobs`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
            }
            const apiData = await response.json();
            const transformedData = apiData.map(apiJob => ({
                id: apiJob.jobId,
                title: apiJob.jobTitle || 'N/A',
                company: apiJob.companyName || 'N/A',
                description: apiJob.smallDescription || 'N/A',
                salary: apiJob.salary,
                salaryValue: apiJob.salary,
                postedDate: apiJob.postDate || new Date().toISOString(),
                tags: apiJob.residency ? [apiJob.residency.toUpperCase()] : [],
                approvalStatus: apiJob.approval	 || 'N/A',
                positionCount: apiJob.positionCount || 0,
            }));
            setJobsData(transformedData);
        } catch (error) {
            console.error("Failed to fetch jobs:", error);
            setJobsError(error.message);
        } finally {
            setJobsIsLoading(false);
        }
    }, [token, authIsLoading]); // Dependencies for useCallback

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);


    // NEW: useMemo hook to efficiently filter and sort the data.
    // This logic only re-runs when the data, filter, or sort order changes.
    const displayedJobs = useMemo(() => {

        console.log('[useMemo triggered] Filter:', activeFilter, 'Sort:', sortOrder);
        console.log('[useMemo] jobsData length:', jobsData.length);
        if (jobsData.length > 0) {
            console.log('[useMemo] First job in jobsData:', JSON.stringify(jobsData[0]));
        }


        if (!Array.isArray(jobsData) || jobsData.length === 0) {
            console.log('[useMemo] jobsData is empty or not an array. Returning [].');
            return [];
        }

        const filtered = jobsData.filter(job => {
            if (activeFilter === 'All') return true;
            if (activeFilter === 'R1+R2') return job.tags.includes('R1+R2') && job.tags.length === 1;
            if (activeFilter === 'R1') return job.tags.includes('R1') && job.tags.length === 1;
            if (activeFilter === 'R2') return job.tags.includes('R2') && job.tags.length === 1;
            if (activeFilter === 'R3') return job.tags.includes('R3') && job.tags.length === 1;
            if (activeFilter === 'R4') return job.tags.includes('R4') && job.tags.length === 1;
            if (activeFilter === 'R5') return job.tags.includes('R5') && job.tags.length === 1;
            if (activeFilter === 'Approved') return job.approvalStatus === 'approved';
            if (activeFilter === 'Pending') return job.approvalStatus === 'pending';
            if (activeFilter === 'Rejected') return job.approvalStatus === 'rejected';
            return job.tags.includes(activeFilter);
        });

        // Create a copy before sorting to avoid mutating the original data
        return [...filtered].sort((a, b) => {
            switch (sortOrder) {
                case 'salary-asc':
                    return a.salaryValue - b.salaryValue;
                case 'salary-desc':
                    return b.salaryValue - a.salaryValue;
                case 'date-newest':
                    return new Date(b.postedDate) - new Date(a.postedDate);
                default:
                    return 0;
            }
        });
    }, [activeFilter, sortOrder, jobsData]); // Dependencies array

    // Handler to open the modal in "CREATE" mode (called by JobActionCard)
    const handleOpenCreateJobModal = () => {
        console.log("Request to create new job by:", user?.email);
        setModalTargetJobId(null); // No specific job ID means "create" mode
        setIsJobModalOpen(true);    // Open the modal
    };


    // Handler to open the modal in "EDIT" (or view leading to edit) mode (called by JobCard)
    const handleOpenEditViewJobModal = (jobIdToEdit) => {
        console.log("Request to view/edit job ID:", jobIdToEdit);
        setModalTargetJobId(jobIdToEdit); // Set the ID of the job
        setIsJobModalOpen(true);         // Open the modal
    };

    // Callback for when job creation or update is successful from JobDetailsModal
    const handleJobOperationSuccess = (savedOrCreatedJobData) => {
        console.log('Job operation successful in parent:', savedOrCreatedJobData);
        setIsJobModalOpen(false); // Close the modal
        fetchJobs();              // Refresh the list of jobs
    };


    // Step 3: Handle the loading state while user is being fetched
    if (authIsLoading || jobsIsLoading) {
        return <div className="container mx-auto p-8 text-center">Loading user data...</div>;
    }

    // It's also good practice to handle the case where user might still be null after loading
    if (!user) {
        return <div className="container mx-auto p-8 text-center">Could not load user data.</div>;
    }

    // Handle API error state for jobs
    if (jobsError) {
        return <div className="container mx-auto p-8 text-center">Error fetching jobs: {jobsError}. Please try refreshing.</div>;
    }

    return (
        <div className="container mx-auto p-2 md:p-4">
            <div className="text-center md:text-left pb-4">
                <h1 className="text-3xl font-bold">Welcome, <span className={"text-green-600"}> {user.first_name} </span> to the Jobs Board</h1>
                <p className="text-muted-foreground pt-1 pb-1">Here are the latest job opportunities available for you.</p>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-8">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">Filter by:</span>
                    {user.access_level === "student" &&(
                        <>
                        <Button variant={activeFilter === 'All' ? 'default' : 'outline'} className={activeFilter === 'All' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('All')}>All</Button>
                        {user.year === 1 &&(
                            <>
                                <Button variant={activeFilter === 'R1' ? 'default' : 'outline'} className={activeFilter === 'R1' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('R1')}>R1</Button>
                                <Button variant={activeFilter === 'R2' ? 'default' : 'outline'} className={activeFilter === 'R2' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('R2')}>R2</Button>
                                <Button variant={activeFilter === 'R1+R2' ? 'default' : 'outline'} className={activeFilter === 'R1+R2' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('R1+R2')}>R1 + R2</Button>
                            </>
                        )}
                        {user.year === 2 &&(
                            <>
                                <Button variant={activeFilter === 'R2' ? 'default' : 'outline'} className={activeFilter === 'R2' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('R2')}>R2</Button>
                                <Button variant={activeFilter === 'R3' ? 'default' : 'outline'} className={activeFilter === 'R3' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('R3')}>R3</Button>
                            </>
                        )}
                        {user.year === 3 &&(
                            <Button variant={activeFilter === 'R4' ? 'default' : 'outline'} className={activeFilter === 'R4' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('R4')}>R4</Button>
                        )}
                        {user.year === 4 &&(
                            <Button variant={activeFilter === 'R5' ? 'default' : 'outline'} className={activeFilter === 'R5' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('R5')}>R5</Button>
                        )}
                        </>
                    )}
                    {user.access_level !== "student" &&(
                        <>
                            <Button variant={activeFilter === 'All' ? 'default' : 'outline'} className={activeFilter === 'All' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('All')}>All</Button>
                            <Button variant={activeFilter === 'R1' ? 'default' : 'outline'} className={activeFilter === 'R1' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('R1')}>R1</Button>
                            <Button variant={activeFilter === 'R2' ? 'default' : 'outline'} className={activeFilter === 'R2' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('R2')}>R2</Button>
                            <Button variant={activeFilter === 'R1+R2' ? 'default' : 'outline'} className={activeFilter === 'R1+R2' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('R1+R2')}>R1 + R2</Button>
                            <Button variant={activeFilter === 'R3' ? 'default' : 'outline'} className={activeFilter === 'R3' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('R3')}>R3</Button>
                            <Button variant={activeFilter === 'R4' ? 'default' : 'outline'} className={activeFilter === 'R4' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('R4')}>R4</Button>
                            <Button variant={activeFilter === 'R5' ? 'default' : 'outline'} className={activeFilter === 'R5' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('R5')}>R5</Button>
                            {user.access_level === 'admin' && (
                                <>
                                <Button variant={activeFilter === 'Approved' ? 'default' : 'outline'} className={activeFilter === 'Approved' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('Approved')}>Approved</Button>
                                <Button variant={activeFilter === 'Pending' ? 'default' : 'outline'} className={activeFilter === 'Pending' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('Pending')}>Pending</Button>
                                <Button variant={activeFilter === 'Rejected' ? 'default' : 'outline'} className={activeFilter === 'Rejected' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('Rejected')}>Rejected</Button>
                                </>
                             )}
                        </>
                    )}
                </div>
                <div className="w-full md:w-auto">
                    {/* NEW: The Select component is now connected to state.
                        - `onValueChange` updates the sortOrder when you select a new option.
                    */}
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date-newest">Date: Newest</SelectItem>
                            <SelectItem value="salary-desc">Salary: High to Low</SelectItem>
                            <SelectItem value="salary-asc">Salary: Low to High</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {displayedJobs.map(job => (
                    <JobCard key={job.id} user={user} {...job} approval={job.approvalStatus} onViewDetailsRequest={handleOpenEditViewJobModal} />
                ))}

                {(user.access_level === "admin" || user.access_level === "rep") && (
                    <JobActionCard onCreateClick={handleOpenCreateJobModal} />
                )}

            </div>
            {/* SINGLE DIALOG INSTANCE for both Create and Edit Job */}
            <Dialog open={isJobModalOpen} onOpenChange={(open) => {
                setIsJobModalOpen(open);
                if (!open) {
                    setModalTargetJobId(null); // Reset target ID when dialog is closed by any means
                }
            }}>
                {/* JobDetailsModal is the content of the Dialog.
                    It's rendered only when isJobModalOpen is true.
                    The `key` prop ensures the modal re-initializes its internal state
                    when switching between creating a new job and editing different jobs.
                */}
                {isJobModalOpen && (
                    <JobDetailsModal
                        key={modalTargetJobId || 'create-new-job-instance'} // Ensures re-mount & fresh state
                        jobId={modalTargetJobId} // null for "create", job's ID string for "edit"
                        // user prop is not strictly needed if JobDetailsModal uses useAuth() internally,
                        // but ensure JobDetailsModal has access to the user for permissions.
                        // Your JobDetailsModal already uses useAuth, so this prop isn't strictly necessary
                        // unless you want to explicitly pass the `user` object from this scope.
                        onOperationSuccess={handleJobOperationSuccess} // Callback for success
                    />
                )}
            </Dialog>
        </div>
    );
};

export default Jobs;