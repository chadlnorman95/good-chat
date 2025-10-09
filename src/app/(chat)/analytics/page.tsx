import { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { auth } from "lib/auth/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Analytics - Better Chatbot",
  description: "View your usage analytics and insights",
};

export default async function AnalyticsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6">
        <AnalyticsDashboard userId={session.user.id} />
      </div>
    </div>
  );
}