import {
  SendNotificationRequest,
  sendNotificationResponseSchema,
} from "@farcaster/frame-sdk";
import { NextRequest } from "next/server";
import { z } from "zod";
import { getNotificationDetails } from '~/utils/notificationStore';

const requestSchema = z.object({
  fid: z.string(),
  title: z.string().max(32),
  body: z.string().max(128),
  targetUrl: z.string().max(256)
});

export async function POST(request: NextRequest) {
  console.log('Received notification request');
  
  const requestJson = await request.json();
  console.log('Request body:', requestJson);
  
  const requestBody = requestSchema.safeParse(requestJson);

  if (requestBody.success === false) {
    console.error('Invalid request body:', requestBody.error.errors);
    return Response.json(
      { success: false, errors: requestBody.error.errors },
      { status: 400 }
    );
  }

  // Get notification details for this user
  const details = await getNotificationDetails(requestBody.data.fid);
  console.log('Retrieved notification details:', details);
  
  if (!details) {
    console.log('No notification details found for FID:', requestBody.data.fid);
    return Response.json(
      { success: false, error: "No notification details found for user" },
      { status: 404 }
    );
  }

  try {
    const response = await fetch(details.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notificationId: crypto.randomUUID(),
        title: requestBody.data.title,
        body: requestBody.data.body,
        targetUrl: requestBody.data.targetUrl,
        tokens: [details.token]
      } satisfies SendNotificationRequest),
    });

    const responseJson = await response.json();
    console.log('Farcaster notification raw response:', responseJson);

    // Validate response using Farcaster SDK schema
    const responseBody = sendNotificationResponseSchema.safeParse(responseJson);
    if (responseBody.success === false) {
      console.error('Invalid response format:', responseBody.error.errors);
      return Response.json(
        { success: false, errors: responseBody.error.errors },
        { status: 500 }
      );
    }

    // Check for rate limiting
    if (responseBody.data.result.rateLimitedTokens.length) {
      console.log('Rate limited tokens:', responseBody.data.result.rateLimitedTokens);
      return Response.json(
        { success: false, error: "Rate limited" },
        { status: 429 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return Response.json(
      { success: false, error: "Failed to send notification", details: error },
      { status: 500 }
    );
  }
}
