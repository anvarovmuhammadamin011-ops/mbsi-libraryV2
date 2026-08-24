import { getSessionUser } from "@/lib/server/auth";
import { getRanking } from "@/lib/server/reading";
import { RankingView } from "@/components/ranking-view";

export default async function RankingPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const [students, teachers] = await Promise.all([
    getRanking("STUDENT"),
    getRanking("TEACHER"),
  ]);
  return (
    <RankingView
      students={students}
      teachers={teachers}
      currentUserId={user.id}
      currentRole={user.role as any}
      currentUserRank={null}
    />
  );
}
