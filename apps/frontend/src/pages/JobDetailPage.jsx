// src/pages/JobDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobsData } from '../jobsData'; // Assuming jobsData.js is in src/

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Briefcase, DollarSign, Users, MapPin, Building, FileText, Edit3, ArrowLeft } from 'lucide-react';

const JobDetailPage = () => {
    const { jobId } = useParams();
    const { user } = useAuth(); // Using 'user' instead of 'currentUser' as per AuthContext
    const [job, setJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // Simulate API call delay
        setTimeout(() => {
            const foundJob = jobsData.find(j => j.id === parseInt(jobId));
            setJob(foundJob);
            setIsLoading(false);
        }, 500);
    }, [jobId]);

    if (isLoading) {
        return <div className="container mx-auto p-8 text-center">Loading job details...</div>;
    }

    if (!job) {
        return (
            <div className="container mx-auto p-8 text-center">
                <h2 className="text-2xl font-semibold mb-4">Job Not Found</h2>
                <Link to="/jobs">
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs</Button>
                </Link>
            </div>
        );
    }

    const isCompanyEmployee = user?.role === 'employee' && user?.companyId === job.companyId;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            <Card className="shadow-lg dark:border-slate-700">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-x-4 gap-y-2">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                {/* Placeholder for company logo, e.g., using Avatar */}
                                {/* <Avatar className="h-10 w-10 border">
                  <AvatarImage src={`https://logo.clearbit.com/${job.company.toLowerCase().replace(/\s+/g, '')}.com`} alt={job.company} />
                  <AvatarFallback>{job.company.substring(0,1)}</AvatarFallback>
                </Avatar> */}
                                <Building className="h-8 w-8 text-primary" />
                                <CardTitle className="text-3xl font-bold tracking-tight">{job.title}</CardTitle>
                            </div>
                            <CardDescription className="text-lg text-muted-foreground ml-11">{job.company}</CardDescription>
                        </div>
                        <div className="flex flex-shrink-0 gap-1.5 mt-2 md:mt-0">
                            {job.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mt-4 pt-4 border-t">
                        <span className="flex items-center"><MapPin className="mr-1.5 h-4 w-4" /> {job.location || 'Not specified'}</span>
                        <span className="flex items-center"><Briefcase className="mr-1.5 h-4 w-4" /> {job.type || 'Not specified'}</span>
                        <span className="flex items-center"><DollarSign className="mr-1.5 h-4 w-4" /> {job.salary}</span>
                    </div>
                </CardHeader>

                <Separator />

                <CardContent className="pt-6 space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-3 text-primary">Full Job Description</h3>
                        <p className="text-foreground/90 whitespace-pre-line leading-relaxed">{job.description}</p>
                    </div>

                    {/* Student View Specifics */}
                    {user?.role === 'student' && (
                        <div className="pt-4 text-center md:text-left">
                            <Button size="lg">Apply Now <ExternalLink className="ml-2 h-4 w-4"/></Button>
                        </div>
                    )}

                    {/* Company Employee View Specifics */}
                    {isCompanyEmployee && (
                        <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:bg-blue-900/20 dark:border-blue-700/50">
                            <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">Employer Panel</h3>
                            <p className="text-sm text-blue-600 dark:text-blue-300">
                                <strong>Internal Notes:</strong> {job.employeeNotes || "No internal notes."}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm"><Users className="mr-2 h-4 w-4" /> View Applicants ({job.applicants})</Button>
                                <Button variant="outline" size="sm"><Edit3 className="mr-2 h-4 w-4" /> Edit Job Listing</Button>
                            </div>
                        </div>
                    )}

                    {user?.role === 'employee' && !isCompanyEmployee && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:bg-amber-900/20 dark:border-amber-700/50">
                            <p className="text-sm text-amber-700 dark:text-amber-300">You are viewing this job as an employee from a different company.</p>
                        </div>
                    )}

                </CardContent>

                <CardFooter className="mt-6 pt-6 border-t">
                    <Link to="/jobs">
                        <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to All Jobs</Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
};

export default JobDetailPage;