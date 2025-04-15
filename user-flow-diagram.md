# Web3 Professional Networking Platform User Flow

Below is a Mermaid chart showing the typical user journey through the application:

```mermaid
flowchart TD
    Start([User Opens App]) --> Auth{Is Authenticated?}
    
    %% Authentication Flow
    Auth -->|No| TelegramAuth[Telegram Authentication]
    TelegramAuth --> OnboardCheck{Completed Onboarding?}
    Auth -->|Yes| HomeScreen[Home Screen]
    
    %% Onboarding Flow
    OnboardCheck -->|No| Onboarding[Onboarding Process]
    Onboarding -->|Step 1| PersonalInfo[Personal Information]
    PersonalInfo -->|Step 2| CompanyInfo[Company Information]
    CompanyInfo -->|Step 3| Preferences[Set Preferences]
    Preferences -->|Complete| ApprovalCheck{Admin Approval?}
    ApprovalCheck -->|Pending| WaitingScreen[Waiting for Approval]
    ApprovalCheck -->|Approved| HomeScreen
    OnboardCheck -->|Yes| HomeScreen
    
    %% Main Application Flow
    HomeScreen --> NavMenu{Navigation Menu}
    
    %% Discovery Flow
    NavMenu -->|Discovery| DiscoveryFeed[Discovery Feed]
    DiscoveryFeed --> Filters[Apply Filters]
    Filters --> ViewCard[View Collaboration Card]
    ViewCard --> SwipeDecision{Swipe Decision}
    SwipeDecision -->|Left| NextCard[Next Card]
    SwipeDecision -->|Right| CreateSwipe[Create Swipe Record]
    CreateSwipe --> CheckMatch{Is Match?}
    CheckMatch -->|Yes| ShowMatch[Show Match Notification]
    CheckMatch -->|No| NextCard
    NextCard --> MoreCards{More Cards?}
    MoreCards -->|Yes| ViewCard
    MoreCards -->|No| EmptyState[Empty State]
    
    %% Collaboration Management Flow
    NavMenu -->|Create| CreateCollab[Create Collaboration]
    CreateCollab --> CollabForm[Fill Collaboration Form]
    CollabForm --> SubmitCollab[Submit Collaboration]
    SubmitCollab --> MyCollabs[My Collaborations]
    NavMenu -->|My Collabs| MyCollabs
    MyCollabs --> EditCollab[Edit Collaboration]
    MyCollabs --> ViewMatches[View Collaboration Matches]
    
    %% Match Management Flow
    NavMenu -->|Matches| MatchesList[Matches List]
    MatchesList --> SelectMatch[Select Match]
    SelectMatch --> MatchDetails[Match Details]
    MatchDetails --> AddNote[Add Note]
    
    %% Profile Management Flow
    NavMenu -->|Profile| UserProfile[User Profile]
    UserProfile --> EditProfile[Edit Profile]
    UserProfile --> ViewCompany[View Company]
    ViewCompany --> EditCompany[Edit Company]
    
    %% Settings Flow
    NavMenu -->|Settings| Settings[Settings Screen]
    Settings --> NotificationPrefs[Notification Preferences]
    Settings --> DiscoveryPrefs[Discovery Preferences]
    Settings --> Privacy[Privacy Settings]
    
    %% Admin Flow
    NavMenu -->|Admin Panel| AdminCheck{Is Admin?}
    AdminCheck -->|Yes| AdminDashboard[Admin Dashboard]
    AdminDashboard --> UserManagement[User Management]
    AdminDashboard --> CollabModeration[Collaboration Moderation]
    AdminDashboard --> SystemStats[System Statistics]
    AdminCheck -->|No| HomeScreen
```

## Key User Journeys

### 1. New User Journey
- Authentication via Telegram
- Complete onboarding process (personal info, company info, preferences)
- Wait for admin approval
- Access main application features

### 2. Discovery Journey
- Navigate to discovery feed
- Apply filters (collaboration types, topics, company sectors, etc.)
- View and swipe on collaboration cards
- Receive match notifications when both parties express interest
- View match details and add notes

### 3. Collaboration Creation Journey
- Create new collaboration opportunity
- Fill in collaboration details (type, description, requirements)
- Submit collaboration
- Manage created collaborations
- View and interact with matches

### 4. Profile Management Journey
- View and edit personal profile
- Update company information
- Manage notification preferences
- Adjust discovery preferences

### 5. Admin User Journey
- Access admin dashboard
- Approve/reject new user applications
- Moderate collaboration content
- View system statistics and reports