'use server';

import { searchStocks } from '@/lib/stockService';

export async function getStockSuggestions(query: string) {
    if (!query || query.length < 2) return [];
    return await searchStocks(query);
}
