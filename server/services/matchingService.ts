import { 
  MarketingPreferences, 
  ConferencePreferences,
  Company,
  User
} from '@shared/schema';

// Weight configurations for different matching criteria
const MATCH_WEIGHTS = {
  companySectors: 0.25,
  twitterFollowers: 0.15,
  fundingStage: 0.20,
  tokenStatus: 0.15,
  blockchainNetworks: 0.25
} as const;

// Utility function to normalize array similarity score
const calculateArraySimilarity = (array1: string[] = [], array2: string[] = []): number => {
  if (!array1.length || !array2.length) return 0;
  const intersection = array1.filter(item => array2.includes(item));
  return intersection.length / Math.max(array1.length, array2.length);
};

// Utility function to calculate Twitter follower range compatibility
const calculateFollowerRangeScore = (range1?: string | null, range2?: string | null): number => {
  if (!range1 || !range2) return 0;

  const ranges = ["0-1K", "1K-10K", "10K-100K", "100K-500K", "500K+"];
  const index1 = ranges.indexOf(range1);
  const index2 = ranges.indexOf(range2);

  if (index1 === -1 || index2 === -1) return 0;

  // Calculate similarity based on range proximity
  const maxDiff = ranges.length - 1;
  const actualDiff = Math.abs(index1 - index2);
  return 1 - (actualDiff / maxDiff);
};

// Calculate match score between two entities based on their preferences
export const calculateMatchScore = (
  userPrefs: MarketingPreferences | ConferencePreferences,
  companyA: Company,
  userA: User,
  companyB: Company,
  userB: User
): number => {
  let totalScore = 0;

  // Company sectors matching
  if (userPrefs.company_tags && companyB.tags) {
    const sectorScore = calculateArraySimilarity(userPrefs.company_tags, companyB.tags);
    totalScore += sectorScore * MATCH_WEIGHTS.companySectors;
  }

  // Twitter followers matching (both user and company)
  const userFollowerScore = calculateFollowerRangeScore(
    userPrefs.twitter_followers || undefined,
    userB.twitter_followers || undefined
  );
  const companyFollowerScore = calculateFollowerRangeScore(
    userPrefs.company_twitter_followers || undefined,
    companyB.twitter_followers || undefined
  );
  totalScore += ((userFollowerScore + companyFollowerScore) / 2) * MATCH_WEIGHTS.twitterFollowers;

  // Funding stage matching
  const fundingStageMatch = userPrefs.funding_stage === companyB.funding_stage;
  totalScore += (fundingStageMatch ? 1 : 0) * MATCH_WEIGHTS.fundingStage;

  // Token status matching
  const tokenStatusMatch = userPrefs.company_has_token === companyB.has_token;
  totalScore += (tokenStatusMatch ? 1 : 0) * MATCH_WEIGHTS.tokenStatus;

  // Blockchain networks matching
  if (userPrefs.company_blockchain_networks && companyB.blockchain_networks) {
    const blockchainScore = calculateArraySimilarity(
      userPrefs.company_blockchain_networks,
      companyB.blockchain_networks
    );
    totalScore += blockchainScore * MATCH_WEIGHTS.blockchainNetworks;
  }

  return totalScore;
};

// Find matches for a user based on their preferences
export const findMatches = async (
  userPrefs: MarketingPreferences | ConferencePreferences,
  company: Company,
  user: User,
  potentialMatches: { user: User; company: Company }[],
  minScore = 0.6 // Minimum match score threshold
): Promise<Array<{ user: User; company: Company; score: number }>> => {
  const matches = potentialMatches.map(match => ({
    user: match.user,
    company: match.company,
    score: calculateMatchScore(userPrefs, company, user, match.company, match.user)
  }));

  // Filter by minimum score and sort by score descending
  return matches
    .filter(match => match.score >= minScore)
    .sort((a, b) => b.score - a.score);
};