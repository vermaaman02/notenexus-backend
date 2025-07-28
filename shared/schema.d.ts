import mongoose from 'mongoose';
import { z } from 'zod';
export declare const User: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<{
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    profileImageUrl?: string | null;
    university?: string | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    profileImageUrl?: string | null;
    university?: string | null;
}, {}> & {
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    profileImageUrl?: string | null;
    university?: string | null;
} & Required<{
    _id: string;
}> & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    profileImageUrl?: string | null;
    university?: string | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    profileImageUrl?: string | null;
    university?: string | null;
}>, {}> & mongoose.FlatRecord<{
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    profileImageUrl?: string | null;
    university?: string | null;
}> & Required<{
    _id: string;
}> & {
    __v: number;
}>>;
export declare const Note: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
    title: string;
    subject: string;
    tags: string[];
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    uploaderId: string;
    isPublic: boolean;
    downloads: number;
    likes: number;
    rating: number;
    ratingCount: number;
    university?: string | null;
    description?: string | null;
    course?: string | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    title: string;
    subject: string;
    tags: string[];
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    uploaderId: string;
    isPublic: boolean;
    downloads: number;
    likes: number;
    rating: number;
    ratingCount: number;
    university?: string | null;
    description?: string | null;
    course?: string | null;
}, {}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    title: string;
    subject: string;
    tags: string[];
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    uploaderId: string;
    isPublic: boolean;
    downloads: number;
    likes: number;
    rating: number;
    ratingCount: number;
    university?: string | null;
    description?: string | null;
    course?: string | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    title: string;
    subject: string;
    tags: string[];
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    uploaderId: string;
    isPublic: boolean;
    downloads: number;
    likes: number;
    rating: number;
    ratingCount: number;
    university?: string | null;
    description?: string | null;
    course?: string | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
    title: string;
    subject: string;
    tags: string[];
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    uploaderId: string;
    isPublic: boolean;
    downloads: number;
    likes: number;
    rating: number;
    ratingCount: number;
    university?: string | null;
    description?: string | null;
    course?: string | null;
}>, {}> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
    title: string;
    subject: string;
    tags: string[];
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    uploaderId: string;
    isPublic: boolean;
    downloads: number;
    likes: number;
    rating: number;
    ratingCount: number;
    university?: string | null;
    description?: string | null;
    course?: string | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const NoteLike: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<{
    createdAt: NativeDate;
    noteId: mongoose.Types.ObjectId;
    userId: string;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    noteId: mongoose.Types.ObjectId;
    userId: string;
}, {}> & {
    createdAt: NativeDate;
    noteId: mongoose.Types.ObjectId;
    userId: string;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    createdAt: NativeDate;
    noteId: mongoose.Types.ObjectId;
    userId: string;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    noteId: mongoose.Types.ObjectId;
    userId: string;
}>, {}> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    noteId: mongoose.Types.ObjectId;
    userId: string;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const NoteRating: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<{
    createdAt: NativeDate;
    rating: number;
    noteId: mongoose.Types.ObjectId;
    userId: string;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    rating: number;
    noteId: mongoose.Types.ObjectId;
    userId: string;
}, {}> & {
    createdAt: NativeDate;
    rating: number;
    noteId: mongoose.Types.ObjectId;
    userId: string;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    createdAt: NativeDate;
    rating: number;
    noteId: mongoose.Types.ObjectId;
    userId: string;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    rating: number;
    noteId: mongoose.Types.ObjectId;
    userId: string;
}>, {}> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    rating: number;
    noteId: mongoose.Types.ObjectId;
    userId: string;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const upsertUserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    firstName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    lastName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    profileImageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    university: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    email?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    profileImageUrl?: string | null | undefined;
    university?: string | null | undefined;
}, {
    id: string;
    email?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    profileImageUrl?: string | null | undefined;
    university?: string | null | undefined;
}>;
export declare const insertNoteSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    subject: z.ZodString;
    course: z.ZodOptional<z.ZodString>;
    university: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    fileName: z.ZodString;
    filePath: z.ZodString;
    fileType: z.ZodString;
    fileSize: z.ZodNumber;
    uploaderId: z.ZodString;
    isPublic: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    subject: string;
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    uploaderId: string;
    isPublic: boolean;
    university?: string | undefined;
    description?: string | undefined;
    course?: string | undefined;
    tags?: string[] | undefined;
}, {
    title: string;
    subject: string;
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    uploaderId: string;
    university?: string | undefined;
    description?: string | undefined;
    course?: string | undefined;
    tags?: string[] | undefined;
    isPublic?: boolean | undefined;
}>;
export declare const insertNoteLikeSchema: z.ZodObject<{
    noteId: z.ZodString;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    noteId: string;
    userId: string;
}, {
    noteId: string;
    userId: string;
}>;
export declare const insertNoteRatingSchema: z.ZodObject<{
    noteId: z.ZodString;
    userId: z.ZodString;
    rating: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    rating: number;
    noteId: string;
    userId: string;
}, {
    rating: number;
    noteId: string;
    userId: string;
}>;
export declare const signupSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    university: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    university: string;
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    university: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type UserType = {
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string | null;
    university: string;
    isVerified?: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type NoteType = {
    _id: string;
    title: string;
    description?: string | null;
    subject: string;
    course?: string | null;
    university?: string | null;
    tags?: string[] | null;
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    uploaderId: string;
    isPublic: boolean;
    downloads: number;
    likes: number;
    rating: number;
    ratingCount: number;
    createdAt: Date;
    updatedAt: Date;
};
export type InsertNoteLike = z.infer<typeof insertNoteLikeSchema>;
export type NoteLikeType = {
    _id: string;
    noteId: string;
    userId: string;
    createdAt: Date;
};
export type InsertNoteRating = z.infer<typeof insertNoteRatingSchema>;
export type NoteRatingType = {
    _id: string;
    noteId: string;
    userId: string;
    rating: number;
    createdAt: Date;
};
export type NoteWithUploader = NoteType & {
    uploader: {
        firstName: string | null;
        lastName: string | null;
        profileImageUrl: string | null;
        university: string | null;
    };
    isLiked?: boolean;
    userRating?: number;
};
export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UserStats = {
    notesShared: number;
    totalLikes: number;
    averageRating: number;
};
//# sourceMappingURL=schema.d.ts.map