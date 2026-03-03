import Link from "next/link";
import { getMyProfile } from "@/app/actions/profile";
import { getCommunityPostById } from "@/app/actions/community";
import { CommunityPostCard } from "@/components/community/community-post-card";
import { PostThread } from "@/components/community/post-thread";

interface CommunityPostPageProps {
  params: { logId: string };
}

export default async function CommunityPostPage({ params }: CommunityPostPageProps) {
  const currentUser = await getMyProfile();
  const currentUserId = currentUser?.id ?? null;
  const logId = typeof params.logId === "string" ? params.logId : "";

  const post = await getCommunityPostById(logId, currentUserId);

  if (!post) {
    return (
      <div className="pt-20 md:pt-24 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 pb-24">
          <Link href="/community" className="text-muted hover:text-white text-sm">
            ← Back to Community
          </Link>
          <p className="text-muted text-sm mt-4">Post not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <div className="flex items-center gap-4 py-4">
          <Link
            href="/community"
            className="text-muted hover:text-white text-lg font-medium leading-none pb-1"
            aria-label="Back to Community"
          >
            ←
          </Link>
          <h1 className="font-display text-2xl tracking-wide">Post</h1>
        </div>
        <CommunityPostCard post={post} currentUserId={currentUserId} />
        <PostThread
          logId={post.id}
          currentUserId={currentUserId}
          currentUserAvatarUrl={currentUser?.avatar_url ?? null}
        />
      </div>
    </div>
  );
}

