# Web3 Professional Networking Platform: Implementation Guide

This guide provides specific technical recommendations and best practices for implementing The Collab Room application. It serves as a reference for developers working on the project.

## Development Environment Setup

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- Git for version control
- Telegram Bot Token (for bot integration)
- Telegram WebApp configuration

### Recommended Tools
- VS Code with ESLint and Prettier extensions
- Insomnia or Postman for API testing
- pgAdmin for database management
- React Developer Tools browser extension

## Architectural Patterns & Best Practices

### Frontend Patterns
- **Component Composition**: Use composition over inheritance for UI components
- **Custom Hooks**: Extract reusable logic into custom hooks
- **Controlled Components**: Use controlled form components with React Hook Form
- **Lazy Loading**: Implement code splitting for improved performance
- **Error Boundaries**: Wrap key components in error boundaries
- **Compound Components**: Use compound component pattern for complex UI elements

### Backend Patterns
- **Controller-Service Pattern**: Separate route handlers from business logic
- **Middleware Composition**: Use composable middleware for cross-cutting concerns
- **Repository Pattern**: Abstract database access through a storage interface
- **Structured Logging**: Implement context-aware logging
- **Configuration Management**: Use environment variables with defaults

## Implementation Details

### 1. Database & ORM Implementation

#### Setting Up Drizzle ORM
```typescript
// server/db.ts
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@shared/schema';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });
```

#### Data Model Best Practices
- Use UUID primary keys for better distribution and security
- Include created_at timestamps on all tables
- Use proper foreign key constraints with onDelete behaviors
- Use array columns for simple lists like tags or blockchain networks
- Use JSON/JSONB columns for complex nested data

### 2. Authentication System

#### Multi-Layered Authentication
Implement a robust authentication system with multiple fallback mechanisms:

```typescript
// server/middleware/auth.ts
export const authMiddleware = async (req, res, next) => {
  try {
    // Layer 1: Check session
    if (req.session && req.session.user) {
      req.user = req.session.user;
      return next();
    }
    
    // Layer 2: Check Telegram initData
    const telegramUser = extractTelegramUser(req);
    if (telegramUser) {
      // Find or create user based on Telegram ID
      const user = await findOrCreateUser(telegramUser);
      req.user = user;
      req.session.user = user;
      return next();
    }
    
    // Layer 3: Check fallback header
    const fallbackId = req.headers['x-telegram-id'];
    if (fallbackId && typeof fallbackId === 'string') {
      const user = await findUserByTelegramId(fallbackId);
      if (user) {
        req.user = user;
        req.session.user = user;
        return next();
      }
    }
    
    // Authentication failed
    return res.status(401).json({ error: 'Unauthorized' });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};
```

### 3. Discovery System Implementation

#### Card Stack Component
Create a performant, swipeable card stack with clear separation of concerns:

```tsx
// client/src/components/discovery/CardStack.tsx
const CardStack = () => {
  const { cards, isLoading, fetchNextBatch } = useDiscoveryCards();
  const { recordSwipe } = useSwipeActions();
  
  // Load more cards when running low
  useEffect(() => {
    if (cards.length < 5 && !isLoading) {
      fetchNextBatch();
    }
  }, [cards.length, isLoading, fetchNextBatch]);
  
  const handleSwipe = async (cardId: string, direction: 'left' | 'right') => {
    await recordSwipe({
      collaboration_id: cardId,
      direction,
      timestamp: new Date().toISOString(),
    });
    
    // Pre-fetch next batch if needed
    if (cards.length < 3) {
      fetchNextBatch();
    }
  };
  
  return (
    <div className="card-stack-container">
      {isLoading && cards.length === 0 ? (
        <CardSkeleton />
      ) : cards.length === 0 ? (
        <EmptyState message="No more cards available" />
      ) : (
        <SwipeableCards
          cards={cards}
          onSwipe={handleSwipe}
          renderCard={(card) => <CollaborationCard data={card} />}
        />
      )}
    </div>
  );
};
```

#### Discovery Engine
Implement a powerful discovery engine with multi-layered filtering:

```typescript
// server/services/discovery.ts
export async function getDiscoveryCards(userId: string, options: DiscoveryOptions) {
  // Get user preferences
  const preferences = await getUserPreferences(userId);
  
  // Get already swiped cards to exclude
  const swipedCardIds = await getSwipedCardIds(userId);
  
  // Build query with filters
  let query = db
    .select()
    .from(collaborations)
    .where(notInArray(collaborations.id, swipedCardIds))
    .limit(options.limit || 10);
  
  // Apply blockchain network filters if enabled
  if (preferences.discovery_filter_blockchain_networks_enabled && 
      preferences.discovery_filter_blockchain_networks?.length) {
    query = query
      .innerJoin(companies, eq(collaborations.company_id, companies.id))
      .where(
        or(
          arrayOverlaps(
            companies.blockchain_networks, 
            preferences.discovery_filter_blockchain_networks
          ),
          arrayOverlaps(
            collaborations.required_blockchain_networks, 
            preferences.discovery_filter_blockchain_networks
          )
        )
      );
  }
  
  // Apply topic filters if enabled
  if (preferences.discovery_filter_topics_enabled && 
      preferences.discovery_filter_topics?.length) {
    query = query.where(
      arrayOverlaps(
        collaborations.topics, 
        preferences.discovery_filter_topics
      )
    );
  }
  
  // Execute query and return results
  return await query;
}
```

### 4. Notification System Implementation

#### Telegram Bot Integration
Implement a robust Telegram bot for notifications:

```typescript
// server/telegram.ts
import TelegramBot from 'node-telegram-bot-api';
import { db } from './db';
import { users, collab_notifications } from '@shared/schema';
import { eq } from 'drizzle-orm';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

export async function sendMatchNotification(userId: string, matchData: MatchNotificationData) {
  try {
    // Get user's Telegram chat ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user || !user.telegram_id) {
      throw new Error('User not found or no Telegram ID');
    }
    
    // Get user's notification preferences
    const [preferences] = await db
      .select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, userId));
    
    if (preferences && !preferences.notifications_enabled) {
      console.log(`Notifications disabled for user ${userId}`);
      return;
    }
    
    // Format notification message with HTML
    const message = `🎉 <b>New Match!</b>\n\n${matchData.userName} from <a href="${matchData.companyWebsite}">${matchData.companyName}</a> is interested in your "${matchData.collaborationTitle}" collaboration!`;
    
    // Create inline keyboard with action buttons
    const keyboard = {
      inline_keyboard: [
        [{ text: "💬 Chat with Collaborator", url: `https://t.me/${matchData.username}` }],
        [{ text: "👀 View Match Details", web_app: { url: `${process.env.WEBAPP_URL}/matches/${matchData.matchId}` } }]
      ]
    };
    
    // Send notification via Telegram
    await bot.sendMessage(user.telegram_id, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
    // Record notification in database
    await db.insert(collab_notifications).values({
      id: crypto.randomUUID(),
      user_id: userId,
      type: 'MATCH',
      title: 'New Match',
      message: `${matchData.userName} from ${matchData.companyName} is interested in your collaboration`,
      related_id: matchData.matchId,
      is_sent: true,
      created_at: new Date()
    });
    
    console.log(`Match notification sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending match notification:', error);
    // Record failed notification for retry
    await db.insert(collab_notifications).values({
      id: crypto.randomUUID(),
      user_id: userId,
      type: 'MATCH',
      title: 'New Match',
      message: `${matchData.userName} from ${matchData.companyName} is interested in your collaboration`,
      related_id: matchData.matchId,
      is_sent: false,
      created_at: new Date()
    });
  }
}
```

### 5. Blockchain Integration

#### Supporting Multiple Networks
Implement a flexible approach to blockchain network support:

```typescript
// shared/constants.ts
export const BLOCKCHAIN_NETWORK_CATEGORIES = {
  'Layer 1': [
    'Bitcoin',
    'Ethereum',
    'Solana',
    'Cardano',
    'Avalanche',
    // ...more networks
  ],
  'Layer 2': [
    'Arbitrum',
    'Optimism',
    'Polygon',
    'zkSync',
    'StarkNet',
    // ...more networks
  ],
  'Sidechains': [
    'Binance Smart Chain',
    'Gnosis Chain',
    // ...more networks
  ],
  // ...more categories
};

// Flatten for schema validation
export const BLOCKCHAIN_NETWORKS = Object.values(BLOCKCHAIN_NETWORK_CATEGORIES).flat();
```

#### Blockchain Network Selector Component
Create a user-friendly network selector:

```tsx
// client/src/components/forms/BlockchainNetworkSelector.tsx
const BlockchainNetworkSelector = ({ 
  value = [],
  onChange,
  categories = BLOCKCHAIN_NETWORK_CATEGORIES
}) => {
  return (
    <div className="network-selector">
      <Accordion type="multiple" className="w-full">
        {Object.entries(categories).map(([category, networks]) => (
          <AccordionItem key={category} value={category}>
            <AccordionTrigger className="py-2">
              <div className="flex items-center justify-between w-full">
                <span>{category}</span>
                {value && networks.some(network => value.includes(network)) && (
                  <Badge variant="secondary" className="ml-2">
                    {networks.filter(network => value.includes(network)).length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-2 py-2">
                {networks.map((network) => (
                  <div key={network} className="flex items-center space-x-2">
                    <Checkbox
                      id={`network-${network}`}
                      checked={value?.includes(network)}
                      onCheckedChange={(checked) => {
                        const newValue = checked
                          ? [...(value || []), network]
                          : (value || []).filter(n => n !== network);
                        onChange(newValue);
                      }}
                    />
                    <label htmlFor={`network-${network}`} className="text-sm cursor-pointer">
                      {network}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
```

### 6. Testing Strategy

#### Unit Testing Components
Example of testing a card component:

```typescript
// client/src/components/cards/__tests__/CollaborationCard.test.tsx
import { render, screen } from '@testing-library/react';
import { CollaborationCard } from '../CollaborationCard';

describe('CollaborationCard', () => {
  const mockData = {
    id: '123',
    title: 'Test Collaboration',
    type: 'Co-Marketing on Twitter',
    description: 'This is a test collaboration',
    company: {
      name: 'Test Company',
      logo_url: '/test-logo.png'
    },
    topics: ['Crypto', 'NFT'],
    required_blockchain_networks: ['Ethereum', 'Solana']
  };

  it('renders collaboration details correctly', () => {
    render(<CollaborationCard data={mockData} />);
    
    expect(screen.getByText('Test Collaboration')).toBeInTheDocument();
    expect(screen.getByText('Co-Marketing on Twitter')).toBeInTheDocument();
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('This is a test collaboration')).toBeInTheDocument();
  });
  
  it('displays topics correctly', () => {
    render(<CollaborationCard data={mockData} />);
    
    expect(screen.getByText('Crypto')).toBeInTheDocument();
    expect(screen.getByText('NFT')).toBeInTheDocument();
  });
  
  it('displays blockchain networks correctly', () => {
    render(<CollaborationCard data={mockData} />);
    
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('Solana')).toBeInTheDocument();
  });
});
```

#### API Testing
Example of testing the discovery API:

```typescript
// server/__tests__/discovery-api.test.ts
import request from 'supertest';
import { app } from '../index';
import { db } from '../db';
import { users, collaborations, swipes } from '@shared/schema';

// Mock authentication for testing
jest.mock('../middleware/auth', () => ({
  authMiddleware: (req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  }
}));

describe('Discovery API', () => {
  beforeAll(async () => {
    // Set up test data
    await db.insert(users).values({
      id: 'test-user-id',
      telegram_id: '12345',
      first_name: 'Test',
      last_name: 'User'
    });
    
    // Add test collaborations
    await db.insert(collaborations).values([
      {
        id: 'collab-1',
        user_id: 'other-user-id',
        title: 'Test Collab 1',
        type: 'Co-Marketing on Twitter',
        topics: ['Crypto', 'DeFi']
      },
      {
        id: 'collab-2',
        user_id: 'other-user-id',
        title: 'Test Collab 2',
        type: 'Podcast Guest Appearance',
        topics: ['NFT', 'Gaming']
      }
    ]);
  });
  
  it('returns cards that have not been swiped', async () => {
    // Record a swipe on collab-1
    await db.insert(swipes).values({
      id: 'swipe-1',
      user_id: 'test-user-id',
      collaboration_id: 'collab-1',
      direction: 'right'
    });
    
    // Get discovery cards
    const response = await request(app)
      .get('/api/discovery')
      .expect(200);
    
    // Should only return collab-2 since collab-1 was swiped
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe('collab-2');
  });
  
  it('applies filters correctly', async () => {
    // Get discovery cards with topic filter
    const response = await request(app)
      .get('/api/discovery?topics=NFT')
      .expect(200);
    
    // Should only return collab-2 which has the NFT topic
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe('collab-2');
  });
  
  afterAll(async () => {
    // Clean up test data
    await db.delete(swipes).where(eq(swipes.user_id, 'test-user-id'));
    await db.delete(collaborations).where(or(
      eq(collaborations.id, 'collab-1'),
      eq(collaborations.id, 'collab-2')
    ));
    await db.delete(users).where(eq(users.id, 'test-user-id'));
  });
});
```

## Security Best Practices

### 1. API Security
- Implement rate limiting for all endpoints
- Validate all input data using Zod schemas
- Use parameterized queries to prevent SQL injection
- Implement proper CORS configuration
- Add security headers to all responses

### 2. Authentication Security
- Use secure, HTTP-only cookies for sessions
- Implement proper session expiration
- Validate Telegram WebApp initialization data
- Use HTTPS for all communications

### 3. Data Protection
- Never log sensitive information
- Implement proper error handling to prevent information leakage
- Use prepared statements for all database queries
- Validate all input on both client and server

## Performance Optimization

### 1. Database Optimization
- Add appropriate indexes for frequently queried fields
- Use connection pooling for database connections
- Optimize queries to minimize database load
- Use transaction batching for multiple operations

### 2. Frontend Optimization
- Implement code splitting for route-based components
- Use React.memo for expensive components
- Optimize bundle size with tree shaking
- Implement proper caching with React Query

### 3. API Optimization
- Implement response compression
- Use appropriate pagination for list endpoints
- Implement caching for frequently accessed data
- Optimize response payload size

## Deployment Considerations

### Environment Variables
Required environment variables for deployment:

```
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
WEBAPP_URL=https://your-webapp-url.com

# Server
PORT=3000
NODE_ENV=production
SESSION_SECRET=your_session_secret

# Security
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Deployment Checklist
- [ ] Environment variables are properly set
- [ ] Database migrations are applied
- [ ] Static assets are optimized
- [ ] Security headers are configured
- [ ] Rate limiting is enabled
- [ ] SSL/TLS is configured
- [ ] Monitoring is set up
- [ ] Error tracking is implemented
- [ ] Backup strategy is in place