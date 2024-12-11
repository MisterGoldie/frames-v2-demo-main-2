import { Metadata } from "next";
import App from "~/app/app";

const appUrl = process.env.NEXT_PUBLIC_URL;

const frame = {
  version: "next",
  imageUrl: `${appUrl}/frames/hello/opengraph-image`,
  button: {
    title: "Launch Frame",
    action: {
      type: "launch_frame",
      name: "Tic-Tac-Maxi",
      url: `${appUrl}/frames/hello/`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export const metadata: Metadata = {
  title: "POD Play v2",
  description: "Tic-Tac-Toe style game by @goldie and @themrsazon",
  openGraph: {
    title: "Tic-Tac-Maxi",
    description: "Can you beat the CPU?",
  },
  other: {
    "fc:frame": JSON.stringify(frame),
  },
};

export default function HelloFrame() {
  return <App />;
}
