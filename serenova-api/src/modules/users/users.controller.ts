import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';

const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    role: z.enum(['ADMIN', 'GESTIONNAIRE', 'CONCIERGE', 'LECTEUR']),
    phone: z.string().optional(),
});

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const where: any = {};
        if (req.user?.organisationId) {
            where.organisationId = req.user.organisationId;
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                organisationId: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({ status: 'success', data: users });
    } catch (error) {
        next(error);
    }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const validatedData = userSchema.parse(req.body);
        const passwordHash = await bcrypt.hash(validatedData.password, 12);

        // Assigner l'organisation de l'administrateur créateur (ou de l'entité supervisée)
        const organisationId = req.user?.organisationId;

        const user = await prisma.user.create({
            data: {
                email: validatedData.email,
                passwordHash,
                firstName: validatedData.firstName,
                lastName: validatedData.lastName,
                role: validatedData.role,
                phone: validatedData.phone,
                organisationId, // Lier à l'organisation
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                organisationId: true,
            },
        });

        res.status(201).json({ status: 'success', data: user });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Empêcher de se supprimer soi-même
        if (id === req.user?.id) {
            throw { statusCode: 400, message: 'Vous ne pouvez pas supprimer votre propre compte.' };
        }

        await prisma.user.delete({ where: { id: id as string } });
        res.status(200).json({ status: 'success', message: 'Utilisateur supprimé avec succès.' });
    } catch (error) {
        next(error);
    }
};
