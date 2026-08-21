import { notFound, redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { JitsiRoom } from "@/components/call/jitsi-room";
import { jaasConfigured, jaasRoom, makeJaasToken } from "@/lib/jaas";

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

  // With JaaS configured, sign a JWT so both sides join directly (no login) and
  // prefix the room with the tenant id. Otherwise fall back to the plain room.
  const useJaas = jaasConfigured();
  const roomName = useJaas ? jaasRoom(call.room_name) : call.room_name;
  const jwt = useJaas
    ? makeJaasToken({
        room: call.room_name,
        userId: uid,
        name: session.profile.full_name || "Participant",
        moderator: session.profile.role === "doctor",
      })
    : null;

  return (
    <JitsiRoom
      sessionId={call.id}
      roomName={roomName}
      displayName={session.profile.full_name || "Participant"}
      returnHref={ROLE_HOME[session.profile.role]}
      jwt={jwt}
    />
  );
}
