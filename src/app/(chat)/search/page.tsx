import { Metadata } from "next";
import { SearchInterface } from "@/components/search/search-interface";

export const metadata: Metadata = {
  title: "Search - Better Chatbot",
  description: "Search through your chats and messages",
};

export default function SearchPage() {
  return (
    <div className="flex flex-col h-full">
      <SearchInterface />
    </div>
  );
}