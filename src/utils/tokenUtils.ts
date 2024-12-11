import { gql, GraphQLClient } from "graphql-request";

const MOXIE_API_URL = process.env.NEXT_PUBLIC_MOXIE_API_URL;

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
  // Implementation here
  return [];
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

    const thepodToken = fanTokenData.find((token: TokenHolding) => 
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