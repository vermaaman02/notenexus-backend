import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage.js";
import { authService } from './auth.js';
import { insertNoteSchema, signupSchema, loginSchema } from "./shared/schema.js";
// Type-only: import type { SignupData, LoginData, InsertNote } from '../shared/schema';
import { z } from "zod";
import bcrypt from "bcryptjs";

// Session types
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

// Authentication middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.session?.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated. Please log in.' });
  }
};

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, and images are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      const user = await authService.signup(validatedData);
      
      // Set session
      req.session.userId = user._id;
      
      res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      res.status(400).json({ error: errorMessage });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await authService.login(validatedData);
      
      // Set session
      req.session.userId = user._id;
      
      res.json({ message: 'Login successful', user });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({ error: errorMessage });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: 'Could not log out' });
        return;
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logout successful' });
      return;
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
      return;
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
      return;
    }
  });

  // Platform statistics (public)
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch platform stats" });
    }
  });

  // Azure Cosmos DB connection status endpoint
  app.get('/api/db-status', async (req, res) => {
    try {
      const mongoose = await import('mongoose');
      const dbStatus = {
        isConnected: mongoose.default.connection.readyState === 1,
        database: mongoose.default.connection.db?.databaseName || 'Not connected',
        host: mongoose.default.connection.host || 'Not connected',
        port: mongoose.default.connection.port || 'Not connected',
        readyState: mongoose.default.connection.readyState,
        collections: [] as string[]
      };

      if (mongoose.default.connection.readyState === 1 && mongoose.default.connection.db) {
        const collections = await mongoose.default.connection.db.listCollections().toArray();
        dbStatus.collections = collections.map(c => c.name);
      }

      res.json(dbStatus);
    } catch (error) {
      console.error("Error checking database status:", error);
      res.status(500).json({ message: "Failed to check database status" });
    }
  });

  // Get subjects (public)
  app.get('/api/subjects', async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  // Get notes (public, with optional filtering)
  app.get('/api/notes', async (req, res) => {
    try {
      const { subject, search, limit, offset } = req.query;
      const params: any = { subject, search };
      if (typeof limit !== 'undefined') params.limit = parseInt(limit as string);
      if (typeof offset !== 'undefined') params.offset = parseInt(offset as string);
      const notes = await storage.getNotes(params);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  // Get single note (public)
  app.get('/api/notes/:id', async (req, res) => {
    try {
      const noteId = req.params.id;
      const userId = (req as any).user?.claims?.sub;
      const note = await storage.getNoteById(noteId, userId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      return res.json(note);
    } catch (error) {
      console.error("Error fetching note:", error);
      return res.status(500).json({ message: "Failed to fetch note" });
    }
  });

  // Upload note (protected)
  app.post('/api/notes', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      // Get user ID from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      // Parse and validate the note data
      const noteData = {
        ...req.body,
        tags: req.body.tags ? req.body.tags.split(',').map((tag: string) => tag.trim()) : [],
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploaderId: userId,
        isPublic: req.body.isPublic === 'true',
      };
      try {
        const validatedData = insertNoteSchema.parse(noteData);
        const note = await storage.createNote(validatedData);
        return res.status(201).json(note);
      } catch (validationError) {
        console.error("Validation error:", validationError);
        // Clean up uploaded file if validation fails
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ 
          message: "Invalid note data", 
          error: validationError instanceof Error ? validationError.message : String(validationError)
        });
      }
    } catch (error) {
      console.error("Error uploading note:", error);
      // Clean up uploaded file if any error occurs
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting file:", unlinkError);
        }
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      console.error("Error uploading note:", error);
      return res.status(500).json({ message: "Failed to upload note" });
    }
  });

  // Download note (public)
  app.get('/api/notes/:id/download', async (req, res) => {
    try {
      const noteId = req.params.id;
      const note = await storage.getNoteById(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      // Check if file exists
      if (!fs.existsSync(note.filePath)) {
        console.error(`File does not exist at path: ${note.filePath}`);
        return res.status(404).json({ message: "File not found" });
      }
      // Update download count before sending the file
      try {
        await storage.updateNoteDownloads(noteId);
        console.log(`Updated download count for note: ${noteId}`);
      } catch (updateError) {
        console.error("Error updating download count:", updateError);
        // Continue even if update fails
      }
      // Send file
      console.log(`Sending file: ${note.filePath} as ${note.fileName}`);
      return res.download(note.filePath, note.fileName, (err) => {
        if (err) {
          console.error("Error during file download:", err);
          // Only send error response if headers haven't been sent yet
          if (!res.headersSent) {
            res.status(500).json({ message: "Failed to download file" });
          }
        }
      });
    } catch (error) {
      console.error("Error downloading note:", error);
      return res.status(500).json({ message: "Failed to download note" });
    }
  });

  // Like/unlike note (protected)
  app.post('/api/notes/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const noteId = req.params.id;
      const userId = req.session.userId;
      
      const isLiked = await storage.toggleNoteLike(noteId, userId);
      res.json({ isLiked });
    } catch (error) {
      console.error("Error toggling note like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Rate note (protected)
  app.post('/api/notes/:id/rate', isAuthenticated, async (req: any, res) => {
    try {
      const noteId = req.params.id;
      const userId = req.session.userId;
      const { rating } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      await storage.rateNote(noteId, userId, rating);
      return res.json({ message: "Note rated successfully" });
    } catch (error) {
      console.error("Error rating note:", error);
      return res.status(500).json({ message: "Failed to rate note" });
    }
  });

  // Get user's notes (protected)
  app.get('/api/user/notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const notes = await storage.getUserNotes(userId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching user notes:", error);
      res.status(500).json({ message: "Failed to fetch user notes" });
    }
  });

  // Get user stats (protected)
  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Get top contributors (public)
  app.get('/api/contributors', async (req, res) => {
    try {
      const contributors = await storage.getTopContributors();
      res.json(contributors);
    } catch (error) {
      console.error("Error fetching contributors:", error);
      res.status(500).json({ message: "Failed to fetch contributors" });
    }
  });

  // Update user profile (protected)
  app.patch('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { university } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await storage.upsertUser({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        university,
      });
      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Delete note (protected)
  app.delete('/api/notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const noteId = req.params.id;
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      // Get the note to check ownership
      const note = await storage.getNoteById(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      // Check if user owns the note (or is admin in development)
      if (note.uploaderId !== userId && process.env['NODE_ENV'] !== 'development') {
        return res.status(403).json({ message: "You can only delete your own notes" });
      }
      // Delete the note
      await storage.deleteNote(noteId);
      // Also delete the physical file if it exists
      if (fs.existsSync(note.filePath)) {
        fs.unlinkSync(note.filePath);
      }
      return res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting note:", error);
      return res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Test route to check if user exists and reset (DEVELOPMENT ONLY)
  app.get('/api/test/user/:email', async (req, res) => {
    try {
      const { email } = req.params;
      const user = await storage.getUserByEmail(email);
      
      if (user) {
        res.json({ 
          exists: true, 
          user: { 
            _id: user._id, 
            email: user.email, 
            firstName: user.firstName, 
            lastName: user.lastName,
            university: user.university,
            hasPassword: !!user.password
          } 
        });
      } else {
        res.json({ exists: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Test route to reset user (DEVELOPMENT ONLY)
  app.delete('/api/test/user/:email', async (req, res) => {
    try {
      const { email } = req.params;
      // In a real app, you'd use proper delete methods
      // For now, we'll just return a message
      res.json({ message: 'User reset functionality would go here' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Add a test route to create a test user (for debugging only - remove in production)
  app.get('/api/auth/create-test-user', async (req, res) => {
    try {
      // First check if test user exists
      const existingUser = await storage.getUserByEmail('test@example.com');
      if (existingUser) {
        return res.json({ 
          message: 'Test user already exists',
          user: { 
            email: existingUser.email,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName
          }
        });
      }
      // Create test user with known credentials
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userId = 'test-user-' + Date.now();
      const user = await storage.createUser({
        id: userId,
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        university: 'Test University',
      });
      return res.status(201).json({ 
        message: 'Test user created successfully', 
        credentials: {
          email: 'test@example.com',
          password: 'password123'
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create test user';
      return res.status(500).json({ error: errorMessage });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
