import { Suspense } from 'react';
import StorePageClient from './StorePageClient';

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">
      <div className="font-serif text-xl text-muted-foreground animate-pulse">載入中...</div>
    </div>}>
      <StorePageClient slug={slug} />
    </Suspense>
  );
}
