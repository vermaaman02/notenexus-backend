import mongoose from 'mongoose';
import { z } from 'zod';

// User Schema for MongoDB/Cosmos DB
const userSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // User ID
  email: { type: String, required: true, unique: true }, // Add unique: true here
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  profileImageUrl: { type: String },
  university: { type: String },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Note Schema for MongoDB/Cosmos DB
const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: String, required: true },
  course: { type: String },
  university: { type: String },
  tags: [{ type: String }],
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploaderId: { type: String, required: true, ref: 'User' },
  isPublic: { type: Boolean, default: true },
  downloads: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Note Like Schema for MongoDB/Cosmos DB
const noteLikeSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Note' },
  userId: { type: String, required: true, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

// Note Rating Schema for MongoDB/Cosmos DB
const noteRatingSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Note' },
  userId: { type: String, required: true, ref: 'User' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
});

// Create compound indexes for better query performance
// email index is already created with unique: true in the schema
noteSchema.index({ uploaderId: 1 });
noteSchema.index({ subject: 1 });
noteSchema.index({ isPublic: 1 });
noteSchema.index({ createdAt: -1 });
noteSchema.index({ 
  title: 'text', 
  description: 'text', 
  course: 'text', 
  tags: 'text' 
});
noteLikeSchema.index({ noteId: 1, userId: 1 }, { unique: true });
noteRatingSchema.index({ noteId: 1, userId: 1 }, { unique: true });

// Export Models
export const User = mongoose.models['User'] || mongoose.model('User', userSchema);
export const Note = mongoose.models['Note'] || mongoose.model('Note', noteSchema);
export const NoteLike = mongoose.models['NoteLike'] || mongoose.model('NoteLike', noteLikeSchema);
export const NoteRating = mongoose.models['NoteRating'] || mongoose.model('NoteRating', noteRatingSchema);

// Zod Validation Schemas
export const upsertUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  profileImageUrl: z.string().url().optional().nullable(),
  university: z.string().optional().nullable(),
});

export const insertNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  course: z.string().optional(),
  university: z.string().optional(),
  tags: z.array(z.string()).optional(),
  fileName: z.string().min(1, "File name is required"),
  filePath: z.string().min(1, "File path is required"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().min(1, "File size must be greater than 0"),
  uploaderId: z.string().min(1, "Uploader ID is required"),
  isPublic: z.boolean().optional().default(true),
});

export const insertNoteLikeSchema = z.object({
  noteId: z.string().min(1, "Note ID is required"),
  userId: z.string().min(1, "User ID is required"),
});

export const insertNoteRatingSchema = z.object({
  noteId: z.string().min(1, "Note ID is required"),
  userId: z.string().min(1, "User ID is required"),
  rating: z.number().min(1).max(5),
});

// Authentication schemas
export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  university: z.string().min(1, "University is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// TypeScript Types
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

// Authentication types
export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export type UserStats = {
  notesShared: number;
  totalLikes: number;
  averageRating: number;
};