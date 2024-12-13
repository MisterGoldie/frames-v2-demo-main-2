import { ImageResponse } from "next/og";

export const alt = "POD Play v2";
export const size = {
  width: 600,
  height: 400,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div tw="h-full w-full flex flex-col justify-center items-center relative">
        <img
          src={`${process.env.NEXT_PUBLIC_URL}/urlimage.png`}
          alt="POD Play v2"
          tw="w-full h-full object-cover"
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
//