// Export all shared types and schemas
export * from './schema';

// Additional frontend-specific types
export interface PlatformStats {
  totalNotes: number;
  activeUsers: number;
  subjects: number;
  universities: number;
}

export interface Subject {
  name: string;
  noteCount: number;
  icon: string;
} 