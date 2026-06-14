import type React from "react"
import { UNIT_OPS_DB, PALETTE_CATEGORIES } from "../data/unitOpsDatabase";
import { UNIT_OP_SYMBOLS } from "../data/unitOpsSymbols";

export default function Palette() {
    const onDragStart = (e: React.DragEvent, type: string, label: string) => {
        e.dataTransfer.setData('nodeType', type);
        e.dataTransfer.setData('nodeLabel', label);
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div style={{
            position: 'absolute', top:16, right: 16, zIndex: 10,
            background: '#1e293b', borderRadius: 8, padding: 12,
            display: 'flex', flexDirection: 'column', gap: 6, minWidth: 130, 
            maxHeight: 'calc(100vh - 32px)',
            overflowY: 'auto'
        }}>
            <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>UNIT OPS</div>
            {PALETTE_CATEGORIES.map(category => {
                const ops = Object.values(UNIT_OPS_DB).filter(op => op.category === category);
                if (ops.length === 0) return null;
                return (
                    <div key={category}>
                        <div style={{ color: '#475569', fontSize: 9, fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>
                            {category.toUpperCase()}
                        </div>
                        {ops.map(op => (
                            <div key={op.type}
                                draggable
                                onDragStart={(e) => onDragStart(e, op.type, op.label)}
                                style={{
                                    background: '#334155', borderRadius: 6, padding: '6px 10px',
                                    color: 'white', fontSize: 12, cursor: 'grab',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    marginBottom: 4
                                }}>
                                {UNIT_OP_SYMBOLS[op.type]?.()}
                                <span>{op.label}</span>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}