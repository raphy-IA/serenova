import { Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AuditLogger } from '../../utils/audit.logger';

const staffSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    role: z.enum(['SUPER_ADMIN', 'SUPPORT']),
    phone: z.string().optional(),
});

export const getStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Uniquement les membres sans organisationId (Staff global)
        const staff = await prisma.user.findMany({
            where: {
                organisationId: null,
                role: { in: ['SUPER_ADMIN', 'SUPPORT'] }
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({ status: 'success', data: staff });
    } catch (error) { next(error); }
};

export const createStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const validatedData = staffSchema.parse(req.body);
        const { password, ...userData } = validatedData;
        const passwordHash = await bcrypt.hash(password, 12);

        const staff = await prisma.user.create({
            data: {
                ...userData,
                passwordHash,
                organisationId: null, // Garantie d'un staff global
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
            },
        });

        await AuditLogger.log({
            userId: req.user?.id,
            action: 'CREATE_STAFF',
            entityType: 'User',
            entityId: staff.id,
            newValue: staff
        });

        res.status(201).json({ status: 'success', data: staff });
    } catch (error) { next(error); }
};

export const deleteStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (id === req.user?.id) {
            throw { statusCode: 400, message: 'Auto-suppression impossible.' };
        }

        const deletedStaff = await prisma.user.delete({ where: { id: id as string } });

        await AuditLogger.log({
            userId: req.user?.id,
            action: 'DELETE_STAFF',
            entityType: 'User',
            entityId: id as string,
            oldValue: deletedStaff
        });

        res.status(200).json({ status: 'success', message: 'Membre du staff supprimé.' });
    } catch (error) { next(error); }
};
