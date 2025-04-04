import { z } from 'zod';

/**
 * Define the schema for configuration validation
 * 
 * This schema defines and validates all environment variables used in the application
 * to ensure proper configuration and security.
 */
const configSchema = z.object({
  // Application environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Database connection
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Security settings
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET should be at least 32 characters for security')
                   .default('secure-session-secret-for-development-only-do-not-use-in-production'),
  
  // Rate limiting settings (optional, with defaults)
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(15 * 60 * 1000), // 15 minutes by default
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().positive().default(100), // 100 requests by default
  
  // Security headers (optional, with defaults)
  ENABLE_SECURITY_HEADERS: z.coerce.boolean().default(true),
  
  // Authentication
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required').optional(),
  
  // Development fallbacks
  ALLOW_DEV_FALLBACKS: z.coerce.boolean().default(false),
  
  // CORS settings
  CORS_ALLOWED_ORIGINS: z.string().optional()
    .transform(val => val ? val.split(',') : ['https://telegram.org']),
});

// Infer the type from the schema
export type Config = z.infer<typeof configSchema>;

/**
 * Load and validate environment variables
 * This function will throw if required environment variables are missing or invalid
 */
function loadConfig(): Config {
  // Collect all environment variables
  const config = {
    // Core settings
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    
    // Authentication
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    
    // Security settings
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    ENABLE_SECURITY_HEADERS: process.env.ENABLE_SECURITY_HEADERS,
    ALLOW_DEV_FALLBACKS: process.env.ALLOW_DEV_FALLBACKS,
    CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
  };

  // Validate configuration
  try {
    // In production, we enforce stricter validation
    if (process.env.NODE_ENV === 'production') {
      // Override defaults that should not be used in production
      const prodConfig = {
        ...config,
        ALLOW_DEV_FALLBACKS: 'false', // Always disable development fallbacks in production
      };
      
      const validated = configSchema.parse(prodConfig);
      
      // Do additional production checks
      if (validated.SESSION_SECRET === 'secure-session-secret-for-development-only-do-not-use-in-production') {
        throw new Error('Using default SESSION_SECRET in production is not allowed');
      }
      
      return validated;
    } 
    // In development, we can use defaults and show warnings
    else {
      const validated = configSchema.parse(config);
      
      // Show warnings for development defaults
      if (validated.SESSION_SECRET === 'secure-session-secret-for-development-only-do-not-use-in-production') {
        console.warn('==============================================================');
        console.warn('⚠️ WARNING: Using default SESSION_SECRET for development.');
        console.warn('    THIS SHOULD NEVER BE USED IN PRODUCTION');
        console.warn('==============================================================');
      }
      
      if (validated.ALLOW_DEV_FALLBACKS) {
        console.warn('==============================================================');
        console.warn('⚠️ WARNING: Development fallbacks are ENABLED.');
        console.warn('    This allows bypassing authentication and security measures');
        console.warn('    and should NEVER be used in production.');
        console.warn('==============================================================');
      }
      
      return validated;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid configuration:');
      error.errors.forEach(err => {
        console.error(` - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('Configuration error:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}

// Export the validated configuration
export const config = loadConfig();