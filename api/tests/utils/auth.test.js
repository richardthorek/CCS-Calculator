'use strict';

const { extractUserFromRequest, requireAuth, buildErrorBody } = require('../../src/utils/auth');

// Helper to encode a principal as a base64 x-ms-client-principal header value
function encodePrincipal(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64');
}

// Minimal mock request factory
function mockRequest(principalHeaderValue) {
    return {
        headers: {
            get: (name) => {
                if (name === 'x-ms-client-principal') return principalHeaderValue || null;
                return null;
            }
        }
    };
}

describe('auth utils', () => {
    describe('extractUserFromRequest', () => {
        test('returns null when header is absent', () => {
            const req = mockRequest(null);
            expect(extractUserFromRequest(req)).toBeNull();
        });

        test('returns null when header is not valid base64 JSON', () => {
            const req = mockRequest('!!!not-base64!!!');
            expect(extractUserFromRequest(req)).toBeNull();
        });

        test('returns null when decoded JSON has no userId', () => {
            const req = mockRequest(encodePrincipal({ userDetails: 'test@example.com' }));
            expect(extractUserFromRequest(req)).toBeNull();
        });

        test('returns user object with correct fields', () => {
            const principal = {
                userId: 'abc123',
                userDetails: 'user@example.com',
                identityProvider: 'google',
                userRoles: ['anonymous', 'authenticated']
            };
            const req = mockRequest(encodePrincipal(principal));
            const user = extractUserFromRequest(req);

            expect(user).not.toBeNull();
            expect(user.userId).toBe('abc123');
            expect(user.email).toBe('user@example.com');
            expect(user.provider).toBe('google');
            expect(user.roles).toEqual(['anonymous', 'authenticated']);
        });

        test('defaults empty string for missing optional fields', () => {
            const principal = { userId: 'xyz' };
            const req = mockRequest(encodePrincipal(principal));
            const user = extractUserFromRequest(req);

            expect(user.email).toBe('');
            expect(user.provider).toBe('');
            expect(user.roles).toEqual([]);
        });
    });

    describe('requireAuth', () => {
        test('returns user when authenticated', () => {
            const principal = {
                userId: 'user1',
                userDetails: 'user1@example.com',
                identityProvider: 'github',
                userRoles: ['authenticated']
            };
            const req = mockRequest(encodePrincipal(principal));
            const user = requireAuth(req);
            expect(user.userId).toBe('user1');
        });

        test('throws with status 401 when not authenticated', () => {
            const req = mockRequest(null);
            expect(() => requireAuth(req)).toThrow();

            try {
                requireAuth(req);
            } catch (err) {
                expect(err.status).toBe(401);
                expect(err.body.code).toBe('UNAUTHORIZED');
            }
        });
    });

    describe('buildErrorBody', () => {
        test('returns object with required fields', () => {
            const body = buildErrorBody('Something went wrong', 'INTERNAL_ERROR');
            expect(body.error).toBe('Something went wrong');
            expect(body.code).toBe('INTERNAL_ERROR');
            expect(body.timestamp).toBeDefined();
        });

        test('includes details when provided', () => {
            const body = buildErrorBody('Bad request', 'VALIDATION_ERROR', { field: 'name' });
            expect(body.details).toEqual({ field: 'name' });
        });

        test('omits details when not provided', () => {
            const body = buildErrorBody('Not found', 'NOT_FOUND');
            expect(body.details).toBeUndefined();
        });
    });
});
