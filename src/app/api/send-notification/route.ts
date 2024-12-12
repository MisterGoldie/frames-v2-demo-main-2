import { SendNotificationRequest } from "@farcaster/frame-sdk";
import { NextRequest } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  title: z.string().max(32),
  body: z.string().max(128),
  targetUrl: z.string().max(256)
});

export async function POST(request: NextRequest) {
  const requestJson = await request.json();
  const requestBody = requestSchema.safeParse(requestJson);

  if (requestBody.success === false) {
    return Response.json(
      { success: false, errors: requestBody.error.errors },
      { status: 400 }
    );
  }

  // Send notification through Farcaster client
  const response = await fetch(process.env.FARCASTER_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notificationId: crypto.randomUUID(),
      title: requestBody.data.title,
      body: requestBody.data.body,
      targetUrl: requestBody.data.targetUrl,
      tokens: [] // Assuming an empty array is an acceptable default for tokens
    } satisfies SendNotificationRequest),
  });

  if (response.status === 200) {
    return Response.json({ success: true });
  } else {
    return Response.json(
      { success: false, error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
