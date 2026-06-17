import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface LayoutProps {
    children: ReactNode;
    onRun?: () => void;
    onNew?: () => void;
    onFitView?: () => void;
    result?: string | null;
    loading?: boolean;
}

export default function Layout({ children, onRun, onNew, onFitView, result, loading }: LayoutProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
            
            {/* Menu Bar */}
            <div style={{ height: 36, background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4, flexShrink: 0 }}>
                <MenuBar onRun={onRun} onNew={onNew} onFitView={onFitView} />
            </div>

            {/* Main area */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* Explorer */}
                <div style={{ width: 200, background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                    <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1 }}>EXPLORER</div>
                </div>

                {/* Canvas */}
                <div style={{ flex: 1, position: 'relative' }}>
                    {children}
                </div>

                {/* Properties */}
                <div style={{ width: 220, background: '#1e293b', borderLeft: '1px solid #334155', flexShrink: 0 }}>
                    <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1 }}>PROPERTIES</div>
                </div>

            </div>

            {/* Messages — outside the flex row, at the bottom */}
            <div style={{ height: 150, background: '#1e293b', borderTop: '1px solid #334155', flexShrink: 0, overflowY: 'auto' }}>
                <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1 }}>MESSAGES</div>
                {loading && <div style={{ padding: '4px 12px', fontSize: 11, color: '#94a3b8' }}>Running simulation...</div>}
                {result && <pre style={{ padding: '4px 12px', fontSize: 10, color: '#94a3b8', margin: 0, whiteSpace: 'pre-wrap' }}>{result}</pre>}

            </div>

        </div>
    );
}

function MenuBar({ onRun, onNew, onFitView }: { onRun?: () => void; onNew?: () => void; onFitView?: () => void}) {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);        
    }, []);

    const menuItems: Record<string, { label: string; action?: () => void}[]> = {
        File: [
            { label: 'New', action: onNew },
            { label: 'Save' },
            { label: 'Export' },
        ],
        Edit: [
            { label: 'Undo' },
            { label: 'Redo' },
            { label: 'Delete' },
        ],
        Run: [
            { label: 'Run Simulation', action: onRun },
        ],
        View: [
            { label: 'Fit to Screen', action: onFitView },
        ],
        Tools: [
            { label: 'Settings' },
        ],
        Help: [
            { label: 'About' },
        ],
    };

    return (
        <div style={{ display: 'flex', position: 'relative' }}>
            {Object.entries(menuItems).map(([menu, items]) => (
                <div key={menu} style={{ position: 'relative' }}>
                    <div
                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === menu ? null : menu); }}
                        style={{ padding: '4px 10px', fontSize: 12, color: '#94a3b8', cursor: 'pointer', borderRadius: 4, background: activeMenu === menu ? '#334155' : 'transparent' }}>
                        {menu}
                    </div>
                    {activeMenu === menu && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, minWidth: 160, boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                        }}>
                            {items.map(item => (
                                <div key={item.label}
                                    onClick={() => { item.action?.(); setActiveMenu(null); }}
                                    style={{ padding: '6px 12px', fontSize: 12, color: '#e2e8f0', cursor: 'pointer' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    {item.label}
                               </div>
                        ))}
                    </div>
                )}
            </div>
        ))}
    </div>
    );
}