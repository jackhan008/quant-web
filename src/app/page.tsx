import { getCurrencySymbol } from '@/lib/utils';
import SearchBar from '@/components/SearchBar';
import MarketGrid from '@/components/MarketGrid';
import { Activity } from 'lucide-react';
import { getMarketOverview } from '@/lib/stockService';
import { getLanguage } from '@/lib/language';
import { translations, stockNameMap } from '@/lib/translations';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const lang = await getLanguage();
  const t = translations[lang];
  const marketData = await getMarketOverview();

  // Localize stock names
  const localizedData = marketData
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .map(stock => ({
      ...stock,
      name: stockNameMap[lang][stock.symbol] || stock.name
    }));

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[var(--bg-app)]">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container relative z-10 flex flex-col items-center gap-12 py-20 px-4">

        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-4">
            <Activity className="w-4 h-4" />
            <span>{t.realtime}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
            {t.title} <br />
            <span className="text-gradient">{t.strategyTitle}</span>
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* Search */}
        <div className="w-full max-w-2xl">
          <SearchBar lang={lang} />
        </div>

        {/* Market Leaders Grid with Filtering */}
        <MarketGrid initialData={localizedData} lang={lang} />
      </div>
    </main>
  );
}
