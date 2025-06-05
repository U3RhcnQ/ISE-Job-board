// apps/frontend/jest.config.cjs

module.exports = {
    testEnvironment: 'jsdom', // Add this for the 'document is not defined' error
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'], // If you have a setup file, otherwise remove
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1', // This maps '@/...' to 'src/...'
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Optional: To handle CSS imports
    },
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
    // Add other Jest configurations as needed
};
