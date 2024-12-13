import { ImageResponse } from "next/og";

export const alt = "POD Play v2";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div tw="h-full w-full flex flex-col justify-center items-center relative" style={{ backgroundColor: '#345fa8' }}>
        <img
          src={`${process.env.NEXT_PUBLIC_URL}/urlimage.png`}
          alt="POD Play v2"
          tw="w-[500px] h-[500px] object-contain"
        />
        <h1 tw="text-6xl text-white mt-4">POD Play v2</h1>
      </div>
    ),
    {
      ...size,
    }
  );
}
