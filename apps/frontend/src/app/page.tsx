// use state for count
'use client';
import { useState } from 'react';

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">RayZ Frontend</h1>
        <p className="text-lg">
          Welcome to the RayZ weapon and target system frontend.
        </p>
        <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => setCount(count + 1)}>
          {count}
        </button>
      </div>
    </main>
  );
}
