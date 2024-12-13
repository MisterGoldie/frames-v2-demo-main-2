import { Metadata } from "next";
import App from "./app";

const appUrl = 'https://podplayv2.vercel.app';

const frame = {
  version: "next",
  imageUrl: `${appUrl}/urlimage.png`,
  button: {
    title: "Play Now",
    action: {
      type: "launch_frame",
      name: "POD Play v2",
      url: appUrl,
      splashImageUrl: `${appUrl}/urlimage.png`,
      splashBackgroundColor: "#345fa8",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "POD Play v2",
    openGraph: {
      title: "Tic-Tac-Maxi",
      description: "Can you beat Maxi in this POD-themed Tic-Tac-Toe game?",
      images: [`${appUrl}/urlimage.png`],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return (<App />);
}
