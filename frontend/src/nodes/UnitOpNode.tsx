import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

const nodeStyles: Record<string, { background: string; border: string; emoji: string }> = {
    feed:       { background: '#dbeafe', border: '#2563eb', emoji: '🔵' },
    pump:       { background: '#fef9c3', border: '#ca8a04', emoji: '⚙️' },
    mixer:      { background: '#dcfce7', border: '#16a34a', emoji: '🔀' },
    heater:     { background: '#fee2e2', border: '#dc2626', emoji: '🔥' },
    flash:      { background: '#f3e8ff', border: '#9333ea', emoji: '⚗️' },
    splitter:   { background: '#ffedd5', border: '#ea580c', emoji: '↔️' },
    vapor:      { background: '#e0f2fe', border: '#0284c7', emoji: '💨' },
    liquid:     { background: '#d1fae5', border: '#059669', emoji: '💧' },
};

export default function UnitOpNode( { data, id }: NodeProps ) {
    const style = nodeStyles[data.nodeType as string] ?? { background: '#f1f5f9', border: '#64748b', emoji: '📦' };
    return (
        <div style={{
            background: style.background,
            border: '2px solid ${style.border}',
            borderRadius: 8,
            padding: '8px 16px',
            minWidth: 80,
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 600,
            color: '#1e293b'
        }}>
            <Handle type="target" position={Position.Left} />
            <div>{style.emoji}</div>
            <div>{String(data.label)}</div>
            <Handle type="source" position={Position.Right} />
        </div>
    );
}