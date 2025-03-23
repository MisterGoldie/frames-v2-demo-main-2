"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { checkFanTokenOwnership } from "~/utils/tokenUtils";
import { FrameContext } from "@farcaster/frame-sdk";
import sdk from "@farcaster/frame-sdk";
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

export default function App() {
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [frameContext, setFrameContext] = useState<FrameContext>();

  // Preload assets on mount - with flag to prevent duplicate loading
  useEffect(() => {
    // Check if assets are already being loaded
    if (window.assetsPreloaded) {
      console.log('Assets already being preloaded, skipping');
      return;
    }
    
    // Set flag to prevent duplicate preloading
    window.assetsPreloaded = true;
    console.log('Preloading assets from App component');
    preloadAssets();
  }, []);

  // Load frame context
  useEffect(() => {
    let isMounted = true;
    
    const loadContext = async () => {
      try {
        // Initialize SDK
        sdk.actions.ready();
        
        try {
          // Attempt to get the real context
          const context = await sdk.context;
          
          if (isMounted) {
            console.log('Frame context loaded successfully:', context);
            setFrameContext(context);
          }
        } catch (contextError) {
          console.warn('Error loading frame context, using fallback:', contextError);
          
          // If we can't get the real context, use a fallback
          if (isMounted) {
            // We're not setting frameContext here to avoid type errors
            // The app will handle undefined frameContext gracefully
            console.log('Using null frame context');
          }
        }
      } catch (error) {
        console.error('Fatal error loading frame context:', error);
      }
    };
    
    loadContext();
    
    return () => {
      isMounted = false;
    };
  }, []);

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

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen bg-purple-900">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-white rounded-full animate-spin" />
          </div>
        }
      >
        <Demo 
          tokenBalance={tokenBalance} 
          frameContext={frameContext}
        />
      </Suspense>
    </ErrorBoundary>
  );
}