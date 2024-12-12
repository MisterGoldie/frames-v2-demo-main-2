const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

type UserData = {
  username: string;
  pfp: string;
};

export async function fetchUserDataByFid(fid: string): Promise<UserData | null> {
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          accept: 'application/json',
          api_key: NEYNAR_API_KEY || '',
        },
      }
    );

    const data = await response.json();
    if (data.users && data.users[0]) {
      return {
        username: data.users[0].username,
        pfp: data.users[0].pfp_url,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
} 