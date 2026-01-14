import yahooFinance from 'yahoo-finance2';
import { getCurrencySymbol } from './utils';

// Fix for Next.js/ESM: sometimes default export is the Class, not instance
const yf = typeof yahooFinance === 'function' ? new (yahooFinance as any)() : yahooFinance;
if (yf.suppressNotices) {
    yf.suppressNotices(['yahooSurvey']);
}

// Simple in-memory cache to prevent inconsistency between dashboard and detail page renders
const VOLATILE_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10000; // 10 seconds is enough to sync page transitions

export interface StockAnalysis {
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
    industry: {
        name: string;
        description: string;
        trend: 'up' | 'down' | 'neutral';
    };
    financials: {
        revenue: number; // TTM
        grossProfit: number;
        peRatio: number;
        recommendation: string;
    };
    news: {
        title: string;
        link: string;
        publisher: string;
        sentiment: 'positive' | 'negative' | 'neutral';
    }[];
    market: {
        history: { date: string; close: number }[];
        signal: 'buy' | 'sell' | 'hold';
        rsi: number;
    };
    currency?: string;
    verdict?: string;
}

function calculateRSI(closes: number[]): number {
    if (closes.length < 14) return 50;

    // Use all provided closes to calculate intervals (usually 15 closes -> 14 intervals)
    let gains = 0;
    let losses = 0;
    for (let i = 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff > 0) gains += diff;
        else losses -= diff;
    }

    const intervals = closes.length - 1;
    const avgGain = gains / intervals;
    const avgLoss = losses / intervals;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}



// Helper to process news consistently
export function processNews(newsItems: any[]) {
    // Sort news by title to ensure deterministic sentiment calculation regardless of API order
    const sorted = [...newsItems].sort((a, b) => (a.title || '').localeCompare(b.title || ''));

    return sorted.map((n: any) => {
        const title = n.title.toLowerCase();
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        // Note: Removed 'buy'/'sell' from sentiment words to avoid feedback loops with the strategy
        if (title.includes('growth') || title.includes('beat') || title.includes('record') || title.includes('up') || title.includes('jump') || title.includes('surge') || title.includes('optimistic')) sentiment = 'positive';
        else if (title.includes('miss') || title.includes('down') || title.includes('fall') || title.includes('risk') || title.includes('drop') || title.includes('plunge') || title.includes('bearish')) sentiment = 'negative';

        return {
            title: n.title,
            link: n.link,
            publisher: n.publisher,
            sentiment
        };
    });
}

// Shared strategy logic
function getAnalystScore(summary: any): number {
    // 1. Try Recommendation Trend (Detailed)
    // Boost weights for analysts to be more impactful
    const rec = summary.recommendationTrend?.trend?.[0];
    if (rec) {
        const total = (rec.buy || 0) + (rec.hold || 0) + (rec.sell || 0) + (rec.strongBuy || 0) + (rec.underperform || 0);
        if (total > 0) {
            const weightedScore = (((rec.strongBuy || 0) * 2.5) + ((rec.buy || 0) * 1.5) + ((rec.hold || 0) * 0) + ((rec.underperform || 0) * -1.5) + ((rec.sell || 0) * -2.5)) / total;
            return weightedScore * 8; // Reduced from 12 to 8 to avoid fundamental bias
        }
    }

    // 2. Fallback: Recommendation Key (Simple)
    const key = summary.financialData?.recommendationKey;
    if (key) {
        switch (key) {
            case 'strong_buy': return 25;
            case 'buy': return 15;
            case 'overweight': return 10;
            case 'hold': return 0;
            case 'underweight': return -10;
            case 'sell': return -20;
            case 'strong_sell': return -30;
        }
    }

    return 0; // Neutral if no data
}

/**
 * Fundamental Quality Score (Buffett/Munger Logic)
 * Focuses on Moat (Margins), Efficiency (ROE), Growth, and Valuation
 */
function getQualityScore(summary: any): number {
    let qScore = 0;
    const fin = summary.financialData;
    const stats = summary.defaultKeyStatistics;

    if (!fin) return 0;

    // 1. Profitability (Moat)
    // High margins usually indicate a strong competitive moat
    const margin = fin.profitMargins || 0;
    if (margin > 0.30) qScore += 12;      // Ultra high-tier (e.g. Software/Apple)
    else if (margin > 0.15) qScore += 7; // Solid tier
    else if (margin < 0.05) qScore -= 10; // Commodity/Low-moat business

    // 2. Management Efficiency (ROE)
    // Buffett's favorite metric: Return on Equity
    const roe = fin.returnOnEquity || 0;
    if (roe > 0.25) qScore += 12;        // Exceptional efficiency
    else if (roe > 0.15) qScore += 7;   // Good management
    else if (roe < 0.05) qScore -= 5;    // Poor capital allocation

    // 3. Growth Stability
    const growth = fin.revenueGrowth || 0;
    if (growth > 0.15) qScore += 6;      // Strong expansion
    else if (growth < 0) qScore -= 10;   // Shrinking business

    // 4. Valuation (Reasonable Price)
    // "It's better to buy a wonderful company at a fair price than a fair company at a wonderful price."
    const pe = summary.summaryDetail?.trailingPE || stats?.forwardPE || 0;
    if (pe > 60) qScore -= 15;           // Too expensive, even for quality
    else if (pe > 40) qScore -= 5;       // Premium price
    else if (pe > 0 && pe < 15) qScore += 5; // Value territory

    return qScore;
}

// Weighted Scoring Strategy
function getStrategy(summary: any, quote: any, newsItems: any[] = [], rsi: number | null = null): string {
    let score = 0;

    // 1. Fundamental Quality (Anchor - ~35% Weight)
    const qualityScore = getQualityScore(summary);
    score += qualityScore;

    // 2. Analyst Consensus (~25% Weight)
    const analystScore = getAnalystScore(summary);
    score += analystScore;

    // 2. Technicals (Max ~25, Min -25)
    let techScore = 0;
    if (rsi !== null) {
        if (rsi < 30) techScore = 25; // Extremely Oversold -> High confidence buy
        else if (rsi < 45) techScore = 8;  // Minor Dip -> Cautious accumulate (Reduced from 15)
        else if (rsi > 80) techScore = -30; // Extreme Bubble
        else if (rsi > 70) techScore = -20; // Overbought (Increased penalty)
        else if (rsi > 60) techScore = -10; // Slightly Frothy
    } else {
        // Fallback to MA50
        const ma50 = quote.fiftyDayAverage;
        const price = quote.regularMarketPrice;
        if (ma50 && price) {
            const diff = (price - ma50) / ma50;
            if (diff > 0.05) techScore = 10;
            else if (diff < -0.05) techScore = -15; // Harder penalty for downtrend
        }
    }
    score += techScore;

    // 2.1 Momentum Penalty (Daily Change)
    // If the stock is dropping significantly TODAY, subtract points regardless of RSI
    const dailyChange = quote.regularMarketChangePercent || 0;
    if (dailyChange < -2) score -= 15; // Sharp drop - move to HOLD/REDUCE
    else if (dailyChange < -1) score -= 5;
    else if (dailyChange > 2) score += 5; // Positive momentum

    // 2.2 Cycle Caution (52-Week High Check)
    // "Be fearful when others are greedy." Avoid buying at the exact peak.
    const yearHigh = quote.fiftyTwoWeekHigh;
    const currentPrice = quote.regularMarketPrice;
    if (yearHigh && currentPrice) {
        const proximityToHigh = (yearHigh - currentPrice) / yearHigh;
        if (proximityToHigh < 0.02) { // Within 2% of all-time/year high
            score -= 15; // "High Ground" penalty

            // Double penalty if valuation is also high
            const pe = summary.summaryDetail?.trailingPE || 0;
            if (pe > 35) score -= 10;
        } else if (proximityToHigh < 0.05) {
            score -= 5;
        }
    }

    // 3. News Sentiment (Max +15, Min -25) - Tuned down penalties
    let negativeNews = 0;
    let positiveNews = 0;
    let newsScore = 0;
    if (newsItems.length > 0) {
        negativeNews = newsItems.filter((n: any) => n.sentiment === 'negative').length;
        positiveNews = newsItems.filter((n: any) => n.sentiment === 'positive').length;

        if (negativeNews >= 2) newsScore = -25; // Was -30/40
        else if (negativeNews === 1) newsScore = -10;

        if (positiveNews >= 2) newsScore = 15;
        else if (positiveNews === 1) newsScore = 5;
    }
    score += newsScore;

    // 4. Final Verdict
    if (Number.isNaN(score)) score = 0;

    // Stricter Thresholds
    if (score >= 45) return 'STRONG BUY';
    if (score >= 25) return 'BUY';
    if (score >= 10) return 'ACCUMULATE';
    if (score >= -10) return 'HOLD';
    if (score >= -30) return 'REDUCE';
    return 'SELL';
}

/**
 * Unified DATA FETCHER to ensure Homepage and Detail page use EXACTLY the same inputs.
 */
async function getUnifiedStrategyData(symbol: string) {
    const now = Date.now();
    const cached = VOLATILE_CACHE.get(symbol);
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
        return cached.data;
    }

    try {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        const [quote, summary, news, history] = await Promise.all([
            yf.quote(symbol),
            yf.quoteSummary(symbol, { modules: ['recommendationTrend', 'financialData', 'defaultKeyStatistics', 'summaryDetail', 'summaryProfile'] }),
            yf.search(symbol, { newsCount: 5 }),
            yf.historical(symbol, {
                period1: formatDate(thirtyDaysAgo),
                period2: formatDate(today),
                interval: '1d'
            })
        ]);

        const processedNews = processNews(news.news || []);
        const closes = history.map((h: any) => h.close);
        const rsi = calculateRSI(closes.slice(-15));
        const strategy = getStrategy(summary, quote, processedNews, rsi);

        const result = { quote, summary, news: processedNews, rsi, strategy, history };
        VOLATILE_CACHE.set(symbol, { data: result, timestamp: now });
        return result;
    } catch (e) {
        return null;
    }
}

export async function getStockAnalysis(symbol: string, lang: 'en' | 'zh' = 'en'): Promise<StockAnalysis | null> {
    try {
        const unified = await getUnifiedStrategyData(symbol);
        if (!unified) return null;

        const { quote, summary, news, rsi, strategy, history } = unified;

        // 1. Industry
        const industryName = summary.summaryProfile?.industry || 'Unknown';
        const sector = summary.summaryProfile?.sector || 'Unknown';

        // 2. Financials
        const financials = summary.financialData;

        return {
            symbol: quote.symbol,
            name: quote.longName || quote.shortName || symbol,
            price: quote.regularMarketPrice || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            currency: quote.currency,
            industry: {
                name: `${sector} - ${industryName}`,
                description: summary.summaryProfile?.longBusinessSummary?.slice(0, 150) + '...' || '',
                trend: quote.regularMarketChangePercent && quote.regularMarketChangePercent > 0 ? 'up' : 'down',
            },
            financials: {
                revenue: financials?.totalRevenue || 0,
                grossProfit: financials?.grossProfits || 0,
                peRatio: summary.summaryDetail?.trailingPE || 0,
                recommendation: strategy,
            },
            news: news,
            market: {
                history: history.map((h: any) => ({ date: h.date.toISOString().split('T')[0], close: h.close })),
                signal: rsi < 30 ? 'buy' : rsi > 70 ? 'sell' : 'hold',
                rsi
            },
            verdict: strategy
        };

    } catch (error) {
        return null;
    }
}

export async function searchStocks(query: string) {
    try {
        const result = await yf.search(query, { quotesCount: 5, newsCount: 0 });
        // @ts-ignore
        return result.quotes.filter((q: any) => q.isYahooFinance).map((q: any) => ({
            symbol: q.symbol,
            name: q.shortname || q.longname || q.symbol,
            exch: q.exchDisp
        }));
    } catch (e) {
        return [];
    }
}

// Disable caching for Yahoo Finance requests to ensure real-time data
const queryOptions = { validateResult: false };

export async function getMarketOverview() {
    const tickers = [
        // US Tech Giants
        'AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'AMD', 'AVGO', 'NFLX',
        // HK Market Leaders
        '0700.HK', '9988.HK', '3690.HK', '1810.HK', '1024.HK', '9618.HK', '9888.HK', '0388.HK', '0941.HK', '1211.HK', '2318.HK', '1398.HK', '0939.HK', '3968.HK', '2269.HK', '0005.HK',
        // A-Share (China Mainland)
        '600519.SS', '300750.SZ', '000858.SZ', '601318.SS', '600036.SS', '002594.SZ', '600900.SS', '601012.SS', '000001.SZ', '601857.SS',
        // Global Giants
        'V', 'MA', 'DIS', 'NKE', 'CRM', 'ORCL', 'ASML', 'TSM'
    ];

    const promises = tickers.map(async (t) => {
        const unified = await getUnifiedStrategyData(t);
        if (!unified) return null;

        return {
            symbol: t,
            name: unified.quote.shortName || unified.quote.longName || t,
            price: unified.quote.regularMarketPrice,
            change: unified.quote.regularMarketChangePercent,
            currency: unified.quote.currency,
            strategy: unified.strategy
        };
    });

    const results = await Promise.all(promises);
    return results.filter(Boolean);
}

