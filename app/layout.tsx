import type { Metadata } from 'next';
import { Providers } from './providers';
import NavigationHeader from '@/components/NavigationHeader';

export const metadata: Metadata = {
  title: 'Weight Loss Tracker',
  description: 'Track your weight loss progress with photos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0 }}>
        <Providers>
          <NavigationHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
