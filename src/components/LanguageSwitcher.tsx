'use client';

import { useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher({ currentLang }: { currentLang: string }) {
    const router = useRouter();

    const toggleLanguage = () => {
        const newLang = currentLang === 'en' ? 'zh' : 'en';
        document.cookie = `lang=${newLang}; path=/; max-age=31536000`; // 1 year
        router.refresh();
    };

    return (
        <button
            onClick={toggleLanguage}
            className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-indigo-500/30 text-white hover:border-indigo-500 transition-all shadow-lg"
        >
            <Languages size={18} className="text-indigo-400" />
            <span className="text-sm font-bold uppercase">
                {currentLang === 'en' ? '中文' : 'ENG'}
            </span>
        </button>
    );
}
