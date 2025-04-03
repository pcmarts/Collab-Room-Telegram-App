import React, { createContext, useState, useContext, ReactNode } from 'react';
import { queryClient } from '@/lib/queryClient';

interface MatchContextType {
  newMatchCreated: boolean;
  setNewMatchCreated: (value: boolean) => void;
  refreshMatches: () => void;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export function MatchProvider({ children }: { children: ReactNode }) {
  const [newMatchCreated, setNewMatchCreated] = useState(false);

  const refreshMatches = () => {
    console.log('[MatchContext] Refreshing matches data');
    queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
    setNewMatchCreated(false);
  };

  return (
    <MatchContext.Provider value={{ newMatchCreated, setNewMatchCreated, refreshMatches }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatchContext() {
  const context = useContext(MatchContext);
  if (context === undefined) {
    throw new Error('useMatchContext must be used within a MatchProvider');
  }
  return context;
}