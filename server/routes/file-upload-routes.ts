import { Router } from 'express';
import multer from 'multer';
import { storage } from '../storage';
import { supabaseStorage } from '@shared/supabase-storage';
import { z } from 'zod';
import { fileUploadSchema } from '@shared/schema';
import { randomUUID } from 'crypto';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});

const router = Router();

// Middleware to check if the user is authenticated
function requireAuth(req: any, res: any, next: any) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Check if Supabase storage is configured
router.get('/api/files/status', (req, res) => {
  const isConfigured = supabaseStorage.isConfigured();
  res.json({
    status: isConfigured ? 'available' : 'unavailable',
    message: isConfigured 
      ? 'File storage is available' 
      : 'File storage is not configured. Please check your environment variables.',
  });
});

// Get all files for a user
router.get('/api/files', requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.user.id;
    const files = await storage.getUserFileUploads(userId);
    res.json(files);
  } catch (error) {
    console.error('Error fetching user files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get files related to a specific entity (collaboration, message, etc.)
router.get('/api/files/related/:relatedId', requireAuth, async (req, res) => {
  try {
    const { relatedId } = req.params;
    const files = await storage.getFileUploadsByRelatedId(relatedId);
    res.json(files);
  } catch (error) {
    console.error(`Error fetching files for related ID ${req.params.relatedId}:`, error);
    res.status(500).json({ error: 'Failed to fetch related files' });
  }
});

// Upload a file
router.post('/api/files/upload', requireAuth, upload.single('file'), async (req: any, res) => {
  try {
    // Check if Supabase is configured
    if (!supabaseStorage.isConfigured()) {
      return res.status(503).json({ 
        error: 'File storage is not available. Please contact an administrator.' 
      });
    }

    // Validate request
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.session.user.id;
    const { category, relatedId, relatedType } = req.body;

    // Validate category
    const validationSchema = z.object({
      category: z.enum(['profile', 'company_logo', 'collaboration_attachment', 'message_attachment', 'document']),
      relatedId: z.string().uuid().optional(),
      relatedType: z.string().optional(),
    });

    try {
      validationSchema.parse({ category, relatedId, relatedType });
    } catch (validationError: any) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validationError.errors 
      });
    }

    // Create a File object from the multer buffer
    const fileBuffer = req.file.buffer;
    const fileObject = new File([fileBuffer], req.file.originalname, {
      type: req.file.mimetype,
    });

    // Generate path for the file
    const filePath = supabaseStorage.generateFilePath(fileObject, userId, category);

    // Upload to Supabase
    const publicUrl = await supabaseStorage.uploadFile(fileObject, filePath, userId);
    
    if (!publicUrl) {
      return res.status(500).json({ error: 'Failed to upload file to storage' });
    }

    // Create database record
    const fileUpload = {
      user_id: userId,
      filename: req.file.originalname,
      file_path: filePath,
      public_url: publicUrl,
      size_bytes: req.file.size,
      mime_type: req.file.mimetype,
      category: category,
      related_id: relatedId || null,
      related_type: relatedType || null,
      metadata: {
        originalName: req.file.originalname,
        encoding: req.file.encoding,
        uploadDate: new Date().toISOString(),
      },
    };

    const savedFile = await storage.createFileUpload(fileUpload);
    res.status(201).json(savedFile);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get a specific file
router.get('/api/files/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const file = await storage.getFileUpload(id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(file);
  } catch (error) {
    console.error(`Error fetching file ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Delete a file
router.delete('/api/files/:id', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;
    
    // Get the file first to check ownership
    const file = await storage.getFileUpload(id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Only allow the file owner or admin to delete
    if (file.user_id !== userId && !req.session.user.is_admin) {
      return res.status(403).json({ error: 'You do not have permission to delete this file' });
    }
    
    const deleted = await storage.deleteFileUpload(id);
    
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete file' });
    }
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error(`Error deleting file ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;