import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            include: ['extensions/**/src/**'],
            reporter: ['text', 'html', 'json-summary'],
            thresholds: {
                lines: 75,
            },
        },
    },
});
