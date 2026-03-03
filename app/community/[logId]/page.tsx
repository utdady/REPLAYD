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

  const post = await getCommunityPostById(params.logId, currentUserId);

  if (!post) {
    return (
      <div className="pt-20 md:pt-24 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 pb-24">
          <p className="text-muted text-sm">Post not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <h1 className="font-display text-2xl tracking-wide py-4">Post</h1>
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

