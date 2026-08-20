import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Write an attributed audit entry for a service-role action.
 *
 * Trigger-based auditing can't see the actor when a write goes through the
 * service-role client (auth.uid() is null), so those actions — admin user
 * management, GDPR erasure, provider add-patient, public signup — log
 * explicitly with the real actor id. Auditing must never break the underlying
 * operation, so failures here are swallowed.
 */
export async function logAudit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    await createAdminClient()
      .from("audit_log")
      .insert({
        actor_id: actorId,
        action,
        entity,
        entity_id: entityId,
        meta: meta ?? null,
      });
  } catch {
    // best-effort
  }
}
