import { gql, GraphQLClient } from "graphql-request";
import axios from 'axios';

const MOXIE_API_URL = process.env.NEXT_PUBLIC_MOXIE_API_URL;
const AIRSTACK_HUBS_URL = "https://hubs.airstack.xyz/v1";
const AIRSTACK_API_KEY = process.env.NEXT_PUBLIC_AIRSTACK_API_KEY;

interface TokenHolding {
  balance: string;
  buyVolume: string;
  sellVolume: string;
  subjectToken: {
    name: string;
    symbol: string;
    currentPriceInMoxie: string;
  };
}

interface MoxieResponse {
  users: {
    portfolio: TokenHolding[];
  }[];
}

interface AirstackResponse {
  Socials: {
    Social: {
      userAddress: string;
      userAssociatedAddresses: string[];
    }[];
  };
}

export async function getOwnedFanTokens(addresses: string[]): Promise<TokenHolding[] | null> {
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

export async function getFarcasterAddressesFromFID(fid: string): Promise<string[]> {
  const AIRSTACK_API_URL = "https://api.airstack.xyz/gql";
  const AIRSTACK_API_KEY = process.env.NEXT_PUBLIC_AIRSTACK_API_KEY;

  const graphQLClient = new GraphQLClient(AIRSTACK_API_URL, {
    headers: {
      authorization: AIRSTACK_API_KEY!
    }
  });

  const query = gql`
    query GetFarcasterAddresses($fid: String!) {
      Socials(
        input: {
          filter: { dappName: { _eq: farcaster }, userId: { _eq: $fid } }
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
    const response = await graphQLClient.request<AirstackResponse>(query, { fid });
    const addresses = response?.Socials?.Social?.[0]?.userAssociatedAddresses || [];
    console.log(`Found Farcaster addresses for FID ${fid}:`, addresses);
    return addresses;
  } catch (error) {
    console.error(`Error fetching Farcaster addresses for FID ${fid}:`, error);
    return [];
  }
}

async function getTokenDetailsFromHubs(address: string) {
  try {
    const response = await axios.get(`${AIRSTACK_HUBS_URL}/token_details?address=${address}`, {
      headers: {
        "Content-Type": "application/json",
        "x-airstack-hubs": AIRSTACK_API_KEY as string,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching token details from Hubs:', error);
    return null;
  }
}

export async function checkFanTokenOwnership(fid: string): Promise<{ ownsToken: boolean; balance: number }> {
  try {
    console.log(`Checking token ownership for FID: ${fid}`);
    const addresses = await getFarcasterAddressesFromFID(fid);
    console.log(`Found addresses:`, addresses);
    
    if (!addresses.length) {
      console.log('No addresses found');
      return { ownsToken: false, balance: 0 };
    }

    const fanTokenData = await getOwnedFanTokens(addresses);
    if (fanTokenData) {
      const thepodToken = fanTokenData.find((token: TokenHolding) => 
        token.subjectToken.symbol.toLowerCase() === "cid:thepod"
      );
      
      if (thepodToken && parseFloat(thepodToken.balance) > 0) {
        const balance = parseFloat(thepodToken.balance) / 1e18;
        return { ownsToken: true, balance };
      }
    }

    for (const address of addresses) {
      const hubsData = await getTokenDetailsFromHubs(address);
      if (hubsData?.tokens?.find((t: any) => t.symbol.toLowerCase() === "cid:thepod")) {
        const token = hubsData.tokens.find((t: any) => t.symbol.toLowerCase() === "cid:thepod");
        return { 
          ownsToken: true, 
          balance: parseFloat(token.balance) / 1e18 
        };
      }
    }

    return { ownsToken: false, balance: 0 };
  } catch (error) {
    console.error('Error checking fan token ownership:', error);
    return { ownsToken: false, balance: 0 };
  }
} 

const AIRSTACK_HUBS_SERVER = "https://hubs.airstack.xyz";

export async function checkAirstackHubs() {
  try {
    const response = await axios.get(`${AIRSTACK_HUBS_SERVER}/v1/info?dbstats=1`, {
      headers: {
        "Content-Type": "application/json",
        "x-airstack-hubs": AIRSTACK_API_KEY as string,
      },
    });
  
    console.log('Airstack Hubs Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
} 