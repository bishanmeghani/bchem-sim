import React from 'react'
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { UNIT_OPS_DB } from '../data/unitOpsDatabase';
import { UNIT_OP_SYMBOLS } from '../data/unitOpsSymbols';

const positionMap: Record<string, Position> = {
    top: Position.Top,
    bottom: Position.Bottom,
    left: Position.Left,
    right: Position.Right
};

export default function UnitOpNode({ data }: NodeProps) {
    const nodeType = data.nodeType as string;
    const converged = data.converged as boolean ?? false;
    const renderSymbol = UNIT_OP_SYMBOLS[nodeType];
    const symbol = renderSymbol ? renderSymbol(converged) : (
        <svg width="36" height="36" viewBox="0 0 36 36">
            <rect x="2" y="2" width="32" height="32" fill="none" stroke="#64748b" strokeWidth="1.5"/>
        </svg>
    );
    const def = UNIT_OPS_DB[nodeType];
    const handles = def?.handles ?? [];

    return (
        <div style={{ background: "transparent", border: "none", padding: 0, textAlign: "center", position: 'relative' }}>
            {handles.map((h) => {
                const samePosition = handles.filter(x => x.position === h.position);
                const posIndex = samePosition.indexOf(h);
                const total = samePosition.length;

                const offsetStyle: React.CSSProperties = {};
                if (h.position === 'left' || h.position === 'right') {
                    offsetStyle.top = `${((posIndex + 1) / (total + 1)) * 100}%`;
                } else {
                    offsetStyle.left = `${((posIndex + 1) / (total + 1)) * 100}%`;
                }

                return (
                    <Handle
                        key={h.id}
                        id={h.id}
                        type={h.type}
                        position={positionMap[h.position]}
                        style={{
                            background: h.type === 'target' ? '#2563eb' : '#dc2626',
                            width: 8, height: 8,
                            border: '2px solid #0f172a',
                            ...offsetStyle
                        }}
                    />
                );
            })}
            {symbol}
            {/* Label absolutely positioned below, not affecting node bounds */}
            <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                color: "#94a3b8",
                fontSize: 9,
                marginTop: 4,
                fontFamily: "monospace",
                letterSpacing: 0.5,
                whiteSpace: 'nowrap',
                pointerEvents: 'none'
            }}>
                {String(data.label).toUpperCase()}
            </div>
        </div>
    );
}