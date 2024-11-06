// backend/src/tests/services/AuthenticationService.test.ts
import { AuthenticationService } from '@/services/AuthenticationService';
import { User } from '@/models/User';
import { UserAuth } from '@/models/UserAuth';
import { UserPreferences } from '@/models/UserPreferences';
import { AuthenticationError } from '@/utils/errors';
import { sequelize } from '@/config/database';
import bcrypt from 'bcrypt';

describe('AuthenticationService', () => {
    let authService: AuthenticationService;

    beforeAll(async () => {
        // Setup test database connection
        await sequelize.sync({ force: true });
    });

    beforeEach(() => {
        authService = new AuthenticationService();
    });

    afterEach(async () => {
        // Clean up database after each test
        await UserPreferences.destroy({ where: {} });
        await UserAuth.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('register', () => {
        const validRegistrationData = {
            email: 'test@example.com',
            password: 'Password123!',
            name: 'Test User'
        };

        it('should successfully register a new user', async () => {
            const result = await authService.register(validRegistrationData);

            // Check response structure
            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(typeof result.token).toBe('string');

            // Check user data
            expect(result.user.name).toBe(validRegistrationData.name);

            // Verify database entries
            const userAuth = await UserAuth.findOne({
                where: { email: validRegistrationData.email }
            });
            expect(userAuth).toBeTruthy();

            const preferences = await UserPreferences.findOne({
                where: { userId: result.user.id }
            });
            expect(preferences).toBeTruthy();
        });

        it('should throw error when email already exists', async () => {
            // First registration
            await authService.register(validRegistrationData);

            // Second registration with same email
            await expect(authService.register(validRegistrationData))
                .rejects
                .toThrow(AuthenticationError);
        });

        it('should create user with default values', async () => {
            const result = await authService.register(validRegistrationData);
            const user = await User.findByPk(result.user.id);

            expect(user?.points).toBe(0);
            expect(user?.profilePictureUrl).toBeNull();
            expect(user?.personalStatement).toBeNull();
        });
    });

    describe('login', () => {
        const testUser = {
            email: 'test@example.com',
            password: 'Password123!',
            name: 'Test User'
        };

        beforeEach(async () => {
            await authService.register(testUser);
        });

        it('should successfully login with valid credentials', async () => {
            const result = await authService.login({
                email: testUser.email,
                password: testUser.password
            });

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(result.user.name).toBe(testUser.name);
        });

        it('should throw error with invalid password', async () => {
            await expect(authService.login({
                email: testUser.email,
                password: 'wrongpassword'
            })).rejects.toThrow(AuthenticationError);
        });

        it('should throw error with non-existent email', async () => {
            await expect(authService.login({
                email: 'nonexistent@example.com',
                password: testUser.password
            })).rejects.toThrow(AuthenticationError);
        });

        it('should update last login timestamp', async () => {
            const before = new Date();
            await authService.login({
                email: testUser.email,
                password: testUser.password
            });
            const user = await User.findOne({
                include: [{ model: UserAuth, where: { email: testUser.email } }]
            });
            // backend/src/tests/services/AuthenticationService.test.ts (continued)
            expect(user?.lastLogin).toBeTruthy();
            expect(user?.lastLogin).toBeInstanceOf(Date);
            expect(user?.lastLogin).toBeGreaterThan(before);
        });
    });

    describe('validateToken', () => {
        let userId: string;

        beforeEach(async () => {
            const result = await authService.register({
                email: 'test@example.com',
                password: 'Password123!',
                name: 'Test User'
            });
            userId = result.user.id;
        });

        it('should return user for valid user ID', async () => {
            const user = await authService.validateToken(userId);
            expect(user).toBeTruthy();
            expect(user.id).toBe(userId);
        });

        it('should throw error for invalid user ID', async () => {
            const invalidId = '00000000-0000-0000-0000-000000000000';
            await expect(authService.validateToken(invalidId))
                .rejects
                .toThrow(AuthenticationError);
        });
    });

    describe('findUserById', () => {
        let userId: string;

        beforeEach(async () => {
            const result = await authService.register({
                email: 'test@example.com',
                password: 'Password123!',
                name: 'Test User'
            });
            userId = result.user.id;
        });

        it('should return user for valid ID', async () => {
            const user = await authService.findUserById(userId);
            expect(user).toBeTruthy();
            expect(user.id).toBe(userId);
            expect(user.name).toBe('Test User');
        });

        it('should throw error for invalid ID', async () => {
            const invalidId = '00000000-0000-0000-0000-000000000000';
            await expect(authService.findUserById(invalidId))
                .rejects
                .toThrow(AuthenticationError);
        });
    });

    describe('generateToken', () => {
        it('should generate valid JWT token', async () => {
            const result = await authService.register({
                email: 'test@example.com',
                password: 'Password123!',
                name: 'Test User'
            });

            const token = result.token;
            expect(token).toBeTruthy();
            expect(typeof token).toBe('string');

            // Verify token structure
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
            expect(decoded).toHaveProperty('userId');
            expect(decoded).toHaveProperty('email');
            expect(decoded).toHaveProperty('iat');
            expect(decoded).toHaveProperty('exp');
        });
    });

    describe('edge cases and security', () => {
        it('should handle password with special characters', async () => {
            const result = await authService.register({
                email: 'test@example.com',
                password: '!@#$%^&*()',
                name: 'Test User'
            });

            expect(result).toHaveProperty('token');
            
            // Verify login works with special characters
            const loginResult = await authService.login({
                email: 'test@example.com',
                password: '!@#$%^&*()'
            });

            expect(loginResult).toHaveProperty('token');
        });

        it('should handle very long passwords', async () => {
            const longPassword = 'a'.repeat(100);
            const result = await authService.register({
                email: 'test@example.com',
                password: longPassword,
                name: 'Test User'
            });

            expect(result).toHaveProperty('token');
            
            // Verify login works with long password
            const loginResult = await authService.login({
                email: 'test@example.com',
                password: longPassword
            });

            expect(loginResult).toHaveProperty('token');
        });

        it('should handle email addresses with different cases', async () => {
            await authService.register({
                email: 'Test@Example.com',
                password: 'Password123!',
                name: 'Test User'
            });

            // Should be able to login with lowercase email
            const loginResult = await authService.login({
                email: 'test@example.com',
                password: 'Password123!'
            });

            expect(loginResult).toHaveProperty('token');
        });

        it('should properly hash passwords', async () => {
            const password = 'Password123!';
            await authService.register({
                email: 'test@example.com',
                password,
                name: 'Test User'
            });

            const userAuth = await UserAuth.findOne({
                where: { email: 'test@example.com' }
            });

            // Verify password is hashed
            expect(userAuth?.passwordHash).not.toBe(password);
            // Verify hash is valid bcrypt hash
            expect(userAuth?.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/);
            // Verify password can be verified
            const isValid = await bcrypt.compare(password, userAuth?.passwordHash || '');
            expect(isValid).toBe(true);
        });

        it('should handle concurrent registrations properly', async () => {
            const promises = Array(5).fill(null).map((_, i) => 
                authService.register({
                    email: `test${i}@example.com`,
                    password: 'Password123!',
                    name: `Test User ${i}`
                })
            );

            const results = await Promise.all(promises);
            expect(results).toHaveLength(5);
            results.forEach(result => {
                expect(result).toHaveProperty('token');
                expect(result).toHaveProperty('user');
            });
        });
    });
});