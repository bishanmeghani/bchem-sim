import type React from "react"

const unitOps = [
     { type: 'feed',    label:'Feed',           emoji: '🔵'},
     { type: 'pump',    label:'Pump',           emoji: '⚙️'},
     { type: 'mixer',    label:'Mixer',         emoji: '🔀'},
     { type: 'heater',    label:'Heater',       emoji: '🔥'},
     { type: 'flash',    label:'Flash Drum',    emoji: '⚗️'},
     { type: 'splitter',    label:'Splitter',   emoji: '↔️'},
     { type: 'vapor',    label:'Vapor Out',     emoji: '💨'},
     { type: 'liquid',    label:'Liquid Out',   emoji: '💧'},
]

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
            {unitOps.map(op => (
                <div key={op.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, op.type, op.label)}
                    style={{
                        background: '#334155', borderRadius: 6, padding: '6px 10px',
                        color: 'white', fontSize: 12, cursor: 'grab',
                        display: 'flex', alignItems: 'center', gap: 8
                    }}>
                    {op.emoji} {op.label}
                </div>
            ))}
        </div>
    );
}