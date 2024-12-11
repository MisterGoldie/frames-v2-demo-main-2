import { gql, GraphQLClient } from "graphql-request";

const AIRSTACK_API_URL = process.env.NEXT_PUBLIC_AIRSTACK_API_URL;
const AIRSTACK_API_KEY = process.env.NEXT_PUBLIC_AIRSTACK_API_KEY;
const MOXIE_API_URL = process.env.NEXT_PUBLIC_MOXIE_API_URL;

interface AirstackResponse {
  Socials: {
    Social: {
      userAddress: string;
      userAssociatedAddresses: string[];
    }[];
  };
}

interface MoxieResponse {
  users: {
    portfolio: {
      balance: number;
      buyVolume: number;
      sellVolume: number;
    }[];
  }[];
}

export async function getFarcasterAddressesFromFID(fid: string): Promise<string[]> {
  const graphQLClient = new GraphQLClient(AIRSTACK_API_URL!, {
    headers: {
      'Authorization': AIRSTACK_API_KEY!,
    },
  });

  const query = gql`
    query MyQuery($identity: Identity!) {
      Socials(
        input: {
          filter: { dappName: { _eq: farcaster }, identity: { _eq: $identity } }
          blockchain: ethereum
        }
      ) {
        Social {
          userAddress
          userAssociatedAddresses
        }
      }
    }
  `;

  try {
    const data = await graphQLClient.request<any>(query, {
      identity: `fc_fid:${fid}`
    });
    
    if (!data.Socials?.Social?.[0]) {
      return [];
    }

    const social = data.Socials.Social[0];
    const addresses = [social.userAddress, ...(social.userAssociatedAddresses || [])];
    return [...new Set(addresses)];
  } catch (error) {
    console.error('Error fetching Farcaster addresses:', error);
    return [];
  }
}

export async function getOwnedFanTokens(addresses: string[]): Promise<any[] | null> {
  const graphQLClient = new GraphQLClient(MOXIE_API_URL!);
  
  const query = gql`
    query MyQuery($userAddresses: [ID!]) {
      users(where: { id_in: $userAddresses }) {
        portfolio {
          balance
          buyVolume
          sellVolume
          subjectToken {
            name
            symbol
            currentPriceInMoxie
          }
        }
      }
    }
  `;

  try {
    const data = await graphQLClient.request<MoxieResponse>(query, {
      userAddresses: addresses.map(address => address.toLowerCase())
    });
    
    return data.users?.[0]?.portfolio || null;
  } catch (error) {
    console.error('Error fetching fan tokens:', error);
    return null;
  }
}

export async function checkFanTokenOwnership(fid: string): Promise<{ ownsToken: boolean; balance: number }> {
  try {
    const addresses = await getFarcasterAddressesFromFID(fid);
    
    if (!addresses.length) {
      return { ownsToken: false, balance: 0 };
    }

    const fanTokenData = await getOwnedFanTokens(addresses);
    
    if (!fanTokenData) {
      return { ownsToken: false, balance: 0 };
    }

    const thepodToken = fanTokenData.find((token) => 
      token.subjectToken.symbol.toLowerCase() === "cid:thepod"
    );

    if (thepodToken && parseFloat(thepodToken.balance) > 0) {
      const balance = parseFloat(thepodToken.balance) / 1e18;
      return { ownsToken: true, balance };
    }

    return { ownsToken: false, balance: 0 };
  } catch (error) {
    console.error('Error checking fan token ownership:', error);
    return { ownsToken: false, balance: 0 };
  }
} 