import { getStockAnalysis } from '@/lib/stockService';
import { getCurrencySymbol } from '@/lib/utils';
import StockChart from '@/components/StockChart';
import { notFound } from 'next/navigation';
import { TrendingUp, TrendingDown, Newspaper, DollarSign, Activity, FileText } from 'lucide-react';

// Force dynamic rendering to ensure real-time data fetching on every request
export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ symbol: string }>;
}

export default async function StockPage({ params }: PageProps) {
    const { symbol } = await params;
    const data = await getStockAnalysis(symbol);

    if (!data) return notFound();

    const isPositive = data.changePercent >= 0;

    return (
        <div className="min-h-screen bg-[var(--bg-app)] py-24 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-[var(--border-subtle)]">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tighter">{data.symbol}</h1>
                            <span className="px-4 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-muted)] text-sm font-medium">
                                {data.industry.name}
                            </span>
                        </div>
                        <p className="text-2xl text-[var(--text-muted)] mt-2">{data.name}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-6xl font-bold text-white tracking-tight">{getCurrencySymbol(data.currency)}{data.price.toFixed(2)}</div>
                        <div className={`text-2xl font-medium mt-2 flex items-center justify-end gap-2 ${isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                            {isPositive ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
                            {data.changePercent.toFixed(2)}%
                        </div>
                    </div>
                </header>


                {/* AI Verdict Section */}
                <div className="glass-panel p-8 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-l-4 border-indigo-400">
                    <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <span className="text-3xl">🤖</span> QuantWeb AI Verdict
                            </h2>
                            <p className="text-gray-300 mt-2 text-lg max-w-3xl leading-relaxed">
                                Based on multi-dimensional analysis (Market Technicals, Analyst Ratings, News Sentiment, and Industry Trend),
                                we have generated a composite strategy signal.
                            </p>
                        </div>
                        <div className="flex flex-col items-end min-w-[200px]">
                            <div className={`text-4xl font-bold ${data.verdict?.includes('STRONG BUY') ? 'text-emerald-500' :
                                data.verdict?.includes('BUY') ? 'text-emerald-400' :
                                    data.verdict === 'ACCUMULATE' ? 'text-blue-400' :
                                        data.verdict === 'HOLD' ? 'text-slate-400' :
                                            'text-red-400'
                                }`}>
                                {data.verdict || 'WATCH'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4 Dimensions Grid - Use explicit layout with more spacing */}
                <div className="stock-grid">

                    {/* Dimension 4: Market (Chart) - Full Width for better visibility */}
                    <div className="stock-col-12 glass-panel p-8 relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold flex items-center gap-3">
                                <Activity className="text-blue-400 w-8 h-8" />
                                Market Dimension
                            </h2>
                            <div className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${data.market.signal === 'buy' ? 'bg-emerald-500/20 text-emerald-400' :
                                data.market.signal === 'sell' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                RSI Trend: {data.market.signal} ({data.market.rsi.toFixed(0)})
                            </div>
                        </div>
                        <div className="w-full">
                            <StockChart data={data.market.history} />
                        </div>
                    </div>

                    {/* Dimension 2: Financials - Half Width */}
                    <div className="stock-col-6 glass-panel p-8 flex flex-col gap-8">
                        <h2 className="text-3xl font-bold flex items-center gap-3">
                            <DollarSign className="text-emerald-400 w-8 h-8" />
                            Financial Dimension
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl bg-slate-800/50 hover:bg-slate-800/80 transition-colors">
                                <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                                <p className="text-2xl font-bold text-white truncate">
                                    {getCurrencySymbol(data.currency)}{(data.financials.revenue / 1e9).toFixed(2)}B
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-800/50 hover:bg-slate-800/80 transition-colors">
                                <p className="text-sm text-gray-400 mb-1">Gross Profit</p>
                                <p className="text-2xl font-bold text-white truncate">
                                    {getCurrencySymbol(data.currency)}{(data.financials.grossProfit / 1e9).toFixed(2)}B
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-800/50 hover:bg-slate-800/80 transition-colors">
                                <p className="text-sm text-gray-400 mb-1">PE Ratio</p>
                                <p className="text-2xl font-bold text-white">{data.financials.peRatio?.toFixed(2) || 'N/A'}</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-800/50 hover:bg-slate-800/80 transition-colors">
                                <p className="text-sm text-gray-400 mb-1">Analyst Rating</p>
                                <p className="text-2xl font-bold text-indigo-400">{data.financials.recommendation}</p>
                            </div>
                        </div>
                    </div>

                    {/* Dimension 1: Industry Info - Half Width */}
                    <div className="stock-col-6 glass-panel p-8 flex flex-col gap-6">
                        <h2 className="text-3xl font-bold flex items-center gap-3">
                            <FileText className="text-purple-400 w-8 h-8" />
                            Industry Dimension
                        </h2>
                        <div className="space-y-6 flex-1">
                            <div className="p-6 rounded-2xl bg-slate-800/30 h-full">
                                <h3 className="text-xl font-semibold text-white mb-2">Business Summary</h3>
                                <p className="text-gray-300 text-base leading-relaxed">
                                    {data.industry.description}
                                </p>

                                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-[var(--border-subtle)]">
                                    <span className="text-gray-400">Sector Trend:</span>
                                    <span className={`text-lg font-bold uppercase ${data.industry.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                        {data.industry.trend === 'up' ? '↗ Bullish' : '↘ Bearish'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dimension 3: News & Sentiment - Full Width or Bottom */}
                    <div className="stock-col-12 glass-panel p-8">
                        <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
                            <Newspaper className="text-orange-400 w-8 h-8" />
                            News Dimension
                        </h2>
                        <div className="news-grid">
                            {data.news.map((item, i) => (
                                <a
                                    key={i}
                                    href={item.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex flex-col justify-between p-6 rounded-2xl bg-slate-800/30 hover:bg-slate-800/60 transition-all hover:scale-[1.02] border-t-2 border-transparent hover:border-indigo-500"
                                >
                                    <h4 className="font-semibold text-white mb-3 text-lg line-clamp-3 leading-snug">{item.title}</h4>
                                    <div className="flex justify-between items-center text-sm mt-4">
                                        <span className="text-gray-400 truncate max-w-[50%]">{item.publisher}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${item.sentiment === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
                                            item.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {item.sentiment}
                                        </span>
                                    </div>
                                </a>
                            ))}
                            {data.news.length === 0 && <p className="text-gray-500 text-lg p-4">No recent news found.</p>}
                        </div>
                    </div>

                </div>

                {/* Back Home */}
                <div className="flex justify-center pt-8">
                    <a href="/" className="px-8 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center gap-3 font-medium">
                        ← Back to Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}
