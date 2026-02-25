import { getMyProfile } from "@/app/actions/profile";
import { CommunityFeedClient } from "@/components/community/community-feed-client";

export default async function CommunityPage() {
  const currentUser = await getMyProfile();
  const currentUserId = currentUser?.id ?? null;

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <h1 className="font-display text-3xl tracking-wide py-6">Community</h1>
        <p className="text-muted text-sm mb-6">
          Discover what others are watching. Like, comment, and share.
        </p>
        <CommunityFeedClient currentUserId={currentUserId} />
      </div>
    </div>
  );
}
