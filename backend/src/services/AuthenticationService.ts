// backend/src/services/AuthenticationService.ts
import { User } from '@/models/User';
import { UserAuth } from '@/models/UserAuth';
import { UserPreferences } from '@/models/UserPreferences';
import { LoginDTO, RegisterDTO } from '@shared/dto/auth.dto';
import { LoginResponse } from '@shared/responses/auth.responses';
import { AuthenticationError } from '@/utils/errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Transaction } from 'sequelize';
import { sequelize } from '@/config/database';

export class AuthenticationService {
    private readonly SALT_ROUNDS = 10;
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    private readonly JWT_EXPIRES_IN = '24h';

    async register(data: RegisterDTO): Promise<LoginResponse> {
        const transaction = await sequelize.transaction();

        try {
            // Check if email exists
            const existingAuth = await UserAuth.findOne({
                where: { email: data.email },
                transaction
            });

            if (existingAuth) {
                throw new AuthenticationError('Email already exists');
            }

            // Create user
            const user = await User.create({
                name: data.name,
                points: 0, // Default starting points
            }, { transaction });

            // Create user auth
            const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);
            await UserAuth.create({
                userId: user.id,
                email: data.email,
                passwordHash
            }, { transaction });

            // Create default preferences
            await UserPreferences.create({
                userId: user.id,
                notificationEmail: true,
                notificationPush: true,
                privacyDonationVisible: true,
                privacyVolunteerVisible: true,
                theme: 'light',
                language: 'en',
                timezone: 'UTC'
            }, { transaction });

            await transaction.commit();

            const token = this.generateToken(user);
            return { user, token };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async login(data: LoginDTO): Promise<LoginResponse> {
        const userAuth = await UserAuth.findOne({
            where: { email: data.email },
            include: [{ model: User }]
        });

        if (!userAuth) {
            throw new AuthenticationError('Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(data.password, userAuth.passwordHash);
        if (!isValidPassword) {
            throw new AuthenticationError('Invalid credentials');
        }

        const user = userAuth.user;
        await User.update(
            { lastLogin: new Date() },
            { where: { id: user.id } }
        );

        const token = this.generateToken(user);
        return { user, token };
    }

    async validateToken(userId: string): Promise<User> {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new AuthenticationError('User not found');
        }
        return user;
    }

    async findUserById(id: string): Promise<User> {
        const user = await User.findByPk(id);
        if (!user) {
            throw new AuthenticationError('User not found');
        }
        return user;
    }

    private generateToken(user: User): string {
        return jwt.sign(
            { userId: user.id, email: user.email },
            this.JWT_SECRET,
            { expiresIn: this.JWT_EXPIRES_IN }
        );
    }
}