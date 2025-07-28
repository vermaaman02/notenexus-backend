import {
  User,
  Note,
  NoteLike,
  NoteRating
} from "./shared/schema.js";
import { connectToDatabase } from "./db";
import mongoose from "mongoose";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<UserType | undefined>;
  getUserByEmail(email: string): Promise<UserType | undefined>;
  createUser(user: { id: string; email: string; password: string; firstName: string; lastName: string; university: string }): Promise<UserType>;
  upsertUser(user: UpsertUser): Promise<UserType>;
  
  // Note operations
  createNote(note: InsertNote): Promise<NoteType>;
  getNotes(params?: { subject?: string; search?: string; limit?: number; offset?: number }): Promise<NoteWithUploader[]>;
  getNoteById(id: string, userId?: string): Promise<NoteWithUploader | undefined>;
  updateNoteDownloads(id: string): Promise<void>;
  getUserNotes(userId: string): Promise<NoteWithUploader[]>;
  deleteNote(id: string): Promise<void>;
  
  // Like operations
  toggleNoteLike(noteId: string, userId: string): Promise<boolean>;
  
  // Rating operations
  rateNote(noteId: string, userId: string, rating: number): Promise<void>;
  
  // Statistics
  getUserStats(userId: string): Promise<UserStats>;
  getTopContributors(limit?: number): Promise<(UserType & UserStats)[]>;
  getPlatformStats(): Promise<{
    totalNotes: number;
    activeUsers: number;
    subjects: number;
    universities: number;
  }>;
  getSubjects(): Promise<{ name: string; noteCount: number; icon: string }[]>;
}

export class DatabaseStorage implements IStorage {
  private connectionPromise: Promise<typeof mongoose.connection>;
  
  constructor() {
    // Only connect to database if not using memory storage
    if (process.env['USE_MEMORY_STORAGE'] === 'true') {
      console.log('🧠 DatabaseStorage: Skipping database connection (using memory storage)');
      this.connectionPromise = Promise.resolve(mongoose.connection);
    } else {
      // Ensure database connection is established and stored
      this.connectionPromise = connectToDatabase();
    }
  }

  async getUser(id: string): Promise<UserType | undefined> {
    await this.connectionPromise;
    const UserModel = require('mongoose').models['User'];
    const user = await UserModel.findById(id).lean();
    return user ? this.mapUserDocument(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<UserType | undefined> {
    await this.connectionPromise;
    const UserModel = require('mongoose').models['User'];
    const user = await UserModel.findOne({ email }).lean();
    return user ? this.mapUserDocument(user) : undefined;
  }

  async createUser(userData: { id: string; email: string; password: string; firstName: string; lastName: string; university: string }): Promise<UserType> {
    await this.connectionPromise;
    const UserModel = require('mongoose').models['User'];
    const user = await UserModel.create({
      _id: userData.id,
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      university: userData.university,
    });
    return this.mapUserDocument(user.toObject());
  }

  async upsertUser(userData: UpsertUser): Promise<UserType> {
    await this.connectionPromise;
    const UserModel = require('mongoose').models['User'];
    const user = await UserModel.findByIdAndUpdate(
      userData.id,
      {
        $set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          university: userData.university,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          _id: userData.id,
          createdAt: new Date(),
        }
      },
      {
        upsert: true,
        new: true,
        lean: true,
      }
    );
    return this.mapUserDocument(user);
  }

  async createNote(noteData: InsertNote): Promise<NoteType> {
    await this.connectionPromise;
    
    const NoteModel = require('mongoose').models['Note'];
    const note = await NoteModel.create({
      title: noteData.title,
      description: noteData.description,
      subject: noteData.subject,
      course: noteData.course,
      university: noteData.university,
      tags: noteData.tags,
      fileName: noteData.fileName,
      filePath: noteData.filePath,
      fileType: noteData.fileType,
      fileSize: noteData.fileSize,
      uploaderId: noteData.uploaderId,
      isPublic: noteData.isPublic ?? true,
    });
    return this.mapNoteDocument(note.toObject());
  }

  async getNotes(params?: { subject?: string; search?: string; limit?: number; offset?: number }): Promise<NoteWithUploader[]> {
    await this.connectionPromise;
    const { subject, search, limit = 50, offset = 0 } = params || {};
    const query: any = { isPublic: true };
    if (subject) query.subject = subject;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { course: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }
    const NoteModel = require('mongoose').models['Note'];
    const notes: any[] = await NoteModel.find(query)
      .populate('uploaderId', 'firstName lastName profileImageUrl university')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();
    return notes.map((note: any) => this.mapNoteWithUploader(note));
  }

  async getNoteById(id: string, userId?: string): Promise<NoteWithUploader | undefined> {
    await connectToDatabase();
    const NoteModel = require('mongoose').models['Note'];
    const note = await NoteModel.findById(id)
      .populate('uploaderId', 'firstName lastName profileImageUrl university')
      .lean();

    if (!note) return undefined;

    const mappedNote = this.mapNoteWithUploader(note);

    if (userId) {
      // Check if user liked this note
      const NoteLikeModel = require('mongoose').models['NoteLike'];
      const like = await NoteLikeModel.findOne({ noteId: id, userId }).lean();
      mappedNote.isLiked = !!like;

      // Check user's rating
      const NoteRatingModel = require('mongoose').models['NoteRating'];
      const rating = await NoteRatingModel.findOne({ noteId: id, userId }).lean();
      mappedNote.userRating = (rating as any)?.rating;
    }

    return mappedNote;
  }

  async updateNoteDownloads(id: string): Promise<void> {
    await connectToDatabase();
    const NoteModel = require('mongoose').models['Note'];
    await NoteModel.findByIdAndUpdate(id, { $inc: { downloads: 1 } });
  }

  async deleteNote(id: string): Promise<void> {
    await connectToDatabase();
    const NoteModel = require('mongoose').models['Note'];
    await NoteModel.findByIdAndDelete(id);
  }

  async getUserNotes(userId: string): Promise<NoteWithUploader[]> {
    await connectToDatabase();
    const NoteModel = require('mongoose').models['Note'];
    const notes: any[] = await NoteModel.find({ uploaderId: userId })
      .populate('uploaderId', 'firstName lastName profileImageUrl university')
      .sort({ createdAt: -1 })
      .lean();
    return notes.map((note: any) => this.mapNoteWithUploader(note));
  }

  async toggleNoteLike(noteId: string, userId: string): Promise<boolean> {
    await connectToDatabase();
    const NoteLikeModel = require('mongoose').models['NoteLike'];
    const NoteModel = require('mongoose').models['Note'];
    const existingLike = await NoteLikeModel.findOne({ noteId, userId });

    if (existingLike) {
      // Remove like
      await NoteLikeModel.deleteOne({ noteId, userId });
      await NoteModel.findByIdAndUpdate(noteId, { $inc: { likes: -1 } });
      return false;
    } else {
      // Add like
      await NoteLikeModel.create({ noteId, userId });
      await NoteModel.findByIdAndUpdate(noteId, { $inc: { likes: 1 } });
      return true;
    }
  }

  async rateNote(noteId: string, userId: string, rating: number): Promise<void> {
    await connectToDatabase();
    const NoteRatingModel = require('mongoose').models['NoteRating'];
    const NoteModel = require('mongoose').models['Note'];
    const existingRating = await NoteRatingModel.findOne({ noteId, userId });
    if (existingRating) {
      // Update existing rating
      await NoteRatingModel.findOneAndUpdate({ noteId, userId }, { rating });
    } else {
      // Create new rating
      await NoteRatingModel.create({ noteId, userId, rating });
      await NoteModel.findByIdAndUpdate(noteId, { $inc: { ratingCount: 1 } });
    }
    // Recalculate average rating
    const ratings: any[] = await NoteRatingModel.find({ noteId }).lean();
    const avgRating = ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length;
    await NoteModel.findByIdAndUpdate(noteId, { rating: Math.round(avgRating) });
  }

  async getUserStats(userId: string): Promise<UserStats> {
    await connectToDatabase();
    const NoteModel = require('mongoose').models['Note'];
    const notes: any[] = await NoteModel.find({ uploaderId: userId }).lean();
    const notesShared = notes.length;
    const totalLikes = notes.reduce((sum: number, note: any) => sum + (note.likes || 0), 0);
    const totalRating = notes.reduce((sum: number, note: any) => sum + (note.rating || 0), 0);
    const averageRating = notesShared > 0 ? Math.round((totalRating / notesShared) * 10) / 10 : 0;
    return { notesShared, totalLikes, averageRating };
  }

  async getTopContributors(limit = 4): Promise<(UserType & UserStats)[]> {
    await connectToDatabase();
    const UserModel = require('mongoose').models['User'];
    const users: any[] = await UserModel.find().lean();
    const usersWithStats = await Promise.all(
      users.map(async (user: any) => ({
        ...this.mapUserDocument(user),
        ...(await this.getUserStats((user._id as any).toString())),
      }))
    );
    return usersWithStats
      .filter((user: any) => user.notesShared > 0)
      .sort((a: any, b: any) => {
        if (b.notesShared !== a.notesShared) {
          return b.notesShared - a.notesShared;
        }
        return b.totalLikes - a.totalLikes;
      })
      .slice(0, limit);
  }

  async getPlatformStats(): Promise<{
    totalNotes: number;
    activeUsers: number;
    subjects: number;
    universities: number;
  }> {
    await connectToDatabase();
    const NoteModel = require('mongoose').models['Note'];
    const [totalNotes, activeUsers, subjects, universities] = await Promise.all([
      NoteModel.countDocuments(),
      NoteModel.distinct('uploaderId').then((ids: any[]) => ids.length),
      NoteModel.distinct('subject').then((subjects: any[]) => subjects.length),
      NoteModel.distinct('university').then((unis: any[]) => unis.filter(Boolean).length),
    ]);
    return { totalNotes, activeUsers, subjects, universities };
  }

  async getSubjects(): Promise<{ name: string; noteCount: number; icon: string }[]> {
    await connectToDatabase();
    const NoteModel = require('mongoose').models['Note'];
    const subjectCounts: any[] = await NoteModel.aggregate([
      { $match: { isPublic: true } },
      { $group: { _id: '$subject', noteCount: { $sum: 1 } } },
      { $sort: { noteCount: -1 } }
    ]);
    const subjectIcons: Record<string, string> = {
      'Data Structures': 'TreePine',
      'Algorithms': 'Zap',
      'Database Systems': 'Database',
      'Operating Systems': 'Monitor',
      'Computer Networks': 'Network',
      'Software Engineering': 'Code2',
      'Web Development': 'Globe',
      'Machine Learning': 'Brain',
      'Cybersecurity': 'Shield',
      'Programming Languages': 'Code',
      'Computer Graphics': 'Palette',
      'Artificial Intelligence': 'Bot',
    };
    return subjectCounts.map(({ _id: name, noteCount }: { _id: string; noteCount: number }) => ({
      name,
      noteCount,
      icon: subjectIcons[name] || 'BookOpen',
    }));
  }

  // Helper methods to map MongoDB documents to our TypeScript types
  private mapUserDocument(doc: any): UserType {
    return {
      _id: doc._id,
      email: doc.email || null,
      password: doc.password || null,
      firstName: doc.firstName || null,
      lastName: doc.lastName || null,
      profileImageUrl: doc.profileImageUrl || null,
      university: doc.university || null,
      isVerified: doc.isVerified || false,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private mapNoteDocument(doc: any): NoteType {
    return {
      _id: doc._id.toString(),
      title: doc.title,
      description: doc.description || null,
      subject: doc.subject,
      course: doc.course || null,
      university: doc.university || null,
      tags: doc.tags || null,
      fileName: doc.fileName,
      filePath: doc.filePath,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      uploaderId: doc.uploaderId,
      isPublic: doc.isPublic,
      downloads: doc.downloads,
      likes: doc.likes,
      rating: doc.rating,
      ratingCount: doc.ratingCount,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private mapNoteWithUploader(doc: any): NoteWithUploader {
    const uploader = doc.uploaderId || {};
    return {
      ...this.mapNoteDocument(doc),
      uploader: {
        firstName: uploader.firstName || null,
        lastName: uploader.lastName || null,
        profileImageUrl: uploader.profileImageUrl || null,
        university: uploader.university || null,
      },
    };
  }
}

// Memory storage implementation for fallback (keeping the same interface)
export class MemStorage implements IStorage {
  private users: Map<string, UserType>;
  private notes: Map<string, NoteType>;
  private noteLikes: Map<string, InsertNoteLike>;
  private noteRatings: Map<string, InsertNoteRating>;
  private currentNoteId: number;

  constructor() {
    this.users = new Map();
    this.notes = new Map();
    this.noteLikes = new Map();
    this.noteRatings = new Map();
    this.currentNoteId = 1;
    
    // Add a default dev user for development
    this.users.set('dev-user-123', {
      _id: 'dev-user-123',
      email: 'dev@example.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
      firstName: 'Dev',
      lastName: 'User',
      profileImageUrl: null,
      university: 'Development University',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async getUser(id: string): Promise<UserType | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<UserType | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(userData: { id: string; email: string; password: string; firstName: string; lastName: string; university: string }): Promise<UserType> {
    const user: UserType = {
      _id: userData.id,
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: null,
      university: userData.university,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<UserType> {
    const existingUser = this.users.get(userData.id);
    const user: UserType = {
      _id: userData.id,
      email: userData.email || existingUser?.email || 'unknown@example.com',
      password: existingUser?.password || 'temp-password',
      firstName: userData.firstName || existingUser?.firstName || 'Unknown',
      lastName: userData.lastName || existingUser?.lastName || 'User',
      profileImageUrl: userData.profileImageUrl || existingUser?.profileImageUrl || null,
      university: userData.university || existingUser?.university || 'Unknown University',
      isVerified: existingUser?.isVerified || false,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  async createNote(noteData: InsertNote): Promise<NoteType> {
    const noteId = this.currentNoteId.toString();
    this.currentNoteId++;

    const note: NoteType = {
      _id: noteId,
      title: noteData.title,
      description: noteData.description || null,
      subject: noteData.subject,
      course: noteData.course || null,
      university: noteData.university || null,
      tags: noteData.tags || null,
      fileName: noteData.fileName,
      filePath: noteData.filePath,
      fileType: noteData.fileType,
      fileSize: noteData.fileSize,
      uploaderId: noteData.uploaderId,
      isPublic: noteData.isPublic ?? true,
      downloads: 0,
      likes: 0,
      rating: 0,
      ratingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.notes.set(noteId, note);
    return note;
  }

  async getNotes(params?: { subject?: string; search?: string; limit?: number; offset?: number }): Promise<NoteWithUploader[]> {
    const { subject, search, limit = 50, offset = 0 } = params || {};
    
    let filteredNotes = Array.from(this.notes.values()).filter(note => note.isPublic);

    if (subject) {
      filteredNotes = filteredNotes.filter(note => note.subject === subject);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredNotes = filteredNotes.filter(note =>
        note.title.toLowerCase().includes(searchLower) ||
        note.description?.toLowerCase().includes(searchLower) ||
        note.course?.toLowerCase().includes(searchLower) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return filteredNotes
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit)
      .map(note => this.enrichNoteWithUploader(note));
  }

  async getNoteById(id: string, userId?: string): Promise<NoteWithUploader | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;

    const enriched = this.enrichNoteWithUploader(note);
    if (userId) {
      const likeKey = `${id}-${userId}`;
      const ratingKey = `${id}-${userId}`;
      enriched.isLiked = this.noteLikes.has(likeKey);
      const rating = this.noteRatings.get(ratingKey)?.rating;
      if (typeof rating === 'number') {
        enriched.userRating = rating;
      } else {
        delete enriched.userRating;
      }
    }
    return enriched;
  }

  async updateNoteDownloads(id: string): Promise<void> {
    const note = this.notes.get(id);
    if (note) {
      note.downloads++;
      this.notes.set(id, note);
    }
  }

  async deleteNote(id: string): Promise<void> {
    this.notes.delete(id);
  }

  async getUserNotes(userId: string): Promise<NoteWithUploader[]> {
    return Array.from(this.notes.values())
      .filter(note => note.uploaderId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(note => this.enrichNoteWithUploader(note));
  }

  async toggleNoteLike(noteId: string, userId: string): Promise<boolean> {
    const likeKey = `${noteId}-${userId}`;
    const note = this.notes.get(noteId);
    
    if (!note) return false;

    if (this.noteLikes.has(likeKey)) {
      this.noteLikes.delete(likeKey);
      note.likes = Math.max(0, note.likes - 1);
      this.notes.set(noteId, note);
      return false;
    } else {
      this.noteLikes.set(likeKey, { noteId, userId });
      note.likes++;
      this.notes.set(noteId, note);
      return true;
    }
  }

  async rateNote(noteId: string, userId: string, rating: number): Promise<void> {
    const ratingKey = `${noteId}-${userId}`;
    const note = this.notes.get(noteId);
    
    if (!note) return;

    const existingRating = this.noteRatings.get(ratingKey);
    
    if (!existingRating) {
      note.ratingCount++;
    }

    this.noteRatings.set(ratingKey, { noteId, userId, rating });

    // Recalculate average rating
    const allRatings = Array.from(this.noteRatings.values())
      .filter(r => r.noteId === noteId);
    
    const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
    note.rating = Math.round(avgRating);
    this.notes.set(noteId, note);
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const userNotes = Array.from(this.notes.values()).filter(note => note.uploaderId === userId);
    const notesShared = userNotes.length;
    const totalLikes = userNotes.reduce((sum, note) => sum + note.likes, 0);
    const totalRating = userNotes.reduce((sum, note) => sum + note.rating, 0);
    const averageRating = notesShared > 0 ? Math.round((totalRating / notesShared) * 10) / 10 : 0;

    return { notesShared, totalLikes, averageRating };
  }

  async getTopContributors(limit = 4): Promise<(UserType & UserStats)[]> {
    const allUsers = Array.from(this.users.values());
    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => ({
        ...user,
        ...(await this.getUserStats(user._id)),
      }))
    );

    return usersWithStats
      .filter((user) => user.notesShared > 0)
      .sort((a, b) => {
        if (b.notesShared !== a.notesShared) {
          return b.notesShared - a.notesShared;
        }
        return b.totalLikes - a.totalLikes;
      })
      .slice(0, limit);
  }

  async getPlatformStats(): Promise<{
    totalNotes: number;
    activeUsers: number;
    subjects: number;
    universities: number;
  }> {
    const notes = Array.from(this.notes.values());
    const totalNotes = notes.length;
    const activeUsers = new Set(notes.map(note => note.uploaderId)).size;
    const subjects = new Set(notes.map(note => note.subject)).size;
    const universities = new Set(notes.map(note => note.university).filter(Boolean)).size;

    return { totalNotes, activeUsers, subjects, universities };
  }

  async getSubjects(): Promise<{ name: string; noteCount: number; icon: string }[]> {
    const notes = Array.from(this.notes.values()).filter(note => note.isPublic);
    const subjectCounts = new Map<string, number>();

    notes.forEach(note => {
      subjectCounts.set(note.subject, (subjectCounts.get(note.subject) || 0) + 1);
    });

    const subjectIcons: Record<string, string> = {
      'Mathematics': 'Calculator',
      'Chemistry': 'Flask',
      'Psychology': 'Brain',
      'History': 'Landmark',
      'Computer Science': 'Code',
      'Literature': 'Book',
      'Physics': 'Atom',
      'Biology': 'Dna',
      'Economics': 'TrendingUp',
      'Engineering': 'Settings',
    };

    return Array.from(subjectCounts.entries())
      .map(([name, noteCount]) => ({
        name,
        noteCount,
        icon: subjectIcons[name] || 'BookOpen',
      }))
      .sort((a, b) => b.noteCount - a.noteCount);
  }

  private enrichNoteWithUploader(note: NoteType): NoteWithUploader {
    const uploader = this.users.get(note.uploaderId);
    return {
      ...note,
      uploader: {
        firstName: uploader?.firstName || null,
        lastName: uploader?.lastName || null,
        profileImageUrl: uploader?.profileImageUrl || null,
        university: uploader?.university || null,
      }
      // userRating is omitted unless set elsewhere
    };
  }
}

// Use memory storage for development if specified, otherwise use Azure Cosmos DB
const useMemoryStorage = process.env['USE_MEMORY_STORAGE'] === 'true';
console.log(`🔧 Storage mode: ${useMemoryStorage ? 'Memory Storage' : 'Database Storage'}`);

export const storage = useMemoryStorage 
  ? new MemStorage() 
  : new DatabaseStorage();