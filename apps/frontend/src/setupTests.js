// apps/frontend/src/setupTests.js
import '@testing-library/jest-dom';

// Polyfill TextEncoder for Jest's JSDOM environment
import { TextEncoder } from 'util';
global.TextEncoder = TextEncoder;
