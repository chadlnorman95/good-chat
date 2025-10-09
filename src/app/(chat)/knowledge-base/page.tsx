import { Metadata } from "next";
import { KnowledgeBaseInterface } from "@/components/knowledge-base/knowledge-base-interface";

export const metadata: Metadata = {
  title: "Knowledge Base",
  description: "Manage your personal knowledge documents and notes",
};

export default function KnowledgeBasePage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <KnowledgeBaseInterface />
      </div>
    </div>
  );
}