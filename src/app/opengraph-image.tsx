import { ImageResponse } from "next/og";

export const alt = "POD Play v2";
export const size = {
  width: 600,
  height: 400,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#4c1d95',
          padding: '20px',
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
          }}
        >
          Tic-Tac-Maxi
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
//