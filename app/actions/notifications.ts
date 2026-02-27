"use server";

import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";

export type NotificationType = "log_like" | "comment" | "follow" | "post_like";

export interface NotificationActor {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  created_at: string;
  read_at: string | null;
  actor: NotificationActor;
  log_id: string | null;
  comment_id: string | null;
}

interface GetNotificationsOptions {
  limit?: number;
  cursor?: string | null;
}

export async function createNotification(params: {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  logId?: string | null;
  commentId?: string | null;
}): Promise<void> {
  const { recipientId, actorId, type, logId = null, commentId = null } = params;

  if (!recipientId || !actorId || recipientId === actorId) return;

  try {
    await query(
      `INSERT INTO notifications (recipient_id, actor_id, type, log_id, comment_id)
       VALUES ($1,       $2,       $3,   $4,    $5)`,
      [recipientId, actorId, type, logId, commentId]
    );
  } catch (e) {
    console.error("createNotification failed:", e);
  }
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  try {
    const { rows } = await query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM notifications WHERE recipient_id = $1 AND read_at IS NULL",
      [user.id]
    );
    return rows[0]?.count ?? 0;
  } catch (e) {
    console.error("getUnreadCount failed:", e);
    return 0;
  }
}

export async function getNotifications(
  options: GetNotificationsOptions = {}
): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
  const cursor = options.cursor ?? null;

  try {
    const { rows } = await query<
      NotificationItem & {
        actor_id: string;
        actor_username: string;
        actor_display_name: string | null;
        actor_avatar_url: string | null;
      }
    >(
      `
        SELECT
          n.id::text,
          n.type,
          n.created_at::text,
          n.read_at::text,
          n.log_id::text,
          n.comment_id::text,
          a.id::text   AS actor_id,
          a.username   AS actor_username,
          a.display_name AS actor_display_name,
          a.avatar_url   AS actor_avatar_url
        FROM notifications n
        JOIN profiles a ON a.id = n.actor_id
        WHERE n.recipient_id = $1
          AND ($2::timestamptz IS NULL OR n.created_at < $2::timestamptz)
        ORDER BY n.created_at DESC
        LIMIT $3
      `,
      [user.id, cursor, limit]
    );

    return rows.map((row) => ({
      id: row.id,
      type: row.type as NotificationType,
      created_at: row.created_at,
      read_at: row.read_at,
      log_id: row.log_id,
      comment_id: row.comment_id,
      actor: {
        id: row.actor_id,
        username: row.actor_username,
        display_name: row.actor_display_name,
        avatar_url: row.actor_avatar_url,
      },
    }));
  } catch (e) {
    console.error("getNotifications failed:", e);
    return [];
  }
}

export async function markAllRead(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await query(
      "UPDATE notifications SET read_at = NOW() WHERE recipient_id = $1 AND read_at IS NULL",
      [user.id]
    );
  } catch (e) {
    console.error("markAllRead failed:", e);
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await query(
      "UPDATE notifications SET read_at = NOW() WHERE id = $1 AND recipient_id = $2 AND read_at IS NULL",
      [id, user.id]
    );
  } catch (e) {
    console.error("markNotificationRead failed:", e);
  }
}

