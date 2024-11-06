// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController';
import passport from 'passport';

const router = Router();
const authController = container.resolve(AuthController);

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/protected', 
    passport.authenticate('jwt', { session: false }), 
    authController.protectedRoute
);

export default router;