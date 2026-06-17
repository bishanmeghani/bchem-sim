import type { JSX } from 'react/jsx-runtime';

export const UNIT_OP_SYMBOLS: Record<string, (converged?: boolean) => JSX.Element> = {
    feed: () => (
        <svg width="40" height="24" viewBox="0 0 50 30">
            <polygon points="0,0 40,15 0,30" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5"/>
        </svg>
    ),
    pump: () => (
        <svg width="30" height="30" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#ca8a04" strokeWidth="1.5"/>
            <line x1="18" y1="2" x2="18" y2="18" stroke="#ca8a04" strokeWidth="1.5"/>
            <line x1="2" y1="18" x2="18" y2="18" stroke="#ca8a04" strokeWidth="1.5"/>
        </svg>
    ),
    mixer: () => (
        <svg width="30" height="30" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#16a34a" strokeWidth="1.5"/>
            <line x1="6" y1="6" x2="30" y2="30" stroke="#16a34a" strokeWidth="1.5"/>
            <line x1="30" y1="6" x2="6" y2="30" stroke="#16a34a" strokeWidth="1.5"/>
        </svg>
    ),
    heater: () => (
        <svg width="30" height="30" viewBox="0 0 36 38">
        <circle cx="18" cy="19" r="16" fill="none" stroke="#dc2626" strokeWidth="1.5"/>
        <polyline points="3,22 12,22 18,11 24,22 33,22" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
    ),
    flash: () => (
        <svg width="24" height="36" viewBox="0 0 36 52">
            <rect x="4" y="4" width="24" height="44" rx="3"fill="none" stroke="#9333ea" strokeWidth="1.5"/>
            <line x1="4" y1="18" x2="28" y2="18" stroke="#9333ea" strokeWidth="1.5"/>
        </svg>
    ),
    splitter: () => (
        <svg width="30" height="30" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#ea580c" strokeWidth="1.5"/>
            <line x1="2" y1="18" x2="34" y2="18" stroke="#ea580c" strokeWidth="1.5"/>
            <line x1="18" y1="2" x2="18" y2="34" stroke="#ea580c" strokeWidth="1.5"/>
        </svg>
    ),
    outlet: (converged = false) => (
        <svg width="40" height="24" viewBox="0 0 50 30">
            <polygon points="0,0 40,15 0,30" fill={converged ? "#16a34a" : "#dc2626"} stroke={converged ? "#15803d" : "#b91c1c"} strokeWidth="1.5"/>
        </svg>
    ),
};