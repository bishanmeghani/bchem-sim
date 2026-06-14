import type { ReactNode } from 'react'

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
            
            {/* Menu Bar */}
            <div style={{ height: 36, background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4, flexShrink: 0 }}>
                <MenuBar />
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
            <div style={{ height: 150, background: '#1e293b', borderTop: '1px solid #334155', flexShrink: 0 }}>
                <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1 }}>MESSAGES</div>
            </div>

        </div>
    );
}

function MenuBar() {
    const menus = ['File', 'Edit', 'Run', 'View', 'Tools', 'Help'];
    return (
        <>
            {menus.map(menu => (
                <div key={menu} style={{
                    padding: '4px 10px', fontSize: 12, color: '#94a3b8', cursor: 'pointer', borderRadius: 4,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    {menu}
                </div>
            ))}
        </>
    );
}