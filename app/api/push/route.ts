import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { messaging } from "@/lib/firebase/admin";

export const runtime = "nodejs";

type NotifRecord = {
  user_id: string;
  title: string;
  body: string | null;
  appointment_id: string | null;
  type: string | null;
};

/**
 * Push fan-out endpoint. Called by a Supabase Database Webhook on
 * `notifications` INSERT (or manually for testing). Sends an FCM push to
 * every device token registered for the notification's recipient.
 */
export async function POST(req: Request) {
  if (req.headers.get("x-webhook-secret") !== process.env.PUSH_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Supabase webhooks wrap the row in { type, record, ... }; also accept a bare record.
  const record = ((payload as { record?: NotifRecord }).record ??
    payload) as NotifRecord;
  const { user_id, title, body, appointment_id, type } = record;
  if (!user_id || !title) {
    return NextResponse.json({ ok: true, sent: 0, skipped: "missing fields" });
  }

  const admin = createAdminClient();
  const { data: tokens } = await admin
    .from("push_tokens")
    .select("token")
    .eq("user_id", user_id);

  if (!tokens?.length) return NextResponse.json({ ok: true, sent: 0 });

  const stale: string[] = [];
  let sent = 0;

  await Promise.all(
    tokens.map(async ({ token }) => {
      try {
        await messaging.send({
          token,
          notification: { title, body: body ?? "" },
          data: {
            appointment_id: appointment_id ?? "",
            type: type ?? "",
          },
          webpush: {
            fcmOptions: { link: "/notifications" },
            notification: { icon: "/icons/icon.svg" },
          },
        });
        sent++;
      } catch (e: unknown) {
        const code = (e as { errorInfo?: { code?: string } })?.errorInfo?.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          stale.push(token);
        }
      }
    }),
  );

  if (stale.length) {
    await admin.from("push_tokens").delete().in("token", stale);
  }

  return NextResponse.json({ ok: true, sent, pruned: stale.length });
}
