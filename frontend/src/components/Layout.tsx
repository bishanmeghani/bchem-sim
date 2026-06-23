import React from 'react';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Node } from '@xyflow/react';
import Palette from './Palette';
import Explorer from './Explorer';
import PropertiesPanel from './PropertiesPanel';

interface LayoutProps {
    children: ReactNode;
    onRun?: () => void;
    onNew?: () => void;
    onFitView?: () => void;
    result?: string | null;
    loading?: boolean;
    components?: string[];
    onComponentsChange?: (c: string[]) => void;
    selectedNode?: Node | null;
    onNodeDataChange?: (id: string, data: Record<string, unknown>) => void;
}

const COLLAPSE_THRESHOLD = 125;

export default function Layout({ children, onRun, onNew, onFitView, result, loading, components, onComponentsChange, selectedNode, onNodeDataChange }: LayoutProps) {
    const [explorerWidth, setExplorerWidth] = useState(200);
    const [messagesHeight, setMessagesHeight] = useState(150);
    const [rightPanelWidth, setRightPanelWidth] = useState(200);

    const onExplorerDrag = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = explorerWidth;
        const onMouseMove = (e: MouseEvent) => {
            const newWidth = startWidth + e.clientX - startX 
            setExplorerWidth(newWidth < COLLAPSE_THRESHOLD ? 32 : Math.min(500, newWidth));
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp)
    };

    const onRightPanelDrag = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = rightPanelWidth;

        const onMouseMove = (e: MouseEvent) => {
            const newWidth = startWidth - (e.clientX - startX);
            setRightPanelWidth(newWidth < COLLAPSE_THRESHOLD ? 32 : Math.min(500, newWidth));
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp)
    };

    const onMessagesDrag = (e: React.MouseEvent) => {
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = messagesHeight;
        const onMouseMove = (e: MouseEvent) => {
            const newHeight = startHeight - (e.clientY - startY);
            setMessagesHeight(newHeight < 60 ? 32 : Math.min(400, newHeight));
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const explorerCollapsed = explorerWidth <= 32;
    const messagesCollapsed = messagesHeight <= 32;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
            
            {/* Menu Bar */}
            <div style={{ height: 36, background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4, flexShrink: 0 }}>
                <MenuBar onRun={onRun} onNew={onNew} onFitView={onFitView} />
            </div>

            {/* Main area */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* Explorer */}
                <div style={{ width: explorerWidth, background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1, display: 'flex', justifyContent: explorerCollapsed ? 'center' : 'space-between', alignItems: 'center' }}>
                        {!explorerCollapsed && <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1 }}>EXPLORER</span>}
                        <span onClick={() => setExplorerWidth(explorerCollapsed ? 200 : 32)} style={{ cursor: 'pointer', color: '#475569', fontSize: 14 }}>
                            {explorerCollapsed ? '▶' : '◀'}
                        </span>
                    </div>
                    {!explorerCollapsed && <Explorer components={components ?? []} onComponentsChange={onComponentsChange ?? (() => {})} />}
                        <div
                            onMouseDown={onExplorerDrag}
                            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, cursor: 'ew-resize', background: 'transparent', zIndex: 10 }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        />
                </div>

                {/* Canvas */}
                <div style={{ flex: 1, position: 'relative' }}>
                    {children}
                </div>

                {/* Right Panel */}
                <RightPanel width={rightPanelWidth} onDrag={onRightPanelDrag} onCollapse={() => setRightPanelWidth(32)} onExpand={() => setRightPanelWidth(220)} selectedNode={selectedNode} onNodeDataChange={onNodeDataChange} components={components}/>

            </div>

            {/* Messages — outside the flex row, at the bottom */}
            <div style={{ height: messagesHeight, background: '#1e293b', borderTop: '1px solid #334155', flexShrink: 0, overflowY: 'auto', position: 'relative' }}>
                <div onMouseDown={onMessagesDrag}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, cursor: 'ns-resize', background: 'transparent', zIndex: 10 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')} />
                <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {!messagesCollapsed && <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1 }}>MESSAGES</span>}
                    <span onClick={() => setMessagesHeight(messagesCollapsed ? 150 : 32)} style={{ cursor: 'pointer', color: '#475569', fontSize: 14, marginLeft: 'auto' }}>
                        {messagesCollapsed ? '▲' : '▼'}
                    </span>
                </div>
                {!messagesCollapsed && loading && <div style={{ padding: '4px 12px', fontSize: 11, color: '#94a3b8' }}>Running simulation...</div>}
                {!messagesCollapsed && result && <pre style={{ padding: '4px 12px', fontSize: 10, color: '#94a3b8', margin: 0, whiteSpace: 'pre-wrap' }}>{result}</pre>}
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

function RightPanel({ width, onDrag, onCollapse, onExpand, selectedNode, onNodeDataChange, components }: { width: number; onDrag: (e: React.MouseEvent) => void; onCollapse: () => void; onExpand: () => void; selectedNode?: Node | null; onNodeDataChange?: (id: string, data: Record<string, unknown>) => void; components?: string[];}) {
    const [activeTab, setActiveTab] = useState<'unitops' | 'properties'>('unitops');
    const collapsed = width <= 32;

    useEffect(() => {
        if (selectedNode) setActiveTab('properties');
    }, [selectedNode]);

    return (
        <div style={{ width, background: '#1e293b', borderLeft: '1px solid #334155', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            <div onMouseDown={onDrag}
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, cursor: 'ew-resize', background: 'transparent', zIndex: 10 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')} />
            {/*Tabs*/}
            <div style={{ display: 'flex', borderBottom: '1px solid #334155', alignItems: 'center' }}>
                {!collapsed && (['unitops', 'properties'] as const).map(tab => (
                    <div key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1, padding: '6px 8px', fontSize: 10, fontWeight: 700,
                            color: activeTab === tab ? '#e2e8f0' : '#475569',
                            background: activeTab === tab ? '#0f172a' : 'transparent',
                            cursor: 'pointer', textAlign: 'center', letterSpacing: 0.5
                        }}>
                        {tab === 'unitops' ? 'UNIT OPS' : 'PROPERTIES'}
                    </div>
                ))}
                <span onClick={() => collapsed ? onExpand() : onCollapse()} 
                    style={{ cursor: 'pointer', color: '#475569', fontSize: 12, padding: '6px 8px', marginLeft: 'auto' }}>
                    {collapsed ? '◀' : '▶'}
                </span>
            </div>
            {/* Content */}
            {!collapsed && (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {activeTab === 'unitops' && <Palette embedded />}
                    {activeTab === 'properties' && (
                        selectedNode ? <PropertiesPanel node={selectedNode} components={components ?? []} onNodeDataChange={onNodeDataChange ?? (() => {})} /> :
                        <div style={{ padding: '8px 12px', fontSize: 11, color: '#475569' }}>Select a unit to view properties.</div>
                    )}
                </div>
            )}
        </div>
    );
}