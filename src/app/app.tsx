"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { checkFanTokenOwnership } from "~/utils/tokenUtils";
import { FrameContext } from "@farcaster/frame-sdk";
import sdk from "@farcaster/frame-sdk";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { preloadAssets } from "~/utils/optimizations";

const Demo = dynamic(() => import("~/components/game/Demo"), {
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

  // Preload assets on mount
  useEffect(() => {
    preloadAssets();
  }, []);

  // Load frame context
  useEffect(() => {
    let isMounted = true;
    
    const loadContext = async () => {
      try {
        const context = await sdk.context;
        if (isMounted) {
          setFrameContext(context);
        }
      } catch (error) {
        console.error('Error loading frame context:', error);
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
      if (!frameContext?.user?.fid) return;
      
      const cacheKey = `token_balance_${frameContext.user.fid}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached && isMounted) {
        setTokenBalance(JSON.parse(cached));
        return;
      }
      
      try {
        const { balance } = await checkFanTokenOwnership(frameContext.user.fid.toString());
        if (isMounted) {
          setTokenBalance(balance);
          sessionStorage.setItem(cacheKey, JSON.stringify(balance));
        }
      } catch (error) {
        console.error('Error fetching token balance:', error);
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