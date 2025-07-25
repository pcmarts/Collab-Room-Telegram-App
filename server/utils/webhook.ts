import axios from 'axios';
import { db } from '../db';
import { collaborations, companies, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface WebhookPayload {
  collaboration_id: string;
  collab_type: string;
  collab_description: string;
  collab_date: string | null;
  collab_date_type: string;
  collab_details: any;
  company_name: string;
  company_twitter_url: string;
  company_twitter_handle: string;
  company_linkedin_url: string;
  company_logo_url: string;
  creator_name: string;
  created_at: string;
}

export async function sendCollaborationWebhook(collaborationId: string) {
  try {
    console.log(`[Webhook] Preparing to send webhook for collaboration ${collaborationId}`);
    
    // Fetch collaboration with creator and company details
    const result = await db
      .select({
        collaboration: collaborations,
        company: companies,
        user: users
      })
      .from(collaborations)
      .leftJoin(users, eq(collaborations.creator_id, users.id))
      .leftJoin(companies, eq(companies.user_id, users.id))
      .where(eq(collaborations.id, collaborationId))
      .limit(1);
    
    if (!result.length) {
      console.error(`[Webhook] Collaboration ${collaborationId} not found`);
      return;
    }
    
    const { collaboration, company, user } = result[0];
    
    if (!collaboration || !company || !user) {
      console.error(`[Webhook] Missing data for collaboration ${collaborationId}`);
      return;
    }
    
    // Build webhook payload
    const payload: WebhookPayload = {
      collaboration_id: collaboration.id,
      collab_type: collaboration.collab_type,
      collab_description: collaboration.description || '',
      collab_date: collaboration.specific_date || null,
      collab_date_type: collaboration.date_type || 'any_future_date',
      collab_details: collaboration.details || {},
      company_name: company.name,
      company_twitter_url: company.twitter_handle ? `https://x.com/${company.twitter_handle.replace('@', '')}` : '',
      company_twitter_handle: company.twitter_handle || '',
      company_linkedin_url: company.linkedin_url || '',
      company_logo_url: company.logo_url || '',
      creator_name: `${user.first_name} ${user.last_name || ''}`.trim(),
      created_at: collaboration.created_at?.toISOString() || new Date().toISOString()
    };
    
    console.log('[Webhook] Sending payload:', JSON.stringify(payload, null, 2));
    
    // Send webhook to the specified URL
    const webhookUrl = 'https://paulsworkspace.app.n8n.cloud/webhook-test/1d92b7d4-9a9b-4211-bc0a-53dc8d4c5aaa';
    
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log(`[Webhook] Successfully sent webhook for collaboration ${collaborationId}. Status: ${response.status}`);
    
  } catch (error) {
    console.error(`[Webhook] Failed to send webhook for collaboration ${collaborationId}:`, error);
    // Don't throw - we don't want webhook failures to break collaboration creation
  }
}

// Function to send test webhook with latest Alchemy collaboration
export async function sendTestWebhookForAlchemy() {
  try {
    console.log('[Webhook Test] Looking for latest Alchemy collaboration...');
    
    // Find the latest collaboration from Alchemy company
    const result = await db
      .select({
        collaboration: collaborations,
        company: companies,
        user: users
      })
      .from(collaborations)
      .leftJoin(users, eq(collaborations.creator_id, users.id))
      .leftJoin(companies, eq(companies.user_id, users.id))
      .where(eq(companies.name, 'Alchemy'))
      .orderBy(collaborations.created_at)
      .limit(1);
    
    if (!result.length) {
      console.error('[Webhook Test] No Alchemy collaborations found');
      return { success: false, message: 'No Alchemy collaborations found' };
    }
    
    const { collaboration } = result[0];
    
    if (!collaboration) {
      console.error('[Webhook Test] Invalid collaboration data');
      return { success: false, message: 'Invalid collaboration data' };
    }
    
    console.log(`[Webhook Test] Found Alchemy collaboration: ${collaboration.id}`);
    
    // Send webhook for this collaboration
    await sendCollaborationWebhook(collaboration.id);
    
    return { success: true, message: `Test webhook sent for Alchemy collaboration ${collaboration.id}` };
    
  } catch (error) {
    console.error('[Webhook Test] Error:', error);
    return { success: false, message: `Error: ${error}` };
  }
}