import { IUser } from '../models';

export interface LoginResponse {
    user: IUser;
    token: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: any;
}