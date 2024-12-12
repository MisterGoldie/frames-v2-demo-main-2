const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const AIRSTACK_API_KEY = process.env.NEXT_PUBLIC_AIRSTACK_API_KEY;

type UserData = {
  username: string;
  pfp: string;
};

async function getAirstackProfilePicture(username: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.airstack.xyz/gql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AIRSTACK_API_KEY || '',
      },
      body: JSON.stringify({
        query: `
          query GetUserProfilePicture {
            Socials(input: {filter: {profileName: {_eq: "${username}"}}, blockchain: ethereum}) {
              Social {
                profileImage
              }
            }
          }
        `
      }),
    });

    const data = await response.json();
    return data?.data?.Socials?.Social?.[0]?.profileImage || null;
  } catch (error) {
    console.error('Error fetching Airstack profile picture:', error);
    return null;
  }
}

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
      const username = data.users[0].username;
      const airstackPfp = await getAirstackProfilePicture(username);
      
      return {
        username,
        pfp: airstackPfp || data.users[0].pfp_url || data.users[0].pfp || '/default-avatar.png',
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
} 