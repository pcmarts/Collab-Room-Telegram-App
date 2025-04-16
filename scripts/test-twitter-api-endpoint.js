/**
 * Test script for Twitter API endpoint
 * 
 * This script tests the Twitter API endpoint by making a request to
 * the server's Twitter profile endpoint.
 * 
 * Run with:
 * node scripts/test-twitter-api-endpoint.js [username]
 */

import https from 'https';

// Get username from command line arguments or use default
const username = process.argv[2] || 'Bondexapp';

console.log(`Testing Twitter API endpoint for username: ${username}`);

// Make a request to the server's Twitter profile endpoint
const options = {
  hostname: 'localhost',
  port: 5000,
  path: `/api/twitter/profile/${encodeURIComponent(username)}`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse data:');
    try {
      const parsedData = JSON.parse(data);
      
      // Check if the request was successful
      if (parsedData.success) {
        const profile = parsedData.data;
        
        // Display summary information
        console.log('\nTwitter Profile Summary:');
        console.log('=======================');
        console.log(`Username: @${profile.username}`);
        console.log(`Display Name: ${profile.name}`);
        console.log(`Bio: ${profile.bio}`);
        console.log(`Followers: ${profile.followers.toLocaleString()}`);
        console.log(`Following: ${profile.following.toLocaleString()}`);
        console.log(`Tweets: ${profile.tweets.toLocaleString()}`);
        console.log(`Verified: ${profile.verified ? 'Yes' : 'No'}`);
        console.log(`Business Account: ${profile.isBusinessAccount ? 'Yes' : 'No'}`);
        if (profile.businessCategory) {
          console.log(`Business Category: ${profile.businessCategory}`);
        }
        
        // Print profile image URL
        console.log(`\nProfile Image: ${profile.profileImageUrl}`);
        
        // Print the link to open the profile
        console.log(`\nView profile on Twitter: https://twitter.com/${profile.username}`);
      } else {
        console.error(`Error: ${parsedData.error}`);
      }
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error(`Problem with request: ${error.message}`);
});

req.end();