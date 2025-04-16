/**
 * Download and process all company logos from Twitter
 * 
 * This script:
 * 1. Fetches all companies with Twitter data
 * 2. Downloads their logo images to our server
 * 3. Updates the company logo_url to point to our local version
 * 
 * Run with:
 * npx tsx download-all-company-logos.js
 */

import { db } from './server/db.js';
import { downloadAndSaveImage } from './server/utils/image-downloader.js';

// Main function to process all companies
async function downloadAllCompanyLogos() {
  try {
    console.log('Starting company logo download process...');
    
    // Step 1: Get all companies with Twitter data that have a profile_image_url using raw SQL for reliability
    const query = `
      SELECT 
        c.id AS company_id, 
        c.name AS company_name,
        c.logo_url,
        ctd.profile_image_url 
      FROM 
        companies c
      JOIN 
        company_twitter_data ctd 
      ON 
        c.id = ctd.company_id
      WHERE 
        ctd.profile_image_url IS NOT NULL
    `;
    
    const { rows: results } = await db.query(query);
    
    if (!results || results.length === 0) {
      console.log('No companies with Twitter profile images found.');
      return;
    }
    
    console.log(`Found ${results.length} companies with Twitter profile images.`);
    
    // Step 2: Process each company
    const processedCompanies = [];
    const failedCompanies = [];
    
    for (const company of results) {
      try {
        console.log(`Processing company: ${company.company_name} (${company.company_id})`);
        console.log(`Current logo URL: ${company.logo_url}`);
        console.log(`Twitter image URL: ${company.profile_image_url}`);
        
        // Skip if the logo URL is already a local path
        if (company.logo_url && company.logo_url.startsWith('/company-logos/')) {
          console.log(`Company already has a local logo. Skipping.`);
          processedCompanies.push({
            id: company.company_id,
            name: company.company_name,
            status: 'skipped',
            reason: 'Already has local logo'
          });
          continue;
        }
        
        // Download the image
        const downloadResult = await downloadAndSaveImage(company.profile_image_url, company.company_id);
        
        if (!downloadResult.success) {
          console.warn(`Failed to download logo for ${company.company_name}: ${downloadResult.error}`);
          failedCompanies.push({
            id: company.company_id,
            name: company.company_name,
            status: 'failed',
            reason: downloadResult.error
          });
          continue;
        }
        
        // Update the company with the new local logo URL using raw SQL for reliability
        const updateQuery = `
          UPDATE companies 
          SET logo_url = $1
          WHERE id = $2
          RETURNING id, name, logo_url
        `;
        
        const { rows: updateResult } = await db.query(updateQuery, [downloadResult.publicPath, company.company_id]);
        
        if (!updateResult || updateResult.length === 0) {
          throw new Error('Failed to update company record');
        }
        
        const updatedCompany = updateResult[0];
        console.log(`Successfully updated company ${company.company_name} with local logo: ${updatedCompany.logo_url}`);
        
        processedCompanies.push({
          id: company.company_id,
          name: company.company_name,
          status: 'updated',
          oldUrl: company.logo_url,
          newUrl: updatedCompany.logo_url
        });
        
      } catch (error) {
        console.error(`Error processing company ${company.company_name}:`, error);
        failedCompanies.push({
          id: company.company_id,
          name: company.company_name,
          status: 'error',
          error: error.message
        });
      }
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total companies processed: ${results.length}`);
    console.log(`Successfully updated: ${processedCompanies.filter(c => c.status === 'updated').length}`);
    console.log(`Skipped (already have local logos): ${processedCompanies.filter(c => c.status === 'skipped').length}`);
    console.log(`Failed: ${failedCompanies.length}`);
    
    if (failedCompanies.length > 0) {
      console.log('\nFailed companies:');
      failedCompanies.forEach(company => {
        console.log(`- ${company.name} (${company.id}): ${company.reason || company.error}`);
      });
    }
    
    return {
      totalProcessed: results.length,
      updated: processedCompanies.filter(c => c.status === 'updated').length,
      skipped: processedCompanies.filter(c => c.status === 'skipped').length,
      failed: failedCompanies.length,
      processedCompanies,
      failedCompanies
    };
    
  } catch (error) {
    console.error('Error in downloadAllCompanyLogos:', error);
    throw error;
  }
}

// Run the function if this script is executed directly
// For ES modules, just run immediately
(async () => {
  try {
    await downloadAllCompanyLogos();
    process.exit(0);
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
})();

export { downloadAllCompanyLogos };