import { Router } from 'express';
import { announcementsController } from './announcements.controller';
import { authMiddleware, roleMiddleware } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createAnnouncementSchema, updateAnnouncementSchema } from './announcements.schema';

const router = Router();

// Route publique pour les utilisateurs connectés (lecture des annonces actives)
router.get('/active', authMiddleware as any, announcementsController.getActiveAnnouncements);

// Routes protégées (SUPER_ADMIN uniquement)
router.use(authMiddleware as any);
router.use(roleMiddleware(['SUPER_ADMIN']) as any);

router.get('/', announcementsController.getAllAnnouncements);
router.post('/', validateRequest(createAnnouncementSchema), announcementsController.createAnnouncement as any);
router.put('/:id', validateRequest(updateAnnouncementSchema), announcementsController.updateAnnouncement as any);
router.delete('/:id', announcementsController.deleteAnnouncement as any);

export default router;
