"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NotificationItem } from "@/app/actions/notifications";
import { getNotifications, markNotificationRead } from "@/app/actions/notifications";

function getNotificationLabel(type: string): string {
  switch (type) {
    case "log_like":
      return "liked your review";
    case "comment":
      return "commented on your review";
    case "follow":
      return "started following you";
    case "post_like":
      return "liked your post";
    default:
      return "did something cool";
  }
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getNotifications({ limit: 50 });
      setItems(data);
      setLoading(false);
    })();
  }, []);

  const handleClick = async (id: string) => {
    await markNotificationRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n))
    );
  };

  return (
    <div className="pt-16 md:pt-20 min-h-screen main-content">
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-[1.8rem] tracking-[0.08em] text-white">
            Notifications
          </h1>
          <Link
            href="/community"
            className="text-[0.75rem] font-mono uppercase tracking-[0.12em] text-muted hover:text-white"
          >
            Back to community
          </Link>
        </div>

        {loading ? (
          <div className="py-10 text-center text-muted text-[0.9rem]">Loading…</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-muted text-[0.9rem]">
            No notifications yet. Log some games, like reviews, and join the community to see updates here.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => {
              const isUnread = !n.read_at;
              const href = n.log_id ? `/community?log=${n.log_id}` : "/community";
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n.id)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-card border border-border bg-surface hover:border-border2 hover:bg-surface2 transition-colors ${
                    isUnread ? "border-green/40 bg-surface2" : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-surface3 flex items-center justify-center text-[0.95rem] shrink-0">
                    {n.actor.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={n.actor.avatar_url}
                        alt={n.actor.display_name ?? n.actor.username}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <span>{n.actor.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={href} className="block">
                      <p className="text-[0.85rem] text-white">
                        <span className="font-semibold">
                          {n.actor.display_name ?? n.actor.username}
                        </span>{" "}
                        {getNotificationLabel(n.type)}
                      </p>
                      <p className="text-[0.75rem] text-muted mt-0.5">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </Link>
                  </div>
                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-green shrink-0 mt-1" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

