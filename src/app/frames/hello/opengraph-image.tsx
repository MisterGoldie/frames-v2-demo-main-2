import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Hello Frame";
export const size = {
  width: 600,
  height: 400,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div tw="h-full w-full flex flex-col justify-center items-center relative" style={{ backgroundColor: '#9d00ff' }}>
        <h1 tw="text-6xl text-white">Tic-Tac-Maxi</h1>
      </div>
    ),
    {
      ...size,
    }
  );
}
