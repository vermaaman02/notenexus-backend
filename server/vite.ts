import express, { type Application } from "express";
import { type Server } from "http";
import path from "path";

// Simple logging function
export const log = (message: string) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

// Setup Vite for development mode
export const setupVite = async (app: Application, server: Server) => {
  log("🔧 Setting up development mode");
  log("📝 Note: Vite dev server should be running separately on port 5173");
  log("🌐 Frontend will be served by Vite dev server");
  
  // In development, we don't serve static files from the backend
  // The frontend Vite dev server handles this
  return Promise.resolve();
};

// Serve static files in production
export const serveStatic = (app: Application) => {
  log("📦 Setting up production mode");
  
  // Serve static files from the dist directory
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  
  log(`📁 Serving static files from: ${distPath}`);
}; 