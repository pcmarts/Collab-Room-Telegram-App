/**
 * Test script to create a Twitter co-marketing collaboration
 * 
 * Run with:
 * npx tsx test-create-twitter-collab.ts
 */

import { eq } from 'drizzle-orm';
import { db } from './server/db';
import { collaborations } from './shared/schema';
import { randomUUID } from 'crypto';

async function createTestTwitterCollaboration() {
  console.log('Creating test Twitter co-marketing collaboration...');
  
  // Sample collaboration data for Twitter co-marketing
  const twitterCollab = {
    id: randomUUID(),
    creator_id: 'b4093f49-f0c3-4bae-a294-35fb87c493eb', // Replace with your user ID if needed
    collab_type: 'Twitter Co-Marketing',
    status: 'active',
    description: 'Looking to collaborate on a Twitter thread about Web3 technology and adoption. I have a strong following in the crypto space and want to create educational content.',
    topics: ['crypto', 'web3', 'education', 'twitter'],
    date_type: 'any_future_date',
    is_free_collab: true,
    details: {
      title: 'Twitter Thread Collaboration with Growth Expert',
      host_twitter_handle: '@web3expert',
      host_follower_count: '22.5K',
      twittercomarketing_type: 'Thread Collab',
      date: 'April 2025',
      company_website: 'https://web3company.com',
      specific_requirements: 'Looking for partners with at least 5K followers who are knowledgeable about Web3 technology'
    }
  };
  
  try {
    console.log('Creating new Twitter collaboration with ID:', twitterCollab.id);
    await db.insert(collaborations)
      .values(twitterCollab)
      .execute();
    console.log('Twitter collaboration created successfully');
    
    // Create another Twitter collaboration with different details
    const twitterCollab2 = {
      id: randomUUID(),
      creator_id: 'b4093f49-f0c3-4bae-a294-35fb87c493eb', // Replace with your user ID if needed
      collab_type: 'Twitter Co-Marketing',
      status: 'active',
      description: 'Hosting a Twitter Spaces event about the latest innovations in DeFi. Looking for panelists with expertise in lending protocols and yield farming strategies.',
      topics: ['defi', 'lending', 'yield farming', 'twitter spaces'],
      date_type: 'specific_date',
      specific_date: '2025-05-15',
      is_free_collab: true,
      details: {
        title: 'Twitter Spaces Event on DeFi Innovations',
        host_twitter_handle: '@defi_master',
        host_follower_count: '45K',
        twittercomarketing_type: ['Twitter Spaces', 'Panel Discussion'],
        date: 'May 15, 2025',
        specific_requirements: 'Seeking DeFi experts with strong opinions on current market trends'
      }
    };
    
    // Create the second collaboration
    console.log('Creating second Twitter collaboration with ID:', twitterCollab2.id);
    await db.insert(collaborations)
      .values(twitterCollab2)
      .execute();
    console.log('Second Twitter collaboration created successfully');
    
    console.log('Test data creation complete!');
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

// Run the function
createTestTwitterCollaboration().catch(console.error);