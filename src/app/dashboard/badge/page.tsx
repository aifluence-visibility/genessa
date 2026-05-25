"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BadgePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/badge");
  }, [router]);

  return null;
}
