// src/components/Layout.tsx
import "@/global.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full grid grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <aside className="sidebar border-r border-border p-3">
        {/* ...same markup as before... */}
      </aside>

      {/* Main area */}
      <main className="relative">
        <header className="flex items-center justify-between p-4 border-b border-border">
          <h1 className="text-xl font-semibold">Copilot</h1>
          <div className="flex items-center gap-2">
            <button className="pressable copilot-pressable bg-secondary text-secondary-foreground rounded-md px-3 py-2">
              Settings
            </button>
            <button className="pressable copilot-pressable bg-primary text-primary-foreground rounded-md px-3 py-2">
              Upgrade
            </button>
          </div>
        </header>

        {/* Page content */}
        <section className="p-4 space-y-3">{children}</section>

        {/* Floating chatbar */}
        <div className="floating-chatbar floating-chatbar--padded">
          <div
            className="copilot-box scroll-invisible"
            role="region"
            aria-label="Copilot input"
          >
            <textarea
              id="copilot-textarea"
              className="copilot-input scroll-invisible"
              rows={1}
              placeholder="Ask or type a thought…"
            />
            <div className="copilot-actions">
              <button
                id="send"
                className="pressable copilot-pressable bg-primary text-primary-foreground rounded-md px-3 py-2"
              >
                Send
              </button>
              <button className="pressable copilot-pressable bg-secondary text-secondary-foreground rounded-md px-3 py-2">
                Attach
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
