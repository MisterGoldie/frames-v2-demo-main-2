"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { checkFanTokenOwnership } from "~/utils/tokenUtils";
import { FrameContext } from "@farcaster/frame-sdk";

const Demo = dynamic(() => import("~/components/Demo"), {
  ssr: false,
});

export default function App() {
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [frameContext, setFrameContext] = useState<FrameContext>();

  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (frameContext?.user?.fid) {
        const { balance } = await checkFanTokenOwnership(frameContext.user.fid.toString());
        setTokenBalance(balance);
      }
    };
    
    fetchTokenBalance();
  }, [frameContext?.user?.fid]);

  return <Demo tokenBalance={0} />;
}
