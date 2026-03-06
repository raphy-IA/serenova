module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.spec.ts', '**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    clearMocks: true,
    verbose: true,
};
