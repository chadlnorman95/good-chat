import { Metadata } from "next";
import { ApiKeysInterface } from "@/components/api-keys/api-keys-interface";

export const metadata: Metadata = {
  title: "API Keys",
  description: "Manage your API keys for various AI services and integrations",
};

export default function ApiKeysPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ApiKeysInterface />
      </div>
    </div>
  );
}