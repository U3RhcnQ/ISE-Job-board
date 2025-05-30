import React, {useMemo, useState} from 'react';
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Users} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js'

// --- Improved Mock Data ---
// I've added a numeric `salaryValue` and a `postedDate` to make sorting reliable.
// The original `salary` string is kept for display purposes.
const jobsData = [
    { id: 1, company: 'AWS', title: 'Software Engineering', salary: '€ 3,800 per/month', salaryValue: 3800, postedDate: '2025-05-20T10:00:00Z', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', tags: ['R1', 'R2'], applicants: 10 },
    { id: 2, company: 'Google', title: 'Cloud Platform Engineer', salary: '€ 4,200 per/month', salaryValue: 4200, postedDate: '2025-05-22T11:00:00Z', description: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.', tags: ['R2'], applicants: 25 },
    { id: 3, company: 'Microsoft', title: 'DevOps Specialist', salary: '€ 3,950 per/month', salaryValue: 3950, postedDate: '2025-05-18T09:00:00Z', description: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.', tags: ['R1'], applicants: 18 },
    { id: 4, company: 'Meta', title: 'Frontend Developer', salary: '€ 3,700 per/month', salaryValue: 3700, postedDate: '2025-05-25T14:00:00Z', description: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', tags: ['R1', 'R2'], applicants: 32 },
    { id: 5, company: 'Apple', title: 'iOS Engineer', salary: '€ 4,500 per/month', salaryValue: 4500, postedDate: '2025-04-30T16:00:00Z', description: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.', tags: ['R2'], applicants: 15 },
    { id: 6, company: 'Netflix', title: 'Backend Engineer', salary: '€ 4,100 per/month', salaryValue: 4100, postedDate: '2025-05-26T08:00:00Z', description: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione.', tags: ['R1', 'R2'], applicants: 22 },
];
// --- End of Mock Data ---

const JobCard = ({ company, title, salary, description, tags, applicants }) => {
    return (
        <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{company} - {title}</CardTitle>
                        <CardDescription>{salary}</CardDescription>
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
                    {applicants} Applied
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Read more</Button>
                    <Button className={"bg-green-600 hover:bg-green-700"} >Apply</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const Jobs = () => {

    // Step 2: Call the hook to get user and isLoading state
    const { user, isLoading } = useAuth();

    // State for the active filter ('All', 'R1', 'R2', 'R1+R2')
    const [activeFilter, setActiveFilter] = useState('All');
    // NEW: State for the sort order
    const [sortOrder, setSortOrder] = useState('date-newest');

    // NEW: useMemo hook to efficiently filter and sort the data.
    // This logic only re-runs when the data, filter, or sort order changes.
    const displayedJobs = useMemo(() => {
        const filtered = jobsData.filter(job => {
            if (activeFilter === 'All') return true;
            if (activeFilter === 'R1+R2') return job.tags.includes('R1') && job.tags.includes('R2');
            if (activeFilter === 'R1') return job.tags.includes('R1') && job.tags.length === 1;
            if (activeFilter === 'R2') return job.tags.includes('R2') && job.tags.length === 1;
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
    }, [activeFilter, sortOrder]); // Dependencies array

    // Step 3: Handle the loading state while user is being fetched
    if (isLoading) {
        return <div className="container mx-auto p-8 text-center">Loading user data...</div>;
    }

    // It's also good practice to handle the case where user might still be null after loading
    if (!user) {
        return <div className="container mx-auto p-8 text-center">Could not load user data.</div>;
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
                    <Button variant={activeFilter === 'All' ? 'default' : 'outline'} className={activeFilter === 'All' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('All')}>All</Button>
                    <Button variant={activeFilter === 'R1' ? 'default' : 'outline'} className={activeFilter === 'R1' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('R1')}>R1</Button>
                    <Button variant={activeFilter === 'R2' ? 'default' : 'outline'} className={activeFilter === 'R2' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('R2')}>R2</Button>
                    <Button variant={activeFilter === 'R1+R2' ? 'default' : 'outline'} className={activeFilter === 'R1+R2' ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setActiveFilter('R1+R2')}>R1 + R2</Button>
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
                    <JobCard key={job.id} {...job} />
                ))}
            </div>
        </div>
    );
};

export default Jobs;