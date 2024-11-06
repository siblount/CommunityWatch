export default interface IUserAuth {
    id: string;
    user_id: string;
    email: string;
    password_hash: string;
    password_reset_token?: string;
    password_reset_expires?: Date;
    created_at: Date;
    updated_at: Date;
}