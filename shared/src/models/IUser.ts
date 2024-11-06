export default interface IUser {
    id: string;
    name: string;
    profile_picture_url?: string;
    personal_statement?: string;
    points: number;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
    last_login?: Date;
}