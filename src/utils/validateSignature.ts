// Removed the import statement due to the error

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_API_URL = 'https://api.neynar.com/v2';

export async function validateSignature(
  header: string,
  payload: string,
  signature: string
): Promise<boolean> {
  try {
    // Decode the header to get the FID
    const decodedHeader = JSON.parse(Buffer.from(header, 'base64url').toString());
    const fid = decodedHeader.fid;

    // Verify FID exists via Neynar API
    const response = await fetch(`${NEYNAR_API_URL}/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY || ''
      }
    });

    if (!response.ok) {
      console.error('Failed to verify FID with Neynar');
      return false;
    }

    const data = await response.json();
    return data.users.length > 0;

  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
} 