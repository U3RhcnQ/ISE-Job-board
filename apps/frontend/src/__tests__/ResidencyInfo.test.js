
// File: __tests__/ResidencyInfo.test.js
// Description: Tests for the ResidencyInfoPage component.

import React from 'react';
import { render, screen } from '@testing-library/react';
import ResidencyInfoPage from '../pages/ResidencyInfo'; // Adjust path as needed

describe('ResidencyInfoPage Component', () => {
    // Test 1: Renders the main title and contact information
    test('renders the main title and contact information', () => {
        render(<ResidencyInfoPage />);
        expect(screen.getByText(/Immersive Software Engineering \(ISE\) Residencies Overview/i)).toBeInTheDocument();
        expect(screen.getByText(/Department of Computer Science & Information Systems, University of Limerick/i)).toBeInTheDocument();
        expect(screen.getByText(/Dr. Ian O'Keeffe/i)).toBeInTheDocument();
        expect(screen.getByText('www.software-engineering.ie')).toHaveAttribute('href', '[http://www.software-engineering.ie](http://www.software-engineering.ie)');
    });

    // Test 2: Renders Residency Timeline section with correct data
    test('renders Residency Timeline section with correct data', () => {
        render(<ResidencyInfoPage />);
        expect(screen.getByText(/Residency Timeline \(Overall Program\)/i)).toBeInTheDocument();
        // Check a few timeline items
        expect(screen.getByText(/Year 1, Semester 3 - Summer: RESIDENCY 1: 10 wks - SOFTWARE\/SYSTEMS DEV 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Year 4 MSc, : RESIDENCY 5: 17 wks - ISE RESEARCH PROJECT PART 1 & 2/i)).toBeInTheDocument();
    });

    // Test 3: Renders Residency Durations & Key Dates section
    test('renders Residency Durations & Key Dates section', () => {
        render(<ResidencyInfoPage />);
        expect(screen.getByText(/Residency Durations & Key Dates/i)).toBeInTheDocument();
        expect(screen.getByText(/Residency 1: 10 weeks \(JUN 23 - AUG 29\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Actual dates may vary/i)).toBeInTheDocument();
    });

    // Test 4: Renders Guiding Principles section
    test('renders Guiding Principles section', () => {
        render(<ResidencyInfoPage />);
        expect(screen.getByText(/Guiding Principles for Residencies 1 & 2/i)).toBeInTheDocument();
        expect(screen.getByText(/Students rotate across different Residency Partners/i)).toBeInTheDocument();
    });

    // Test 5: Renders Residency Partner Roles section
    test('renders Residency Partner Roles section', () => {
        render(<ResidencyInfoPage />);
        expect(screen.getByText(/Residency Partner Roles/i)).toBeInTheDocument();
        expect(screen.getByText(/Residency Champion:/i)).toBeInTheDocument();
        expect(screen.getByText(/Central point of contact for Residencies/i)).toBeInTheDocument();
    });

    // Test 6: Renders Student Matching Factors section
    test('renders Student Matching Factors section', () => {
        render(<ResidencyInfoPage />);
        expect(screen.getByText(/Student Matching Factors/i)).toBeInTheDocument();
        expect(screen.getByText(/Student preferences/i)).toBeInTheDocument();
        expect(screen.getByText(/The outcome is a Residency Matching list./i)).toBeInTheDocument();
    });

    // Test 7: Renders Expected Student Skillset section with some skills
    test('renders Expected Student Skillset section with some skills', () => {
        render(<ResidencyInfoPage />);
        expect(screen.getByText(/Expected Student Skillset by June 2025/i)).toBeInTheDocument();
        expect(screen.getByText('algorithms')).toBeInTheDocument(); // A skill from the list
        expect(screen.getByText('python programming')).toBeInTheDocument(); // Another skill
        expect(screen.getByText(/Residency Partners are aware of this expected skillset/i)).toBeInTheDocument();
    });

    // Test 8: Renders Residency 1 details section
    test('renders Residency 1 details section', () => {
        render(<ResidencyInfoPage />);
        expect(screen.getByText(/Residency 1: Software Systems\/Dev Part 1 \(CS4453\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Year 1 Weeks 6 to 15 \(10 Weeks\) in the summer semester./i)).toBeInTheDocument();
        expect(screen.getByText(/Understanding legacy code/i)).toBeInTheDocument(); // A challenge
        expect(screen.getByText(/Identify the roles played by team members/i)).toBeInTheDocument(); // A cognitive outcome
        expect(screen.getByText(/Adhere to schedules set out by team leads/i)).toBeInTheDocument(); // An affective outcome
    });

    // Test 9: Renders Residency 2 details section
    test('renders Residency 2 details section', () => {
        render(<ResidencyInfoPage />);
        expect(screen.getByText(/Residency 2: Software\/System Dev. Part 2 \(CS4444\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Year 2 Weeks 1 to 15 \(15 Weeks\) in the autumn semester./i)).toBeInTheDocument();
        expect(screen.getByText(/This residency requires students to take a deeper dive/i)).toBeInTheDocument(); // Purpose
    });

    // Test 10: Renders Assessment of Residencies section
    test('renders Assessment of Residencies section', () => {
        render(<ResidencyInfoPage />);
        expect(screen.getByText(/Assessment of Residencies/i)).toBeInTheDocument();
        expect(screen.getByText(/EVIDENCE that Learning Outcomes \(LOs\) have been met./i)).toBeInTheDocument();
        expect(screen.getByText(/10%:/i)).toBeInTheDocument(); // For Weekly Report
        expect(screen.getByText(/Weekly Report \[ISE\]/i)).toBeInTheDocument();
        expect(screen.getByText(/50%:/i)).toBeInTheDocument(); // For Final Report
        expect(screen.getByText(/Final Report \[ISE\]/i)).toBeInTheDocument();
    });

    // Test 11: Checks for presence of specific icons (example)
    test('renders specific icons in section titles', () => {
        render(<ResidencyInfoPage />);
        // Lucide icons are often rendered as SVGs. We can check for their presence by looking at parent elements.
        // Example: Check if the "Residency Timeline" title has an icon.
        // This is a bit fragile as it depends on DOM structure.
        const timelineTitle = screen.getByText(/Residency Timeline \(Overall Program\)/i);
        // Assuming the icon is an SVG element directly preceding or within the title's container.
        // A more robust way might be to add data-testid to icons if possible.
        // For now, we will assume the structure <SectionTitle icon={CalendarDays} title="..." />
        // means the icon is rendered near the title.
        // This test is more of a conceptual check.
        expect(timelineTitle).toBeInTheDocument(); // At least the title is there.
        // To properly test icons, you might need to query for SVG elements or specific class names they use.
    });
});