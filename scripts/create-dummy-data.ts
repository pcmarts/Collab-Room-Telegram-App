/**
 * Script to create dummy users and companies for testing
 * 
 * Run with:
 * npx tsx scripts/create-dummy-data.js
 */

import { db } from '../server/db';
import * as schema from '../shared/schema';
import { randomUUID } from 'crypto';

const { users, companies, ALL_COMPANY_TAGS, BLOCKCHAIN_NETWORKS, FUNDING_STAGES } = schema;

// Helper function to get random item(s) from array
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper to get random Twitter follower count as string
const getRandomTwitterFollowers = () => {
  const followerCounts = ['1.2K', '3.5K', '8.7K', '15.3K', '24.8K', '37.2K', '52.6K', '89.4K', '128K', '250K'];
  return getRandomItem(followerCounts);
};

// Helper to generate semi-realistic descriptions
const generateCompanyDescription = (companyName, tags, networks) => {
  const shortDescriptions = [
    `${companyName} is a leading provider of ${tags[0]} solutions in the ${networks[0]} ecosystem.`,
    `Building the future of ${tags[0]} on ${networks[0]}.`,
    `Pioneering ${tags[0]} infrastructure for the ${networks[0]} network.`,
    `${companyName} empowers users with innovative ${tags[0]} technology.`,
    `The premier ${tags[0]} platform on ${networks[0]}.`
  ];
  
  const longDescriptions = [
    `${companyName} is at the forefront of ${tags[0]} technology, providing cutting-edge solutions for the ${networks[0]} ecosystem. Our team of experts is dedicated to building secure, scalable, and user-friendly products that drive adoption and innovation in the blockchain space.`,
    `At ${companyName}, we're passionate about ${tags[0]} and its potential to revolutionize how people interact with ${networks[0]}. Founded in 2022, we've quickly established ourselves as industry leaders by focusing on security, usability, and performance.`,
    `${companyName} is building the next generation of ${tags[0]} applications on ${networks[0]}. Our mission is to make blockchain technology accessible to everyone through intuitive interfaces and powerful backend infrastructure.`,
    `Founded by veteran blockchain developers, ${companyName} specializes in creating enterprise-grade ${tags[0]} solutions on ${networks[0]}. We combine deep technical expertise with a user-centered design approach to deliver exceptional products.`,
    `${companyName} is revolutionizing how businesses leverage ${tags[0]} technology on ${networks[0]}. Our platform enables seamless integration of blockchain capabilities into existing systems, driving efficiency and transparency.`
  ];
  
  return {
    short: getRandomItem(shortDescriptions),
    long: getRandomItem(longDescriptions)
  };
};

// Predefined company data
const companiesData = [
  {
    name: "Crypto.com",
    jobTitles: ["Product Manager", "Marketing Director", "Business Development Lead", "Community Manager", "Head of Partnerships"],
    twitterHandle: "cryptocom",
    hasDomain: true
  },
  {
    name: "ConsenSys",
    jobTitles: ["Solutions Architect", "Product Designer", "Marketing Strategist", "Developer Relations", "Technical Writer"],
    twitterHandle: "consensys",
    hasDomain: true
  },
  {
    name: "MoonPay",
    jobTitles: ["Growth Manager", "Business Development Executive", "Partnership Lead", "Marketing Specialist", "Operations Manager"],
    twitterHandle: "moonpay",
    hasDomain: true
  },
  {
    name: "HypeLab",
    jobTitles: ["Creative Director", "Marketing Lead", "Content Strategist", "Community Manager", "Social Media Manager"],
    twitterHandle: "hypelab_io",
    hasDomain: true
  },
  {
    name: "Chainlink Labs",
    jobTitles: ["Product Manager", "Technical Evangelist", "Research Analyst", "Integration Specialist", "Developer Advocate"],
    twitterHandle: "chainlinklabs",
    hasDomain: true
  },
  {
    name: "Circle",
    jobTitles: ["Business Development Manager", "Policy Advisor", "Financial Analyst", "Product Lead", "Strategic Partnerships"],
    twitterHandle: "circle",
    hasDomain: true
  },
  {
    name: "Pudgy Penguins",
    jobTitles: ["Brand Manager", "NFT Strategist", "Community Lead", "Metaverse Designer", "Content Creator"],
    twitterHandle: "pudgypenguins",
    hasDomain: true
  },
  {
    name: "Pizza Ninjas",
    jobTitles: ["Game Designer", "Community Manager", "Tokenomics Specialist", "Narrative Designer", "Marketing Coordinator"],
    twitterHandle: "pizzaninjas",
    hasDomain: true
  },
  {
    name: "Enjin",
    jobTitles: ["Product Manager", "Game Integration Specialist", "Ecosystem Developer", "Community Lead", "Marketing Director"],
    twitterHandle: "enjin",
    hasDomain: true
  },
  {
    name: "OpenSea",
    jobTitles: ["NFT Curator", "Marketplace Strategist", "Business Development", "Artist Relations", "Platform Manager"],
    twitterHandle: "opensea",
    hasDomain: true
  }
];

// Generate 10 random users with companies
const generateUsers = async () => {
  console.log("Generating 10 dummy users with companies...");
  
  const dummyUsers = [];
  
  for (let i = 0; i < 10; i++) {
    // Select company from predefined list
    const company = companiesData[i];
    const userId = randomUUID();
    const telegramId = (1000000000 + i).toString();
    
    // Generate random blockchain networks for company (2-5)
    const blockchainNetworks = getRandomItems(BLOCKCHAIN_NETWORKS, Math.floor(Math.random() * 3) + 2);
    
    // Generate random tags for company (2-4)
    const tags = getRandomItems(ALL_COMPANY_TAGS, Math.floor(Math.random() * 2) + 2);
    
    // Generate company descriptions
    const descriptions = generateCompanyDescription(company.name, tags, blockchainNetworks);
    
    // Random funding stage
    const fundingStage = getRandomItem(FUNDING_STAGES);
    
    // Determine if has token (higher chance for larger companies)
    const hasToken = Math.random() < 0.6; // 60% chance of having a token
    const tokenTicker = hasToken ? company.name.substring(0, 3).toUpperCase() : null;
    
    // Generate first name, last name
    const firstNames = ["Alex", "Jamie", "Taylor", "Jordan", "Casey", "Morgan", "Riley", "Avery", "Cameron", "Reese"];
    const lastNames = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor"];
    
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const handle = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}`;
    
    // User data
    const userData = {
      id: userId,
      telegram_id: telegramId,
      first_name: firstName,
      last_name: lastName,
      handle: handle,
      linkedin_url: `https://linkedin.com/in/${handle}`,
      email: `${handle}@example.com`,
      referral_code: `REF${Math.floor(Math.random() * 10000)}`,
      twitter_url: `https://twitter.com/${handle}`,
      twitter_followers: getRandomTwitterFollowers(),
      is_approved: true,
      is_admin: i === 0, // Make the first user an admin
      applied_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Random date within last 30 days
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) // Random date within last 30 days
    };
    
    // Company data
    const companyRecord = {
      id: randomUUID(),
      user_id: userId,
      name: company.name,
      short_description: descriptions.short,
      long_description: descriptions.long,
      website: company.hasDomain ? `https://${company.name.toLowerCase().replace(/\s+/g, "")}.com` : `https://${company.name.toLowerCase().replace(/\s+/g, "")}.io`,
      job_title: getRandomItem(company.jobTitles),
      twitter_handle: company.twitterHandle,
      twitter_followers: getRandomTwitterFollowers(),
      linkedin_url: `https://linkedin.com/company/${company.name.toLowerCase().replace(/\s+/g, "")}`,
      funding_stage: fundingStage,
      has_token: hasToken,
      token_ticker: tokenTicker,
      blockchain_networks: blockchainNetworks,
      tags: tags,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) // Random date within last 30 days
    };
    
    dummyUsers.push({
      user: userData,
      company: companyRecord
    });
  }
  
  // Insert users and companies into database
  for (const data of dummyUsers) {
    try {
      console.log(`Creating user: ${data.user.first_name} ${data.user.last_name} (${data.company.name})`);
      
      // Insert user
      await db.insert(users).values(data.user);
      
      // Insert company
      await db.insert(companies).values(data.company);
      
    } catch (error) {
      console.error(`Error creating user ${data.user.first_name} ${data.user.last_name}:`, error);
    }
  }
  
  console.log("Dummy data generation complete!");
};

// Run the main function
generateUsers()
  .then(() => {
    console.log("Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });