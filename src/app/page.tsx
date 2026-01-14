import { getCurrencySymbol } from '@/lib/utils';
import SearchBar from '@/components/SearchBar';
import MarketGrid from '@/components/MarketGrid';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { getMarketOverview } from '@/lib/stockService';

// Force dynamic rendering to ensure real-time data fetching on every request
// reliable for "live" stock prices and news
export const dynamic = 'force-dynamic';

export default async function Home() {
  const marketData = await getMarketOverview();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[var(--bg-app)]">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container relative z-10 flex flex-col items-center gap-12 py-20">

        {/* Hero Section */}
        <div className="text-center space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-4">
            <Activity className="w-4 h-4" />
            <span>Real-time Quantitative Analysis</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Master the Market with <br />
            <span className="text-gradient">4-Dimensional Strategy</span>
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Analyze Industry trends, Financial health, News sentiment, and Market signals in one unified platform.
          </p>
        </div>

        {/* Search */}
        <div className="w-full max-w-2xl">
          <SearchBar />
        </div>

        {/* Market Leaders Grid with Filtering */}
        <MarketGrid initialData={marketData} />
      </div>
    </main>
  );
}
