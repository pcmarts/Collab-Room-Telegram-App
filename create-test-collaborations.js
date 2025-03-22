/**
 * This script adds additional test collaborations from different users
 * to demonstrate the discovery system working properly.
 * 
 * Run with:
 * npx tsx create-test-collaborations.js
 */

import { db } from './server/db.js';
import { collaborations } from './shared/schema.js';
import { randomUUID } from 'crypto';

// Include several user IDs that are not the currently logged-in user
const userIds = [
  '22222222-2222-2222-2222-222222222222', // Bob Johnson
  '33333333-3333-3333-3333-333333333333', // Charlie Brown
  '37e44941-e7b4-4cf7-8109-7747f721565a', // Alex Smith
  'ab3cdb23-e1a1-4531-bb69-7f742659451a', // Jamie Johnson
  'cd8a11f3-a934-4d1a-865a-e8f651d5b219'  // Taylor Williams
];

// Sample collaboration types
const collabTypes = [
  'Podcast Guest Appearance',
  'Twitter Spaces Guest',
  'Newsletter Feature',
  'Blog Post Feature',
  'Live Stream Guest Appearance',
  'Co-Marketing on Twitter',
  'Report & Research Feature'
];

// Create sample collaboration data
const sampleCollaborations = [
  {
    title: 'Blockchain Innovation Podcast Guest',
    details: {
      podcastName: 'Blockchain Innovation Podcast',
      shortDescription: 'Discussion about latest blockchain trends',
      estimatedReach: '10,000 listeners',
      streamingLink: 'https://podcasts.example.com/blockchain-innovation'
    },
    company_name: 'Blockchain Media',
    min_company_followers: '5000',
    min_user_followers: '1000',
    topics: ['blockchain', 'innovation', 'technology']
  },
  {
    title: 'NFT Market Trends Twitter Space',
    details: {
      topic: 'NFT Market Trends in 2025',
      hostHandle: '@nftinsights',
      hostFollowerCount: '12000'
    },
    company_name: 'NFT Insights',
    min_company_followers: '3000',
    min_user_followers: '500',
    topics: ['nft', 'crypto', 'digital-art']
  },
  {
    title: 'DeFi Weekly Newsletter Feature',
    details: {
      newsletterName: 'DeFi Weekly',
      totalSubscribers: '25000',
      newsletterUrl: 'https://defiweekly.example.com'
    },
    company_name: 'DeFi Weekly',
    min_company_followers: '8000',
    min_user_followers: '2000',
    topics: ['defi', 'finance', 'crypto']
  },
  {
    title: 'Web3 Development Blog Post',
    details: {
      blogName: 'Web3 Developers Hub',
      audience: 'Developers and entrepreneurs',
      publicationReach: '50000 monthly readers',
      websiteUrl: 'https://web3dev.example.com'
    },
    company_name: 'Web3 Developers Hub',
    min_company_followers: '10000',
    min_user_followers: '3000',
    topics: ['web3', 'development', 'blockchain']
  },
  {
    title: 'Crypto Exchange Live Stream',
    details: {
      expectedAudience: '5000 viewers',
      previousWebinarLink: 'https://webinars.example.com/crypto-exchange'
    },
    company_name: 'CryptoExchange',
    min_company_followers: '15000',
    min_user_followers: '5000',
    topics: ['crypto', 'exchange', 'trading']
  },
  {
    title: 'Layer 2 Solutions Twitter Campaign',
    details: {
      campaignGoals: 'Raise awareness about Layer 2 blockchain solutions',
      tweetFrequency: '3-5 tweets per week',
      campaignDuration: '2 weeks'
    },
    company_name: 'Layer2Solutions',
    min_company_followers: '7000',
    min_user_followers: '1500',
    topics: ['layer2', 'scaling', 'blockchain']
  },
  {
    title: 'Metaverse Research Report',
    details: {
      reportName: 'Metaverse Adoption in Enterprise',
      researchTopic: 'Metaverse integration in business operations',
      reportTargetReleaseDate: '2025-04-15',
      reportReach: '30000 professionals'
    },
    company_name: 'Metaverse Research Group',
    min_company_followers: '12000',
    min_user_followers: '4000',
    topics: ['metaverse', 'enterprise', 'virtual-reality']
  }
];

// Function to add test collaborations
async function addTestCollaborations() {
  console.log('Starting to add test collaborations...');
  
  try {
    // Insert each collaboration with a random user ID from our list
    for (let i = 0; i < sampleCollaborations.length; i++) {
      const sample = sampleCollaborations[i];
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const collabType = collabTypes[i % collabTypes.length];
      
      const newCollaboration = {
        id: randomUUID(),
        creator_id: userId,
        collab_type: collabType,
        description: `Description for ${sample.title}`,
        company_name: sample.company_name,
        min_company_followers: sample.min_company_followers,
        min_user_followers: sample.min_user_followers,
        details: JSON.stringify(sample.details),
        topics: sample.topics,
        required_token_status: Math.random() > 0.5, // Random boolean
        required_funding_stages: ['Seed', 'Series A'],
        company_blockchain_networks: ['Ethereum', 'Solana'],
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        // Required fields not present in original schema
        is_free_collab: true,
        date_type: 'any_future_date'
      };
      
      await db.insert(collaborations).values(newCollaboration);
      console.log(`Added collaboration: ${sample.title} from user ${userId}`);
    }
    
    console.log('Successfully added all test collaborations!');
  } catch (error) {
    console.error('Error adding test collaborations:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
addTestCollaborations();