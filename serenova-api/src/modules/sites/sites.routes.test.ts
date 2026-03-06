import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import jwt from 'jsonwebtoken';

// Mock de Prisma
jest.mock('../../config/database', () => ({
    prisma: {
        site: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        }
    },
}));

// Mock du Scheduler et Notifications
jest.mock('../../jobs/scheduler', () => ({ initScheduler: jest.fn(), stopScheduler: jest.fn() }));
jest.mock('../../services/notifications.service', () => ({ notifyBailOwner: jest.fn(), sendToDevice: jest.fn() }));

describe('Sites Routes', () => {
    const mockUser = { id: 'clm123abc456def789ghi012', email: 'test@serenova.app', role: 'GESTIONNAIRE' };
    const mockToken = 'valid_token';
    const validCuid = 'clm1j8m0k000008l28z0h8l2z';

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock de la vérification du JWT pour le middleware d'auth
        jest.spyOn(jwt, 'verify').mockImplementation(() => ({
            sub: mockUser.id,
            role: mockUser.role,
            type: 'access'
        }) as any);
        // Mock de l'existence de l'utilisateur pour le middleware d'auth
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('GET /api/sites', () => {
        it('devrait retourner la liste des sites de l\'utilisateur', async () => {
            const mockSites = [{ id: validCuid, nom: 'Résidence A', userId: mockUser.id }];
            (prisma.site.findMany as jest.Mock).mockResolvedValue(mockSites);
            (prisma.site.count as jest.Mock).mockResolvedValue(1);

            const res = await request(app)
                .get('/api/sites')
                .set('Authorization', `Bearer ${mockToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.sites).toBeInstanceOf(Array);
            expect(res.body.data.sites[0]).toHaveProperty('nom', 'Résidence A');
        });

        it('devrait retourner 401 si aucun token n\'est fourni', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('No token'); });

            const res = await request(app).get('/api/sites');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/sites', () => {
        it('devrait créer un nouveau site', async () => {
            const newSiteData = {
                nom: 'Nouveau Site',
                type: 'RESIDENTIEL',
                adresse: '123 Rue Test',
                ville: 'Dakar',
                codePostal: '12345',
                pays: 'Sénégal',
                nbEspaces: 10
            };

            (prisma.site.create as jest.Mock).mockResolvedValue({ id: validCuid, ...newSiteData, userId: mockUser.id });

            const res = await request(app)
                .post('/api/sites')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(newSiteData);

            expect(res.status).toBe(201);
            expect(res.body.data).toHaveProperty('id', validCuid);
        });
    });

    describe('GET /api/sites/:id', () => {
        it('devrait retourner le détail d\'un site appartenant à l\'utilisateur', async () => {
            const mockSite = { id: validCuid, nom: 'Site Test', userId: mockUser.id };
            (prisma.site.findFirst as jest.Mock).mockResolvedValue(mockSite);

            const res = await request(app)
                .get(`/api/sites/${validCuid}`)
                .set('Authorization', `Bearer ${mockToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('nom', 'Site Test');
        });

        it('devrait retourner 404 si le site n\'existe pas ou n\'appartient pas à l\'utilisateur', async () => {
            (prisma.site.findFirst as jest.Mock).mockResolvedValue(null);

            const otherCuid = 'clm1j8m0k000008l28z0h8l2x';
            const res = await request(app)
                .get(`/api/sites/${otherCuid}`)
                .set('Authorization', `Bearer ${mockToken}`);

            expect(res.status).toBe(404);
        });
    });
});
