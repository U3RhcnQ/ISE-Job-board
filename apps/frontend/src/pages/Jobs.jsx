import React, {useEffect, useMemo, useState} from 'react';
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Users} from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { useAuth } from '../hooks/useAuth.js'

const API_BASE_URL = 'http://localhost:8080/api/v1';


const JobCard = ({ company, title, salary, description, tags, applicants, user }) => {
    return (
        <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{company} - {title}</CardTitle>
                        <CardDescription><NumericFormat value={salary.toFixed(0)} displayType={'text'} thousandSeparator={true} prefix={'€ '} /> per/month </CardDescription>
                    </div>
                    <div className="flex flex-shrink-0 gap-1">
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
                    {applicants} Positions
                </div>
                <div className="flex gap-2">
                    {user.access_level === "admin" && (
                        <>
                        <Button variant="outline">Approve</Button>
                        <Button className={"bg-green-600 hover:bg-green-700"}>Edit</Button>
                        </>
                    )}
                    {user.access_level === "rep" && (
                        <Button className={"bg-green-600 hover:bg-green-700"}>Edit</Button>
                    )}
                    {user.access_level === "student" && (
                        <Button className={"bg-green-600 hover:bg-green-700"} >Read More</Button>
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

    useEffect(() => {
        const fetchJobs = async () => {

            setJobsIsLoading(true);
            setJobsError(null);

            try {
                const response = await fetch(`${API_BASE_URL}/jobs`, {
                    headers: {
                        'Authorization': `Bearer ${token}`, // Send token if endpoint is protected
                    }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const apiData = await response.json();

                // --- Data Transformation ---
                const transformedData = apiData.map(apiJob => {
                    // As "date will be added later", we'll use a placeholder.
                    // For consistent sorting, a fixed past date or current date can be used.
                    // If jobs without a real date should appear last when sorting by newest:
                    const placeholderDate = '1970-01-01T00:00:00Z';
                    // Or if they should appear as "new" until actual dates are available:
                    // const placeholderDate = new Date().toISOString();

                    return {
                        id: apiJob.jobId,
                        company: apiJob.companyName,
                        title: apiJob.jobTitle,
                        salary: apiJob.salary, // Formatted string for display
                        salaryValue: apiJob.salary, // Numeric value for sorting
                        postedDate: apiJob.date || placeholderDate, // Use API date if available, else placeholder
                        description: apiJob.smallDescription,
                        // API gives "r1", component expects tags like ["R1"] for filtering
                        tags: apiJob.residency ? [apiJob.residency.toUpperCase()] : [],
                        // API doesn't provide applicants, so defaulting to 0 or a mock value
                        applicants: apiJob.applicants || 0,
                        approvalStatus: apiJob.approval, // Carry over the approval status
                    };
                });
                // --- End of Data Transformation ---
                setJobsData(transformedData);
            } catch (error) {
                console.error("Failed to fetch jobs:", error);
                setJobsError(error.message);
            } finally {
                setJobsIsLoading(false);
            }
        };

        fetchJobs();
    }, []); // Empty dependency array means this effect runs once on mount


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
            if (activeFilter === 'R1+R2') return job.tags.includes('R1') && job.tags.includes('R2');
            if (activeFilter === 'R1') return job.tags.includes('R1') && job.tags.length === 1;
            if (activeFilter === 'R2') return job.tags.includes('R2') && job.tags.length === 1;
            if (activeFilter === 'R3') return job.tags.includes('R3') && job.tags.length === 1;
            if (activeFilter === 'R4') return job.tags.includes('R4') && job.tags.length === 1;
            if (activeFilter === 'R5') return job.tags.includes('R5') && job.tags.length === 1;
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
                {/* NEW: We now map over the `displayedJobs` array, which is the final, filtered, and sorted list. */}
                {displayedJobs.map(job => (
                    <JobCard key={job.id} user={user} {...job} />
                ))}
            </div>
        </div>
    );
};

export default Jobs;