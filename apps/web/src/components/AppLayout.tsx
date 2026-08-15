import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { VerifyEmailBanner } from "./VerifyEmailBanner";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-brand-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <VerifyEmailBanner />
        <main className="flex-1 bg-brand-bg p-4 sm:p-6">
          <Outlet /> {/* current page renders here */}
        </main>
      </div>
    </div>
  );
}
