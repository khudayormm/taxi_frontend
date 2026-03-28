export type UserRole = 'PASSENGER' | 'DRIVER' | 'ADMIN';

export interface TUser {
    id: number;
    userId: string;
    chatId: string;
    firstName: string;
    lastName: string | null;
    username: string;
    profilePic: string | null;
    phone: string;
    role: UserRole;
    createdAt: string;   // ISO date
    updatedAt: string;   // ISO date
    lastAccess: string;  // ISO date
}

export interface GetUserResponse {
    success: boolean;
    user: TUser;
}