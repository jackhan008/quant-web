'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, X } from 'lucide-react';
import { getStockSuggestions } from '@/app/actions';

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Debounced search logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setIsLoading(true);
                const results = await getStockSuggestions(query);
                setSuggestions(results);
                setShowDropdown(true);
                setIsLoading(false);
            } else {
                setSuggestions([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (symbol: string) => {
        if (!symbol) return;
        setShowDropdown(false);
        setQuery(symbol);
        router.push(`/stock/${symbol.toUpperCase()}`);
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // If there's an exact match in suggestions, use it. Otherwise use the first suggestion.
        if (suggestions.length > 0) {
            const exactMatch = suggestions.find(s => s.symbol.toUpperCase() === query.toUpperCase());
            handleSearch(exactMatch ? exactMatch.symbol : suggestions[0].symbol);
        }
    };

    return (
        <form onSubmit={onSubmit} className="w-full max-w-2xl mx-auto relative">
            <div className="search-container">
                <div className="search-input-wrapper" ref={dropdownRef}>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center pointer-events-none">
                        {isLoading ? <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /> : <Search className="w-5 h-5 text-slate-400 transition-colors" />}
                    </div>

                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => query.length >= 2 && setShowDropdown(true)}
                        placeholder="Search symbol (e.g. 0700.HK, NVDA)"
                        className="search-input"
                    />

                    {query && (
                        <button
                            type="button"
                            onClick={() => { setQuery(''); setSuggestions([]); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    )}

                    {/* Dropdown Suggestions */}
                    {showDropdown && suggestions.length > 0 && (
                        <div className="search-dropdown">
                            {suggestions.map((s) => (
                                <div
                                    key={s.symbol}
                                    className="search-item"
                                    onClick={() => handleSearch(s.symbol)}
                                >
                                    <div className="flex flex-col">
                                        <span className="symbol">{s.symbol}</span>
                                        <span className="name">{s.name}</span>
                                    </div>
                                    <span className="exch">{s.exch}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No Results Fallback */}
                    {showDropdown && query.length >= 2 && !isLoading && suggestions.length === 0 && (
                        <div className="search-dropdown p-4 text-center text-gray-500 text-sm">
                            No ticker found for "{query}"
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={suggestions.length === 0 || isLoading}
                    className="search-btn"
                >
                    {isLoading ? 'Searching...' : 'Analyze Now'}
                </button>
            </div>
        </form>
    );
}
