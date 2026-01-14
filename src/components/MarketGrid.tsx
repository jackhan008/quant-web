'use client';

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/utils';
import { translations, Language } from '@/lib/translations';

export default function MarketGrid({ initialData, lang = 'en' }: { initialData: any[], lang?: Language }) {
    const [filter, setFilter] = useState('ALL');
    const t = translations[lang];

    const categories = [
        { id: 'ALL', label: t.allStocks },
        { id: 'STRONG BUY', label: t.strongBuy },
        { id: 'BUY', label: t.buy },
        { id: 'ACCUMULATE', label: t.accumulate },
        { id: 'HOLD', label: t.hold },
        { id: 'REDUCE', label: t.reduceSell }
    ];

    const filteredData = initialData.filter((stock: any) => {
        if (!stock) return false;
        if (filter === 'ALL') return true;
        if (filter === 'REDUCE') return stock.strategy === 'REDUCE' || stock.strategy === 'SELL';
        return stock.strategy === filter;
    });

    return (
        <div className="w-full flex flex-col items-center">
            {/* Filter Tabs */}
            <div className="filter-tabs">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id)}
                        className={`filter-tab ${filter === cat.id ? 'active' : ''}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="w-full max-w-5xl market-grid">
                {filteredData.length > 0 ? (
                    filteredData.map((stock: any) => {
                        const isPositive = stock.change >= 0;
                        const localizedStrategy = (t as any)[stock.strategy] || stock.strategy;

                        return (
                            <a
                                key={stock.symbol}
                                href={`/stock/${stock.symbol}`}
                                className="glass-panel p-6 flex flex-col gap-2 hover:scale-[1.02] transition-transform cursor-pointer group relative overflow-hidden h-full"
                            >
                                {stock.strategy && (
                                    <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-xl ${stock.strategy.includes('STRONG BUY') ? 'bg-emerald-500 text-black' :
                                        stock.strategy.includes('BUY') ? 'bg-emerald-400 text-black' :
                                            stock.strategy === 'ACCUMULATE' ? 'bg-blue-400 text-black' :
                                                stock.strategy === 'HOLD' ? 'bg-slate-500 text-white' :
                                                    'bg-red-500 text-white'
                                        }`}>
                                        {localizedStrategy}
                                    </div>
                                )}

                                <div className="flex justify-between items-start mt-2">
                                    <div>
                                        <h3 className="font-bold text-xl text-white group-hover:text-indigo-400 transition-colors">{stock.symbol}</h3>
                                        <p className="text-xs text-gray-400 truncate max-w-[140px]">{stock.name}</p>
                                    </div>
                                    <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                                        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                        {stock.change?.toFixed(2)}%
                                    </div>
                                </div>
                                <div className="mt-4 text-2xl font-semibold text-white">
                                    {getCurrencySymbol(stock.currency)}{stock.price?.toFixed(2)}
                                </div>
                            </a>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 text-center text-gray-500 glass-panel">
                        {t.noMatch}
                    </div>
                )}
            </div>
        </div>
    );
}
