import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { RegisterInput, LoginInput } from './auth.schema';

const SALT_ROUNDS = 10;

export const authService = {
    async register(data: RegisterInput) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw { statusCode: 409, message: 'Un utilisateur avec cet email existe déjà.' };
        }

        const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                role: 'GESTIONNAIRE', // Rôle par défaut selon specs
            },
        });

        const accessToken = this.generateToken(user.id, user.role, 'access', user.organisationId || undefined);
        const refreshToken = this.generateToken(user.id, user.role, 'refresh', user.organisationId || undefined);

        return {
            user: this.excludePassword(user),
            tokens: {
                accessToken,
                refreshToken,
            },
        };
    },

    async login(data: LoginInput) {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            throw { statusCode: 401, message: 'Identifiants incorrects.' };
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

        if (!isPasswordValid) {
            throw { statusCode: 401, message: 'Identifiants incorrects.' };
        }

        const accessToken = this.generateToken(user.id, user.role, 'access', user.organisationId || undefined);
        const refreshToken = this.generateToken(user.id, user.role, 'refresh', user.organisationId || undefined);

        return {
            user: this.excludePassword(user),
            tokens: {
                accessToken,
                refreshToken,
            },
        };
    },

    async refresh(refreshToken: string) {
        try {
            const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as { sub: string; role: string; type: string; organisationId?: string };

            if (decoded.type !== 'refresh') {
                throw { statusCode: 401, message: 'Token de rafraîchissement invalide.' };
            }

            const user = await prisma.user.findUnique({
                where: { id: decoded.sub },
            });

            if (!user) {
                throw { statusCode: 401, message: 'Utilisateur non trouvé.' };
            }

            const newAccessToken = this.generateToken(user.id, user.role, 'access', user.organisationId || undefined);
            const newRefreshToken = this.generateToken(user.id, user.role, 'refresh', user.organisationId || undefined);

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            };
        } catch (error) {
            throw { statusCode: 401, message: 'Session expirée ou invalide. Veuillez vous reconnecter.' };
        }
    },

    generateToken(userId: string, role: string, type: 'access' | 'refresh', organisationId?: string): string {
        const expiresIn = type === 'access' ? env.JWT_EXPIRES_IN : env.JWT_REFRESH_EXPIRES_IN;
        return jwt.sign(
            { sub: userId, role, type, organisationId },
            env.JWT_SECRET,
            { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
        );
    },

    excludePassword<User extends { passwordHash: string }>(user: User): Omit<User, 'passwordHash'> {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },
};
