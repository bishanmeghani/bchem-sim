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
        <div style={{
            background: "transparent",
            border: "none",
            padding: 0,
            textAlign: "center",
        }}>
            {handles.map(h => (
                <Handle
                    key={h.id}
                    id={h.id}
                    type={h.type}
                    position={positionMap[h.position]}
                    style={{ background: '#94a3b8', width: 7, height: 7 }}
                />
            ))}
            {symbol}
            <div style= {{ color: "#94a3b8", fontSize: 9, marginTop: 2, fontFamily: "monospace", letterSpacing: 0.5 }}>
                {String(data.label).toUpperCase()}
            </div>
        </div>
    );
}