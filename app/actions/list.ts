"use server";

import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";

export interface ListSummary {
  id: string;
  title: string;
  description: string | null;
  is_ranked: boolean;
  item_count: number;
  [key: string]: unknown;
}

export async function getListsForCurrentUser(): Promise<ListSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const sql = `
    SELECT
      l.id::text,
      l.title,
      l.description,
      l.is_ranked,
      COUNT(li.id)::int AS item_count
    FROM lists l
    LEFT JOIN list_items li ON li.list_id = l.id
    WHERE l.user_id = $1
    GROUP BY l.id, l.title, l.description, l.is_ranked
    ORDER BY l.updated_at DESC
  `;
  const { rows } = await query<ListSummary & { item_count: number }>(sql, [user.id]);
  return rows.map((r) => ({ ...r, item_count: r.item_count ?? 0 }));
}

export async function getPublicListsByUserId(userId: string): Promise<ListSummary[]> {
  const sql = `
    SELECT
      l.id::text,
      l.title,
      l.description,
      l.is_ranked,
      COUNT(li.id)::int AS item_count
    FROM lists l
    LEFT JOIN list_items li ON li.list_id = l.id
    WHERE l.user_id = $1 AND l.is_public = true
    GROUP BY l.id, l.title, l.description, l.is_ranked
    ORDER BY l.updated_at DESC
  `;
  const { rows } = await query<ListSummary & { item_count: number }>(sql, [userId]);
  return rows.map((r) => ({ ...r, item_count: r.item_count ?? 0 }));
}

export interface ListDetail {
  id: string;
  title: string;
  description: string | null;
  is_ranked: boolean;
  creator_username: string;
  [key: string]: unknown;
}

export async function getListById(id: string): Promise<ListDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sql = `
    SELECT
      l.id::text,
      l.title,
      l.description,
      l.is_ranked,
      p.username AS creator_username
    FROM lists l
    JOIN profiles p ON p.id = l.user_id
    WHERE l.id = $1 AND (l.is_public = true OR l.user_id = $2)
  `;
  const { rows } = await query<ListDetail>(sql, [id, user?.id ?? null]);
  return rows[0] ?? null;
}

export interface ListItemWithMatch {
  id: string;
  match_id: number;
  position: number | null;
  note: string | null;
  competition_name: string;
  home_team_name: string;
  away_team_name: string;
  home_crest_url: string | null;
  away_crest_url: string | null;
  home_score: number | null;
  away_score: number | null;
  [key: string]: unknown;
}

export async function getListItems(listId: string): Promise<ListItemWithMatch[]> {
  const sql = `
    SELECT
      li.id::text,
      li.match_id,
      li.position,
      li.note,
      c.name AS competition_name,
      ht.name AS home_team_name,
      at.name AS away_team_name,
      ht.crest_url AS home_crest_url,
      at.crest_url AS away_crest_url,
      m.home_score,
      m.away_score
    FROM list_items li
    JOIN matches m ON m.id = li.match_id
    JOIN competitions c ON c.id = m.competition_id
    JOIN teams ht ON ht.id = m.home_team_id
    JOIN teams at ON at.id = m.away_team_id
    WHERE li.list_id = $1
    ORDER BY li.position NULLS LAST, li.added_at ASC
  `;
  const { rows } = await query<ListItemWithMatch>(sql, [listId]);
  return rows;
}

export async function createList(
  title: string,
  description?: string | null
): Promise<{ ok: true; listId: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to create a list." };

  const trimmed = title.trim();
  if (!trimmed) return { ok: false, error: "Title is required." };

  const sql = `
    INSERT INTO lists (user_id, title, description)
    VALUES ($1, $2, $3)
    RETURNING id::text
  `;
  try {
    const { rows } = await query<{ id: string }>(sql, [user.id, trimmed, description?.trim() || null]);
    return { ok: true, listId: rows[0].id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create list";
    return { ok: false, error: message };
  }
}

export async function addMatchToList(
  listId: string,
  matchId: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to add to a list." };

  const sql = `
    INSERT INTO list_items (list_id, match_id)
    VALUES ($1, $2)
    ON CONFLICT (list_id, match_id) DO NOTHING
  `;
  try {
    await query(sql, [listId, matchId]);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to add to list";
    return { ok: false, error: message };
  }
}
