import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RayZ - Backend API',
  description: 'RayZ weapon and target system backend API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
