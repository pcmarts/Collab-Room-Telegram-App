'use client';

import React, { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthTestResponse {
  success: boolean;
  message: string;
  auth_method: string;
  telegram_id: string;
  user_id: string;
  first_name: string;
}

export default function AuthTest() {
  const [result, setResult] = useState<AuthTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const runAuthTest = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('/api/auth-test', 'GET');
      console.log('Auth test response:', response);
      setResult(response);
    } catch (err) {
      console.error('Auth test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = () => {
    // Clear all telegram data from localStorage
    localStorage.removeItem('telegram_user_id');
    localStorage.removeItem('telegram_user_first_name');
    localStorage.removeItem('telegram_user_last_name');
    localStorage.removeItem('telegram_user_username');
    localStorage.removeItem('sessionAuthEstablished');
    localStorage.removeItem('lastSessionTime');
    
    // Reload the page to force a fresh start
    window.location.reload();
  };

  const currentUserData = {
    telegram_id: localStorage.getItem('telegram_user_id') || 'Not found',
    first_name: localStorage.getItem('telegram_user_first_name') || 'Not found',
    has_session: localStorage.getItem('sessionAuthEstablished') === 'true' ? 'Yes' : 'No',
    session_time: localStorage.getItem('lastSessionTime') 
      ? new Date(parseInt(localStorage.getItem('lastSessionTime') || '0', 10)).toLocaleString()
      : 'Not found'
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Authentication Fallback Test</CardTitle>
        <CardDescription>
          Test whether the x-telegram-user-id header fallback works when session cookies change
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button onClick={runAuthTest} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Run Auth Test'}
          </Button>
          
          <Button onClick={clearCache} variant="destructive" disabled={isLoading}>
            Clear Cache & Reload
          </Button>
          
          <Button onClick={() => setShowDebug(!showDebug)} variant="outline">
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </Button>
        </div>
        
        {showDebug && (
          <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
            <h3 className="font-semibold">Current Cached Data:</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Telegram ID:</div>
              <div>{currentUserData.telegram_id}</div>
              
              <div className="font-medium">Name:</div>
              <div>{currentUserData.first_name}</div>
              
              <div className="font-medium">Session Established:</div>
              <div>{currentUserData.has_session}</div>
              
              <div className="font-medium">Last Session Time:</div>
              <div>{currentUserData.session_time}</div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-destructive/20 p-4 rounded-md text-destructive">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {result && (
          <div className="bg-primary/20 p-4 rounded-md">
            <h3 className="font-semibold mb-2">Auth Test Result:</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Status:</div>
              <div>{result.success ? 'Success ✅' : 'Failed ❌'}</div>
              
              <div className="font-medium">Message:</div>
              <div>{result.message}</div>
              
              <div className="font-medium">Auth Method:</div>
              <div>
                <span className={result.auth_method === 'Direct User ID' ? 'text-green-600 font-bold' : ''}>
                  {result.auth_method}
                </span>
              </div>
              
              <div className="font-medium">Telegram ID:</div>
              <div>{result.telegram_id}</div>
              
              <div className="font-medium">User ID:</div>
              <div className="truncate">{result.user_id}</div>
              
              <div className="font-medium">Name:</div>
              <div>{result.first_name}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}