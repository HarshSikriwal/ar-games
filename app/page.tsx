"use client";

import dynamic from "next/dynamic";

// Dynamically import the ARScene component with no SSR
const ARScene = dynamic(() => import("./components/ARScene"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="min-h-screen">
      <ARScene />
    </main>
  );
}
