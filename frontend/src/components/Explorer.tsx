import { useState } from 'react';
import { COMPONENTS_DB } from '../data/componentsDatabase';

export type SimulationComponents = string[];

interface ExplorerProps {
    components: SimulationComponents;
    onComponentsChange: (components: SimulationComponents) => void;
}

export default function Explorer({ components, onComponentsChange }: ExplorerProps) {
    const [showAddComponent, setShowAddComponent] = useState(false);

    const addComponent = (id: string) => {
        if (!components.includes(id)) {
            onComponentsChange([...components, id]);
        }
        setShowAddComponent(false);
    };

    const removeComponent = (id: string) => {
        onComponentsChange(components.filter(c => c !== id));
    };

    return (
        <div style={{ padding: '8px', fontSize: 11, color: '#94a3b8' }}>
            
            {/* Components */}
            <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#475569', fontWeight: 700, letterSpacing: 1, fontSize: 10, marginBottom: 6 }}>COMPONENTS</div>
                {components.map(id => {
                    const comp = COMPONENTS_DB[id];
                    return (
                        <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', background: '#0f172a', borderRadius: 4, marginBottom: 3 }}>
                            <span>{comp?.name ?? id} <span style={{ color: '#475569' }}>{comp?.formula}</span></span>
                            <span onClick={() => removeComponent(id)} style={{ cursor: 'pointer', color: '#475569', fontSize: 10 }}>✕</span>
                        </div>
                    );
                })}
                {showAddComponent ? (
                    <div style={{ marginTop: 4 }}>
                        {Object.values(COMPONENTS_DB)
                            .filter(c => !components.includes(c.id))
                            .map(c => (
                                <div key={c.id}
                                    onClick={() => addComponent(c.id)}
                                    style={{ padding: '4px 6px', cursor: 'pointer', borderRadius: 4, marginBottom: 2 }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    {c.name} — {c.formula}
                                </div>
                            ))}
                    </div>
                ) : (
                    <div onClick={() => setShowAddComponent(true)}
                        style={{ color: '#2563eb', cursor: 'pointer', fontSize: 10, marginTop: 4 }}>
                        + Add Component
                    </div>
                )}
            </div>

            {/* Thermodynamics */}
            <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#475569', fontWeight: 700, letterSpacing: 1, fontSize: 10, marginBottom: 6 }}>THERMODYNAMICS</div>
                <div style={{ padding: '4px 6px', background: '#0f172a', borderRadius: 4, fontSize: 11 }}>
                    Raoult's Law (Ideal)
                </div>
            </div>

            {/* Solver */}
            <div>
                <div style={{ color: '#475569', fontWeight: 700, letterSpacing: 1, fontSize: 10, marginBottom: 6 }}>SOLVER</div>
                <div style={{ padding: '4px 6px', background: '#0f172a', borderRadius: 4, fontSize: 11 }}>
                    Wegstein — tol: 1e-4
                </div>
            </div>

        </div>
    );
}
