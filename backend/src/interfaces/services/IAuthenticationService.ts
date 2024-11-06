import { IUser } from '@shared/models';
import { LoginDTO, RegisterDTO } from '@shared/dto/auth.dto';
import { LoginResponse } from '@shared/responses/auth.responses';

export default interface IAuthenticationService {
    register(data: RegisterDTO): Promise<LoginResponse>;
    login(data: LoginDTO): Promise<LoginResponse>;
    validateToken(userId: string): Promise<IUser>;
    findUserById(id: string): Promise<IUser>;
    generateToken(user: IUser): string;
}