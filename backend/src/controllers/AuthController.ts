// backend/src/controllers/AuthController.ts
import { Request, Response, NextFunction } from 'express';
import { AuthenticationService } from '@/services/AuthenticationService';
import passport from 'passport';
import { LoginDTO, RegisterDTO } from '@shared/dto/auth.dto';

export class AuthController {
    private authService: AuthenticationService;

    constructor() {
        this.authService = new AuthenticationService();
    }

    register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const registerData: RegisterDTO = req.body;
            const result = await this.authService.register(registerData);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        passport.authenticate('local', { session: false }, async (err, user, info) => {
            if (err || !user) {
                return res.status(401).json({ message: info?.message || 'Authentication failed' });
            }
            try {
                const result = await this.authService.login({ email: req.body.email, password: req.body.password });
                res.json(result);
            } catch (error) {
                next(error);
            }
        })(req, res, next);
    };

    protectedRoute = async (req: Request, res: Response): Promise<void> => {
        res.json({ message: 'Protected route accessed successfully', user: req.user });
    };
}