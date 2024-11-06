import { Model, DataTypes, Sequelize } from 'sequelize';
import { IUser } from '@shared/models';

export class User extends Model<IUser> implements IUser {
    declare id: string;
    declare name: string;
    declare profile_picture_url?: string;
    declare personal_statement?: string;
    declare points: number;
    declare created_at: Date;
    declare updated_at: Date;
    declare deleted_at?: Date;
    declare last_login?: Date;
}

export const initUser = (sequelize: Sequelize) => {
    User.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: DataTypes.STRING,
        profile_picture_url: DataTypes.STRING,
        personal_statement: DataTypes.TEXT,
        points: DataTypes.INTEGER,
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE,
        last_login: DataTypes.DATE
    }, {
        sequelize,
        tableName: 'users',
        timestamps: true,
        paranoid: true,
        underscored: true
    });
};