'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function StockChart({ data }: { data: { date: string; close: number }[] }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-gray-500">No chart data available</div>;

    const isPositive = data[data.length - 1].close >= data[0].close;
    const color = isPositive ? '#10b981' : '#ef4444';

    // Fixed height container for stability
    return (
        <div className="w-full mt-6" style={{ height: '400px' }}>
            {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            hide
                        />
                        <YAxis
                            domain={['auto', 'auto']}
                            orientation="right"
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            width={50}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                            itemStyle={{ color: '#f8fafc' }}
                            labelStyle={{ color: '#94a3b8' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="close"
                            stroke={color}
                            fillOpacity={1}
                            fill="url(#colorPrice)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="w-full h-full bg-slate-800/10 animate-pulse rounded-2xl" />
            )}
        </div>
    );
}
