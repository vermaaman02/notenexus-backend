import bcrypt from 'bcryptjs';
import { storage } from './storage.js';
// Type-only: import type { SignupData, LoginData } from '../shared/schema';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  async signup(userData: SignupData) {
    const { email, password, firstName, lastName, university } = userData;
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = uuidv4();
    const user = await storage.createUser({
      id: userId,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      university,
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  async login(credentials: LoginData) {
    const { email, password } = credentials;
    
    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();
