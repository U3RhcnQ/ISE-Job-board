
    if (error) {
        return <div>Error loading company page: {error}</div>;
    }

    if (!companyData) {
        return <div>Company not found or no data available.</div>;
    }

    // Now you can use the companyData to render your page
    // And potentially the 'user' object from useAuth() for rep-specific views or actions
    return (
        <div>
            <h1>{companyData.name}</h1>
            <p>Company ID from URL: {effectiveCompanyId}</p>
            {user && user.access_level === 'rep' && user.company_id === companyData.id && (
                <p>Welcome, representative of this company!</p>
            )}
            {/* Display other company details from companyData */}
            <p>Industry: {companyData.industry}</p>
            <p>Website: <a href={companyData.website_url}>{companyData.website_url}</a></p>
            {/* ... more details ... */}
        </div>
    );
};


export default Company;