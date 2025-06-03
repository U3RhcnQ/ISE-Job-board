import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card"; // Assuming these are in your ui folder
import { Badge } from "../components/ui/badge"; // Assuming this is in your ui folder
import { Users, CalendarDays, CheckCircle, ListChecks, UsersRound, BarChart3, Brain, Handshake, Target, FileText, Presentation, PercentCircle, Building } from 'lucide-react'; // Added more icons

// Helper component for list items
const ListItem = ({ children }) => (
    <li className="mb-1">
        {children}
    </li>
);

// Helper component for section titles
const SectionTitle = ({ icon, title }) => (
    <div className="flex items-center text-xl font-semibold text-gray-700 mb-3">
        {React.createElement(icon, { className: "mr-2 h-6 w-6 text-green-600" })}
        {title}
    </div>
);

const ResidencyInfoPage = () => {
    // Skillset from Page 8
    const skills = [
        "interpretation", "algorithms", "foundation", "github", "java", "data structures", "programming",
        "operating system concept", "enterprise systems", "object oriented programming", "compilation",
        "fundamental of data analysis", "version control", "data science", "agile process", "git",
        "software architecture", "dev ops", "project management", "python programming"
    ];

    const residencyData = {
        title: "Immersive Software Engineering (ISE) Residencies Overview",
        department: "Department of Computer Science & Information Systems, University of Limerick",
        contact: "Dr. Ian O'Keeffe",
        website: "www.software-engineering.ie",

        timeline: [
            { year: "Year 1", semester: "Semester 3 - Summer", module: "RESIDENCY 1: 10 wks", details: "SOFTWARE/SYSTEMS DEV 1" },
            { year: "Year 2", semester: "Starts SEP", module: "RESIDENCY 2: 15 wks", details: "SOFTWARE/SYSTEMS DEV 2" },
            { year: "Year 2", semester: "", module: "RESIDENCY 3: 10 wks", details: "USER INTERACTION IN PRACTICE" },
            { year: "Year 3", semester: "", module: "RESIDENCY 4: 19 wks", details: "SOFTWARE DESIGN & ARCHITECTURE 1 & 2" },
            { year: "Year 4 MSc", semester: "", module: "RESIDENCY 5: 17 wks", details: "ISE RESEARCH PROJECT PART 1 & 2" },
        ],

        keyDates: [
            { name: "Residency 1", duration: "10 weeks", dates: "JUN 23 - AUG 29" },
            { name: "Residency 2", duration: "15 weeks", dates: "SEP 08 - DEC 19" },
            { name: "Combined Residency 1+2", duration: "25 weeks" },
            { name: "Residency 3", duration: "10 weeks" },
            { name: "Residency 4 (2025)", duration: "16 weeks", dates: "JAN 20 - MAY 09" },
            { name: "Residency 5", duration: "16 weeks" }
        ],
        dateNote: "Actual dates may vary as the financial year for our business partners does not match the academic calendar and generally starts in January, so this can affect HR planning timelines.",

        guidingPrinciples: [
            "Students rotate across different Residency Partners (RPs) for Residencies 1-4.",
            "Two students per residency per RP for Residencies 1-3 is the favoured allocation.",
            "Allocation/Matching is competitive: Students rank favourite RPs, are interviewed for acceptance.",
            "For International students on an IRP Stamp 2, UL Global contacted Immigration and confirmed that the Stamp 2 permission will cover students for the residency elements of the programme as they are integral to it, so working hours limitations do not apply."
        ],

        partnerRoles: [
            { role: "Residency Champion", description: "Central point of contact for Residencies, coordinating projects, TLs, ISE comms." },
            { role: "HR Representative", description: "Focus on on-boarding, employee benefits, contracts, support." },
            { role: "Executive Sponsor", description: "Senior technical management, overseeing the Residencies and ensuring continuity of the ISE Champion and HR positions." },
            { role: "Team Lead/PM (One-off per Residency)", description: "Hosts Resident. Follows through on Learning Outcomes. Links in with Residency Champion." },
            { role: "Advisor (optional, One-off per Residency)", description: "Early career professional to act as a peer/role-model to resident and be a point of contact." }
        ],

        studentMatchingFactors: [
            "Student preferences",
            "Student academic performance to date",
            "Residency Project proposals",
            "Jobs Board",
            "Interviews",
            "ISE Residency Team"
        ],

        residency1: {
            code: "CS4453 - RESIDENCY 1: SOFTWARE SYSTEMS/DEV PART 1",
            duration: "Year 1 Weeks 6 to 15 (10 Weeks) in the summer semester.",
            purpose: "This block introduces students to the everyday complexities of developing a software systems and the challenges involved in maintaining and existing codebase.",
            challenges: [
                "Understanding legacy code",
                "Changing requirements",
                "Code Integration",
                "Debugging",
                "Performance optimization",
                "Collaborating with a diverse, globally distributed development team"
            ],
            learnAbout: "The organisation's structure, culture, management, and the variety of roles fulfilled by team members.",
            hosting: "Each student will be hosted by an industry partner for their residency and will be embedded in the team of their technical mentor/line manager.",
            activities: [
                "Students will attend meetings in which the team plans and evaluates its work, and coordinates with other teams.",
                "Students will collaborate with and learn from the software engineers on their team, and from other experts across the rest of the organization."
            ],
            requirements: "Students will be required to maintain a personal log of their weekly progress in the form of submitted Weekly Reports, present a report on their placement via a recorded Presentation, and complete a Final Report.",
            cognitiveOutcomes: [
                "Identify the roles played by team members in the organisation (e.g., business analyst architects, technical leads, developers, engineering managers, project managers, and others).",
                "Develop competency in the programming language(s) and IDEs necessary to commit changes to the codebase.",
                "Correctly utilise the required toolchains within the context of a development process where utilised by the industry partner.",
                "Implement small scale corrective and/or adaptive changes to an application.",
                "Document changes as mandated by the organisation's standards.",
                "Develop competency in creating concise weekly status reports for ISE faculty and industry partners, building an archive of content for the Final Report.",
                "Research and deliver a presentation on a residency topic."
            ],
            affectiveOutcomes: [
                "Update line managers as instructed and notify them of issues in a timely and precise manner.",
                "Adhere to schedules set out by team leads and project managers.",
                "Respect and fully comply with all of the partner's codes of conduct.",
                "Comply fully with NDAs and contracts.",
                "Convey a professional manner at all times.",
                "Present work in a precise and cohesive manner."
            ]
        },
        residency2: {
            code: "CS4444 - RESIDENCY 2: SOFTWARE/SYSTEM DEV. PART 2",
            duration: "Year 2 Weeks 1 to 15 (15 Weeks) in the autumn semester.",
            purpose: "This residency requires students to take a deeper dive into software development processes and tools introduced in Residency 1. Students will explore the enterprise and software architectures that they will work with.",
            tasks: "Students will add new features to an enterprise codebase or small greenfields development and present their work to their line manager and team through code inspections.",
            buildsOnR1: "This residency builds on the challenges and learning outcomes from the first residency by increasing the complexity and scale of the tasks involved.",
            hosting: "Each student will be hosted by an industry partner for their residency and will be embedded in the team of their technical mentor/line manager.",
            activities: [
                "Students will attend meetings in which the team plans and evaluates its work, and coordinates with other teams.",
                "Students will collaborate with and learn from the software engineers on their team, and from other experts across the rest of the organization."
            ],
            requirements: "Students will be required to maintain a personal log of their weekly progress in the form of submitted Weekly Reports, present a report on their placement via a recorded Presentation, and complete a Final Report."
        },
        assessment: {
            focus: "EVIDENCE that Learning Outcomes (LOs) have been met.",
            instruments: [
                { item: "Weekly Report [ISE]", weight: "10%" },
                { item: "Student Presentation [ISE]", weight: "20%" },
                { item: "Final RP Checkpoint [RP/ISE]", weight: "20%" },
                { item: "Final Report [ISE]", weight: "50%" }
            ]
        }
    };

    return (
        <div className='container mx-auto p-4 md:p-8'>
            <Card className="mb-6 bg-gray-50">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-green-700">{residencyData.title}</CardTitle>
                    <CardDescription className="text-md text-gray-600">
                        {residencyData.department} <br />
                        Contact: {residencyData.contact} | Website: <a href={`http://${residencyData.website}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">{residencyData.website}</a>
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <SectionTitle icon={CalendarDays} title="Residency Timeline (Overall Program)" />
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            {residencyData.timeline.map((item, index) => (
                                <ListItem key={index}>
                                    <strong>{item.year}, {item.semester}:</strong> {item.module} - <em>{item.details}</em>
                                </ListItem>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <SectionTitle icon={CalendarDays} title="Residency Durations & Key Dates" />
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            {residencyData.keyDates.map((item, index) => (
                                <ListItem key={index}>
                                    <strong>{item.name}:</strong> {item.duration}
                                    {item.dates && ` (${item.dates})`}
                                </ListItem>
                            ))}
                        </ul>
                        <p className="mt-2 text-xs text-muted-foreground">{residencyData.dateNote}</p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <SectionTitle icon={CheckCircle} title="Guiding Principles for Residencies 1 & 2" />
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                            {residencyData.guidingPrinciples.map((principle, index) => (
                                <ListItem key={index}>{principle}</ListItem>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <SectionTitle icon={UsersRound} title="Residency Partner Roles" />
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-sm">
                            {residencyData.partnerRoles.map((role, index) => (
                                <ListItem key={index}>
                                    <strong className="font-semibold">{role.role}:</strong> {role.description}
                                </ListItem>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <SectionTitle icon={ListChecks} title="Student Matching Factors" />
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            {residencyData.studentMatchingFactors.map((factor, index) => (
                                <ListItem key={index}>{factor}</ListItem>
                            ))}
                        </ul>
                        <p className="mt-3 text-xs text-muted-foreground">The outcome is a Residency Matching list.</p>
                    </CardContent>
                </Card>


                <Card className="md:col-span-2">
                    <CardHeader>
                        <SectionTitle icon={BarChart3} title="Expected Student Skillset by June 2025" />
                        <CardDescription>After 4 Blocks of learning on ISE.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill, index) => (
                                <Badge key={index} variant="default" className="bg-green-100 text-green-800 border border-green-200 text-xs">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                            Residency Partners are aware of this expected skillset and have seen the Learning Outcomes.
                            Learning Outcomes are generic enough for broad applicability across company sizes, domains, and skillsets.
                        </p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <SectionTitle icon={Building} title="Residency 1: Software Systems/Dev Part 1 (CS4453)" />
                        <CardDescription>{residencyData.residency1.duration}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <p><strong>Purpose:</strong> {residencyData.residency1.purpose}</p>
                        <div>
                            <strong>Challenges include:</strong>
                            <ul className="list-disc pl-5 mt-1">
                                {residencyData.residency1.challenges.map((challenge, i) => <ListItem key={i}>{challenge}</ListItem>)}
                            </ul>
                        </div>
                        <p><strong>Students will learn about:</strong> {residencyData.residency1.learnAbout}</p>
                        <p>{residencyData.residency1.hosting}</p>
                        <div>
                            <strong>Activities:</strong>
                            <ul className="list-disc pl-5 mt-1">
                                {residencyData.residency1.activities.map((activity, i) => <ListItem key={i}>{activity}</ListItem>)}
                            </ul>
                        </div>
                        <p><strong>Requirements:</strong> {residencyData.residency1.requirements}</p>

                        <div className="mt-4">
                            <h4 className="font-semibold text-md mb-2 flex items-center"><Brain className="mr-2 h-5 w-5 text-green-500" />Cognitive Learning Outcomes:</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                {residencyData.residency1.cognitiveOutcomes.map((outcome, i) => <ListItem key={i}>{outcome}</ListItem>)}
                            </ul>
                        </div>
                        <div className="mt-4">
                            <h4 className="font-semibold text-md mb-2 flex items-center"><Handshake className="mr-2 h-5 w-5 text-green-500" />Affective Learning Outcomes:</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                {residencyData.residency1.affectiveOutcomes.map((outcome, i) => <ListItem key={i}>{outcome}</ListItem>)}
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <SectionTitle icon={Building} title="Residency 2: Software/System Dev. Part 2 (CS4444)" />
                        <CardDescription>{residencyData.residency2.duration}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <p><strong>Purpose:</strong> {residencyData.residency2.purpose}</p>
                        <p><strong>Tasks:</strong> {residencyData.residency2.tasks}</p>
                        <p>{residencyData.residency2.buildsOnR1}</p>
                        <p>{residencyData.residency2.hosting}</p>
                        <div>
                            <strong>Activities:</strong>
                            <ul className="list-disc pl-5 mt-1">
                                {residencyData.residency2.activities.map((activity, i) => <ListItem key={i}>{activity}</ListItem>)}
                            </ul>
                        </div>
                        <p><strong>Requirements:</strong> {residencyData.residency2.requirements}</p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <SectionTitle icon={PercentCircle} title="Assessment of Residencies" />
                        <CardDescription>{residencyData.assessment.focus}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-2 font-semibold">Assessment Instruments:</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            {residencyData.assessment.instruments.map((instrument, index) => (
                                <ListItem key={index}>
                                    <strong>{instrument.weight}:</strong> {instrument.item}
                                </ListItem>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ResidencyInfoPage;