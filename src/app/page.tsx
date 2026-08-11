"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncTelegramSession } from "@/lib/telegram-session";

export default function EntryPage() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const session = await syncTelegramSession();
      if (isMounted) {
        router.replace("/home");
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="loading-center" style={{ minHeight: "100vh" }}>
      <div className="spinner" />
      <span>Loading…</span>
    </div>
  );
}

