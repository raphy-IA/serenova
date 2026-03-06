import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);

    if (err instanceof ZodError) {
        return res.status(400).json({
            status: 'error',
            message: 'Erreur de validation des données',
            details: err.issues,
        });
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Erreur interne du serveur';

    res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
