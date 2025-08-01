"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { checkFanTokenOwnership } from "~/utils/tokenUtils";
import { Context, sdk } from "@farcaster/miniapp-sdk";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { preloadAssets } from "~/utils/optimizations";

const Demo = dynamic(() => import("../components/Demo"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-purple-900">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-white rounded-full animate-spin mb-4" />
      <p className="text-white text-xl">Loading POD Play...</p>
    </div>
  ),
});

// Ensure Demo is only rendered once
export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [frameContext, setFrameContext] = useState<Context.MiniAppContext | undefined>(undefined);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    if (!isLoaded) {
      setIsLoaded(true);
    }
  }, [isLoaded]);
  
  useEffect(() => {
    setIsMounted(true);
    preloadAssets();
  }, []);
  
  useEffect(() => {
    if (!isMounted) return;

    const loadContext = async () => {
      try {
        // Initialize SDK
        await sdk.actions.ready();
        
        try {
          // Attempt to get the real context
          const context = await sdk.context;
          
          if (isMounted) {
            console.log('MiniApp context loaded successfully:', context);
            setFrameContext(context);
          }
        } catch (contextError) {
          console.warn('Error loading miniapp context, using fallback:', contextError);
          
          if (isMounted) {
            console.log('Using null miniapp context');
          }
        }
      } catch (error) {
        console.error('Fatal error loading miniapp context:', error);
      }
    };

    loadContext();
  }, [isMounted]);
  
  // Fetch token balance with caching
  useEffect(() => {
    let isMounted = true;
    
    const fetchTokenBalance = async () => {
      try {
        // Skip if no valid FID
        if (!frameContext?.user?.fid) {
          console.log('No FID available, skipping token balance fetch');
          return;
        }
        
        // Try to get from cache first
        try {
          const cacheKey = `token_balance_${frameContext.user.fid}`;
          const cached = sessionStorage.getItem(cacheKey);
          
          if (cached && isMounted) {
            const parsedBalance = JSON.parse(cached);
            setTokenBalance(parsedBalance);
            console.log('Using cached token balance:', parsedBalance);
            return;
          }
        } catch (cacheError) {
          console.warn('Error reading from cache:', cacheError);
          // Continue to fetch fresh data
        }
        
        // Fetch fresh data
        try {
          console.log('No FID available, skipping token balance fetch');
          // Skip token balance fetch - API is no longer available
          // Just use default token balance of 0
          
          /* Original implementation - commented out due to API issues
          const { balance } = await checkFanTokenOwnership(frameContext.user.fid.toString());
          if (isMounted) {
            console.log('Fetched token balance:', balance);
            setTokenBalance(balance);
            
            try {
              sessionStorage.setItem(`token_balance_${frameContext.user.fid}`, JSON.stringify(balance));
            } catch (storageError) {
              console.warn('Error saving to cache:', storageError);
            }
          }
          */
        } catch (fetchError) {
          console.warn('Skipping token balance fetch:', fetchError);
          // Continue with default token balance of 0
        }
      } catch (error) {
        console.error('Unexpected error in token balance logic:', error);
      }
    };
    
    fetchTokenBalance();
    
    return () => {
      isMounted = false;
    };
  }, [frameContext?.user?.fid]);
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading POD Play...</div>}>
        <Demo tokenBalance={tokenBalance} frameContext={frameContext} />
      </Suspense>
    </ErrorBoundary>
  );
}