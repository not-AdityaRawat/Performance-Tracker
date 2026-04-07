import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Performance Tracker',
  description: 'Employee MTD productivity tracker with Excel export',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
