import { authService } from './auth.service';
import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock de Prisma et des dépendances externes
jest.mock('../../config/database', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth Service', () => {
    const mockUser = {
        id: 'user_123',
        email: 'test@serenova.app',
        passwordHash: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        role: 'GESTIONNAIRE',
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        it('devrait retourner un token si les identifiants sont corrects', async () => {
            // Setup des mocks
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockImplementation((payload, secret, options) => {
                if (options?.expiresIn === '7d' || options?.expiresIn === '7d') return 'mock_refresh_token';
                return 'mock_access_token';
            });

            // Exécution
            const result = await authService.login({ email: 'test@serenova.app', password: 'password123' });

            // Assertions
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@serenova.app' } });
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
            expect(result.tokens).toHaveProperty('accessToken', 'mock_access_token');
            expect(result.tokens).toHaveProperty('refreshToken', 'mock_refresh_token');
            expect(result.user).toHaveProperty('email', 'test@serenova.app');
        });

        it('devrait jeter une erreur si l\'utilisateur n\'existe pas', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(authService.login({ email: 'wrong@serenova.app', password: 'pass' })).rejects.toMatchObject({
                statusCode: 401,
                message: 'Identifiants incorrects.',
            });
        });

        it('devrait jeter une erreur si le mot de passe est incorrect', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(authService.login({ email: 'test@serenova.app', password: 'wrongpass' })).rejects.toMatchObject({
                statusCode: 401,
                message: 'Identifiants incorrects.',
            });
        });
    });

    describe('register', () => {
        it('devrait créer un nouvel utilisateur et retourner les tokens', async () => {
            const input = {
                email: 'new@serenova.app',
                password: 'Password123!',
                firstName: 'New',
                lastName: 'User',
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
            (prisma.user.create as jest.Mock).mockResolvedValue({
                id: 'user_456',
                ...input,
                passwordHash: 'new_hashed_password',
                role: 'GESTIONNAIRE',
            });
            (jwt.sign as jest.Mock).mockReturnValue('mock_token');

            const result = await authService.register(input);

            expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ email: 'new@serenova.app' })
            }));
            expect(result.tokens).toHaveProperty('accessToken');
            expect(result.user).toHaveProperty('id', 'user_456');
        });

        it('devrait jeter une erreur si l\'email existe déjà', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const input = {
                email: 'test@serenova.app',
                password: 'Password123!',
                firstName: 'New',
                lastName: 'User',
            };

            await expect(authService.register(input)).rejects.toMatchObject({
                statusCode: 409,
                message: 'Un utilisateur avec cet email existe déjà.',
            });
        });
    });
});
