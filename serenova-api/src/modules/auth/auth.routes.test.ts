import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';

// Mock de Prisma
jest.mock('../../config/database', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));

// Mock du Scheduler pour éviter les open handles (timers Redis/Bull)
jest.mock('../../jobs/scheduler', () => ({
    initScheduler: jest.fn(),
    stopScheduler: jest.fn(),
}));

// Mock des notifications
jest.mock('../../services/notifications.service', () => ({
    notifyBailOwner: jest.fn().mockResolvedValue(true),
    sendToDevice: jest.fn().mockResolvedValue(true),
}));

describe('Auth Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('devrait retourner 201 lors d\'une inscription réussie', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.user.create as jest.Mock).mockResolvedValue({
                id: '123',
                email: 'test@serenova.app',
                firstName: 'John',
                lastName: 'Doe',
                role: 'GESTIONNAIRE',
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@serenova.app',
                    password: 'Password123!',
                    firstName: 'John',
                    lastName: 'Doe',
                });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.tokens).toHaveProperty('accessToken');
        });

        it('devrait retourner 400 si les données sont invalides', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalide-email',
                    password: 'short',
                });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('error');
        });
    });

    describe('POST /api/auth/login', () => {
        it('devrait retourner 200 et un token si login correct', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: '123',
                email: 'test@serenova.app',
                passwordHash: 'hashed',
                firstName: 'John',
                lastName: 'Doe',
                role: 'GESTIONNAIRE',
            });
            // Mock bcrypt globalement
            (bcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(true);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@serenova.app',
                    password: 'Password123!',
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.tokens).toHaveProperty('accessToken');
        });

        it('devrait retourner 401 si identifiants incorrects', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong@serenova.app',
                    password: 'Password123!',
                });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Identifiants incorrects.');
        });
    });
});
