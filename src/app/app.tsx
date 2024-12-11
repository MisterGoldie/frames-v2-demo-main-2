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
  const [frameContext, setFrameContext] = useState<FrameContext>();

  useEffect(() => {
    const loadContext = async () => {
      const context = await sdk.context;
      setFrameContext(context);
    };
    loadContext();
  }, []);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (frameContext?.user?.fid) {
        console.log('Fetching balance for FID:', frameContext.user.fid);
        const { balance } = await checkFanTokenOwnership(frameContext.user.fid.toString());
        console.log('Retrieved balance:', balance);
        setTokenBalance(balance);
      } else {
        console.log('No FID available in frame context:', frameContext);
      }
    };
    
    fetchTokenBalance();
  }, [frameContext?.user?.fid]);

  return <Demo tokenBalance={tokenBalance} frameContext={frameContext} />;
}
