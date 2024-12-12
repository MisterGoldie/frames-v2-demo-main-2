"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { checkFanTokenOwnership } from "~/utils/tokenUtils";
import { FrameContext } from "@farcaster/frame-sdk";
import sdk from "@farcaster/frame-sdk";

const Demo = dynamic(() => import("~/components/Demo"), {
  ssr: false,
});

export default function App() {
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [profileImage, setProfileImage] = useState<string>('');
  const [frameContext, setFrameContext] = useState<FrameContext>();

  useEffect(() => {
    const loadContext = async () => {
      const context = await sdk.context;
      setFrameContext(context);
    };
    loadContext();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (frameContext?.user?.fid) {
        console.log('Fetching data for FID:', frameContext.user.fid);
        
        // Fetch both token balance and profile data simultaneously
        const [tokenData, profileData] = await Promise.all([
          checkFanTokenOwnership(frameContext.user.fid.toString()),
          frameContext.user.pfpUrl // Profile URL is already in the context
        ]);
        if (tokenData) {
          setTokenBalance(tokenData.balance);
        }
        if (profileData) {
          setProfileImage(profileData);
        }
      }
    };
    
    fetchUserData();
  }, [frameContext?.user?.fid]);

  return <Demo 
    tokenBalance={tokenBalance}
    frameContext={frameContext} profileImage={""}  />;
}
