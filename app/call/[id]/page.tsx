import { notFound, redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { JitsiRoom } from "@/components/call/jitsi-room";

export default async function CallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionProfile();
  if (!session?.profile) redirect("/login");

  const supabase = await createClient();
  const { data: call } = await supabase
    .from("call_sessions")
    .select("id, room_name, doctor_id, provider_id")
    .eq("id", id)
    .single();
  if (!call) notFound();

  const uid = session.user.id;
  if (call.doctor_id !== uid && call.provider_id !== uid) {
    redirect(ROLE_HOME[session.profile.role]);
  }

  return (
    <JitsiRoom
      sessionId={call.id}
      roomName={call.room_name}
      displayName={session.profile.full_name || "Participant"}
      returnHref={ROLE_HOME[session.profile.role]}
    />
  );
}
