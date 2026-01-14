import { cookies } from 'next/headers';
import { Language } from './translations';

export async function getLanguage(): Promise<Language> {
    const cookieStore = await cookies();
    const lang = cookieStore.get('lang')?.value;
    return (lang === 'zh' ? 'zh' : 'en') as Language;
}
