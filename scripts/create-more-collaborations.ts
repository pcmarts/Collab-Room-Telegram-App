import { db } from '../server/db.js';
import { collaborations } from '../shared/schema.js';

const collabTypes = [
  'Podcast Guest',
  'Twitter Spaces Host', 
  'Twitter Spaces Guest',
  'Blog Post Collaboration',
  'Newsletter Feature',
  'Report & Research Feature',
  'Event Speaker',
  'Webinar Host',
  'Community Partnership',
  'Content Collaboration'
];

const topics = [
  ['DeFi', 'Lending'],
  ['NFTs', 'Gaming'],
  ['Layer 2', 'Scaling'],
  ['AI', 'Machine Learning'],
  ['Web3', 'Infrastructure'],
  ['Trading', 'Analytics'],
  ['Security', 'Auditing'],
  ['DAO', 'Governance'],
  ['Metaverse', 'VR'],
  ['Privacy', 'ZK Proofs']
];

const descriptions = [
  'Looking for experts to discuss the latest trends in blockchain technology and share insights with our community.',
  'Seeking collaboration partners for an upcoming research project on Web3 adoption trends.',
  'We want to feature innovative projects in our newsletter that reaches 50K+ subscribers.',
  'Looking for thought leaders to speak at our upcoming conference about the future of DeFi.',
  'Seeking guest writers who can provide unique perspectives on cryptocurrency markets.',
  'Want to collaborate on educational content that helps newcomers understand Web3.',
  'Looking for partners to co-host events and expand our reach in the crypto community.',
  'Seeking experts for our podcast series covering blockchain innovations.',
  'We want to partner with companies that share our vision for decentralized finance.',
  'Looking for collaborators on a comprehensive guide to Web3 development tools.'
];

async function createMoreCollaborations() {
  console.log('Creating additional collaborations for testing...');
  
  // Get existing users
  const users = await db.query.users.findMany({
    with: { company: true }
  });
  
  if (users.length === 0) {
    console.log('No users found. Please run create-dummy-data.ts first.');
    return;
  }
  
  const collaborationsToCreate = [];
  
  for (let i = 0; i < 25; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomCollabType = collabTypes[Math.floor(Math.random() * collabTypes.length)];
    const randomTopics = topics[Math.floor(Math.random() * topics.length)];
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    // Create different details based on collaboration type
    let details = {};
    if (randomCollabType.includes('Podcast')) {
      details = {
        podcast_name: `${randomUser.company?.name || 'Company'} Talks`,
        podcast_link: `https://podcasts.example.com/${randomUser.company?.name?.toLowerCase()}`,
        estimated_reach: ['Under 100', '100-500', '500-1,000', '1,000-5,000', '5,000-10,000', '10,000+'][Math.floor(Math.random() * 6)]
      };
    } else if (randomCollabType.includes('Twitter')) {
      details = {
        twitter_handle: `@${randomUser.company?.name?.toLowerCase().replace(/\s+/g, '') || 'company'}`,
        host_follower_count: ['0-1K', '1K-10K', '10K-100K', '100K-500K', '500K+'][Math.floor(Math.random() * 5)]
      };
    } else if (randomCollabType.includes('Newsletter')) {
      details = {
        newsletter_name: `${randomUser.company?.name || 'Company'} Weekly`,
        subscriber_count: ['Under 1K', '1K-10K', '10K-50K', '50K-100K', '100K+'][Math.floor(Math.random() * 5)]
      };
    } else if (randomCollabType.includes('Event')) {
      details = {
        event_name: `${randomUser.company?.name || 'Company'} Summit 2025`,
        expected_attendees: ['Under 100', '100-500', '500-1,000', '1,000-5,000', '5,000+'][Math.floor(Math.random() * 5)]
      };
    }
    
    collaborationsToCreate.push({
      creator_id: randomUser.id,
      collab_type: randomCollabType,
      status: 'active',
      description: randomDescription,
      topics: randomTopics,
      details: details,
      date_type: 'any_future_date',
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
    });
  }
  
  console.log(`Creating ${collaborationsToCreate.length} collaborations...`);
  await db.insert(collaborations).values(collaborationsToCreate);
  
  console.log('Additional collaborations created successfully!');
}

createMoreCollaborations()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error creating collaborations:', error);
    process.exit(1);
  });
