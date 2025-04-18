import { Metadata } from "next";
import App from "./app";

const appUrl = process.env.NEXT_PUBLIC_URL;

const frame = {
  version: "next",
  imageUrl: `${appUrl}/game-board.png`,
  button: {
    title: "Play Now",
    action: {
      type: "launch_frame",
      name: "POD Play v2",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#9d00ff",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "POD Play v2",
    openGraph: {
      title: "Tic-Tac-Maxi",
      description: "Tic-Tac-Toe style game by @goldie and the POD team.",
      images: [
        {
          url: `${appUrl}/game-board.png`,
          width: 1200,
          height: 630,
          alt: "Tic-Tac-Maxi Game Board",
        },
      ],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return (<App />);
}