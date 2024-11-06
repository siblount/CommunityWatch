import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import IAuthenticationService from '@/interfaces/services/IAuthenticationService';
import { IUser } from '@shared/models';

interface JwtPayload {
    userId: string;
    email: string;
}

export const configurePassport = (authService: IAuthenticationService): void => {
    // Serialize user for the session
    passport.serializeUser((user: Express.User, done) => {
        done(null, (user as IUser).id);
    });

    // Deserialize user from the session
    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await authService.findUserById(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });

    // Local Strategy
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, async (email: string, password: string, done) => {
        try {
            const result = await authService.login({ email, password });
            return done(null, result.user, { message: 'Logged in successfully' });
        } catch (error) {
            return done(error, false, { message: 'Invalid credentials' });
        }
    }));

    // JWT Strategy
    passport.use(new JwtStrategy({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET || 'your-secret-key'
    }, async (payload: JwtPayload, done) => {
        try {
            const user = await authService.validateToken(payload.userId);
            return done(null, user);
        } catch (error) {
            return done(error, false);
        }
    }));
};