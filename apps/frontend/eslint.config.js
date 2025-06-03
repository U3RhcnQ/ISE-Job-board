// eslint.config.js
import eslintJs from '@eslint/js';
import globals from 'globals';

// React related plugins
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';

// For Prettier integration
import eslintConfigPrettier from 'eslint-config-prettier';

// Optional: For resolving path aliases like @/* (if you use them)
// import pluginImport from 'eslint-plugin-import';
// import { FlatCompat } from '@eslint/eslintrc'; // If using settings from old .eslintrc format for pluginImport
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const compat = new FlatCompat({
//   resolvePluginsRelativeTo: __dirname,
// });

export default [
    // 1. Global Ignores (IMPORTANT: Add this first)
    {
        ignores: [
            'node_modules/', // Standard ignore
            'dist/', // Ignore your build output directory
            'build/', // Another common build output directory
            // Add any other specific files or directories you want to ignore globally
            // e.g., "coverage/", ".cache/", "*.log"
        ],
    },

    // 2. Base JavaScript Recommended Rules (applies to all JS-like files not ignored)
    eslintJs.configs.recommended,

    // 3. Configuration for your React/JSX application code
    {
        files: ['src/**/*.{js,jsx}'], // Target .js and .jsx files within your src directory
        plugins: {
            react: pluginReact,
            'react-hooks': pluginReactHooks,
            'jsx-a11y': pluginJsxA11y,
            // "import": pluginImport, // Uncomment if using path aliases and eslint-plugin-import
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
                ecmaVersion: 'latest',
                sourceType: 'module', // Your project is type: module
            },
            globals: {
                ...globals.browser,
                // ...globals.jest, // Uncomment if you use Jest
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
            // Example for eslint-plugin-import and path aliases (if you use them)
            // 'import/resolver': {
            //   typescript: { // Works for jsconfig.json paths too
            //     project: './jsconfig.json', // Or './tsconfig.json'
            //   },
            //   node: true,
            // },
        },
        rules: {
            // Start with recommended rules from plugins
            ...pluginReact.configs.recommended.rules,
            ...pluginReactHooks.configs.recommended.rules,
            ...pluginJsxA11y.configs.recommended.rules,
            // ...pluginImport.configs.recommended.rules, // Uncomment if using eslint-plugin-import

            // --- YOUR CUSTOMIZATIONS ---
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off', // As per your preference
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            // Add any other specific rule overrides here
        },
    },

    // 4. Configuration for Node.js/CommonJS configuration files
    // (e.g., tailwind.config.cjs, postcss.config.cjs, .prettierrc.cjs if you use module.exports)
    // Since your project is "type": "module", these files MUST end in .cjs if they use CommonJS.
    {
        files: [
            '*.config.cjs', // For files like tailwind.config.cjs, postcss.config.cjs
            '.prettierrc.cjs',
            'vite.config.js', // If your prettier config uses module.exports
            // If you have any *.config.js files that are truly CommonJS, they should be .cjs
            // or you need a specific override for them if they can't be renamed.
        ],
        languageOptions: {
            globals: {
                ...globals.node, // module, require, process, __dirname, etc.
            },
            sourceType: 'commonjs', // Explicitly CommonJS
        },
        rules: {
            // Turn off React-specific rules for these Node files
            'react/prop-types': 'off',
            'react/react-in-jsx-scope': 'off',
            // You might also want to turn off browser-specific rules if they trigger
            // For example, if 'import/no-unresolved' from eslint-plugin-import triggers on 'require':
            // 'import/no-unresolved': ['error', { commonjs: true }],
        },
    },

    // 5. Prettier Configuration
    // This disables ESLint formatting rules that would conflict with Prettier.
    eslintConfigPrettier,
];
