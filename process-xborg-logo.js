/**
 * Process XBorg Logo Script
 * 
 * This script downloads the XBorg logo from Twitter and saves it locally.
 * It then updates the company record to use the local logo URL.
 * 
 * Run with:
 * npx tsx process-xborg-logo.js
 */

import { db } from './server/db.js';
import { downloadAndSaveImage } from './server/utils/image-downloader.js';

async function processXBorgLogo() {
  try {
    console.log('Looking up XBorg company...');
    
    // Find the XBorg company
    const query = `
      SELECT 
        c.id AS company_id, 
        c.name AS company_name,
        c.logo_url,
        ctd.profile_image_url 
      FROM 
        companies c
      LEFT JOIN 
        company_twitter_data ctd 
      ON 
        c.id = ctd.company_id
      WHERE 
        c.name ILIKE '%XBorg%'
    `;
    
    const results = await db.execute(query);
    
    if (!results || results.length === 0) {
      console.log('XBorg company not found.');
      return { success: false, error: 'XBorg company not found' };
    }
    
    const company = results[0];
    console.log(`Found XBorg company: ${company.company_name} (${company.company_id})`);
    console.log(`Current logo URL: ${company.logo_url}`);
    
    // Use Twitter image if available, otherwise use hardcoded URL
    const imageUrl = company.profile_image_url || 'https://pbs.twimg.com/profile_images/1701203495284518912/Ujc9Oow6_400x400.jpg';
    console.log(`Image URL to download: ${imageUrl}`);
    
    // Download the image
    const downloadResult = await downloadAndSaveImage(imageUrl, company.company_id);
    
    if (!downloadResult.success) {
      console.error(`Failed to download XBorg logo: ${downloadResult.error}`);
      return { success: false, error: downloadResult.error };
    }
    
    console.log(`Successfully downloaded logo to: ${downloadResult.localPath}`);
    console.log(`Public URL: ${downloadResult.publicPath}`);
    
    // Update the company record
    const updateQuery = `
      UPDATE companies 
      SET logo_url = $1
      WHERE id = $2
      RETURNING id, name, logo_url
    `;
    
    const updateResult = await db.execute(updateQuery, [downloadResult.publicPath, company.company_id]);
    
    if (!updateResult || updateResult.length === 0) {
      console.error('Failed to update company record');
      return { success: false, error: 'Failed to update company record' };
    }
    
    const updatedCompany = updateResult[0];
    console.log(`Successfully updated XBorg with local logo: ${updatedCompany.logo_url}`);
    
    return {
      success: true,
      company: updatedCompany,
      logoUrl: downloadResult.publicPath
    };
  } catch (error) {
    console.error('Error processing XBorg logo:', error);
    return { success: false, error: error.message };
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  (async () => {
    try {
      const result = await processXBorgLogo();
      console.log('Result:', result);
      process.exit(0);
    } catch (error) {
      console.error('Script execution failed:', error);
      process.exit(1);
    }
  })();
}

export { processXBorgLogo };