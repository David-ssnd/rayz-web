// use state for count
'use client';
import { useState } from 'react';
import CanvaEmbed from '@/components/CanvaEmbed';

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm mb-8">
        <h1 className="text-4xl font-bold mb-4">RayZ</h1>
        <p className="text-lg">Welcome to the RayZ project web.</p>

        {/* <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => setCount(count + 1)}>
          {count}
        </button> */}

        <CanvaEmbed
          url="https://www.canva.com/design/DAG1wt58las/r-xa2ln8hKv0UzK1o0MNsA/view"
          userName="Dávid Krivoklatský"
          designTitle="RayZ Presentation"
          aspectRatio={16 / 9}
        />
      </div>
    </main>
  );
}
