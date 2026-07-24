import { useState } from 'react';
import type { Node } from '@xyflow/react'
import { COMPONENTS_DB } from '../data/componentsDatabase';
import React from 'react';

interface PropertiesPanelProps {
    node: Node;
    components: string[];
    onNodeDataChange: (id: string, data: Record<string, unknown>) => void;
}

const inputStyle = {
    background: '#0f172a', border: '1px solid #334155', borderRadius: 4,
    color: '#e2e8f0', fontSize: 11, padding: '4px 8px', width: '100%',
    boxSizing: 'border-box' as const
}
const labelStyle = { fontSize: 10, color: '#475569', marginBottom: 2, display: 'block' as const };
const fieldStyle = { marginBottom: 10 };

function BasisToggle({ basis, setBasis }: { basis: 'mass' | 'molar'; setBasis: (b: 'mass' | 'molar') => void }) {
    return (
         <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {(['molar', 'mass'] as const).map(b => (
                <div key={b} onClick={() => setBasis(b)}
                    style={{ flex: 1, padding: '3px 6px', fontSize: 9, fontWeight: 700, textAlign: 'center',
                        cursor: 'pointer', borderRadius: 4, letterSpacing: 0.5,
                        background: basis === b ? '#2563eb' : '#0f172a',
                        color: basis === b ? 'white' : '#475569' }}>
                    {b === 'mass' ? 'MASS' : 'MOLAR'}
                </div>
            ))}
         </div>
    );
}

function FractionInput({ value, readOnly, onChange, inputStyle }: {
    value: number;
    readOnly?: boolean;
    onChange?: (v: number) => void;
    inputStyle: React.CSSProperties;
}) {
    const [local, setLocal] = useState(value.toFixed(4));
    
    // sync if external value changes significantly
    React.useEffect(() => {
        setLocal(value.toFixed(4));
    }, [value]);

    return (
        <input
            style={{ ...inputStyle, color: readOnly ? '#64748b' : '#e2e8f0' }}
            type="number" min="0" max="1" step="0.01"
            value={local}
            readOnly={readOnly}
            onChange={e => setLocal(e.target.value)}
            onBlur={() => {
                const parsed = parseFloat(local);
                if (!isNaN(parsed) && onChange) onChange(parsed);
            }}
        />
    );
}

function NumberInput({ value, readOnly, onChange, inputStyle }: {
    value: number;
    readOnly?: boolean;
    onChange?: (v: number) => void;
    inputStyle: React.CSSProperties;
}) {
    const [local, setLocal] = useState(String(value));

    React.useEffect(() => {
        setLocal(String(value));
    }, [value]);

    return (
        <input
            style={{ ...inputStyle, color: readOnly ? '#64748b' : '#e2e8f0' }}
            type="number"
            value={local}
            readOnly={readOnly}
            onChange={e => setLocal(e.target.value)}
            onBlur={() => {
                const parsed = parseFloat(local);
                if (!isNaN(parsed) && onChange) onChange(parsed);
            }}
        />
    );
}

function FeedProperties({ data, components, update }: {
    data: Record<string, unknown>;
    components: string[];
    update: (key: string, value: unknown) => void;
}) {
    const [flowBasis, setFlowBasis] = useState<'mass' | 'molar'>('molar');
    const [compBasis, setCompBasis] = useState<'mass' | 'molar'>('molar');

    const molarComposition = (data.molarComposition as Record<string, number>) ?? {};
    const composition = (data.composition as Record<string, number>) ?? {};
    const molarFlow = data.molarFlow as number ?? 100;
    const temperature = data.temperature as number ?? 300;
    const pressure = data.pressure as number ?? 101325;

    const avgMW = components.reduce((sum, id) => {
        return sum + (molarComposition[id] ?? 0) * (COMPONENTS_DB[id]?.molarMass ?? 0.030);
    }, 0) || 0.030;

    const massFlow = molarFlow * avgMW;

    return <>
        <BasisToggle basis={flowBasis} setBasis={setFlowBasis} />

        <div style={fieldStyle}>
            <label style={labelStyle}>Molar Flow (mol/s){flowBasis === 'mass' ? ' — calculated' : ''}</label>
            <NumberInput
                value={molarFlow}
                readOnly={flowBasis === 'mass'}
                inputStyle={inputStyle}
                onChange={flowBasis === 'molar' ? (v) => {
                    update('molarFlow', v);
                    update('massFlow', v * avgMW);
                } : undefined} />
        </div>

        <div style={fieldStyle}>
            <label style={labelStyle}>Mass Flow (kg/s){flowBasis === 'molar' ? ' — calculated' : ''}</label>
            <NumberInput
                value={massFlow}
                readOnly={flowBasis === 'molar'}
                inputStyle={inputStyle}
                onChange={flowBasis === 'mass' ? (v) => {
                    update('massFlow', v);
                    update('molarFlow', avgMW > 0 ? v / avgMW : 0);
                } : undefined} />
        </div>

        <div style={fieldStyle}>
            <label style={labelStyle}>Temperature (K)</label>
            <NumberInput value={temperature} inputStyle={inputStyle} onChange={(v) => update('temperature', v)} />
        </div>

        <div style={fieldStyle}>
            <label style={labelStyle}>Pressure (Pa)</label>
            <NumberInput value={pressure} inputStyle={inputStyle} onChange={(v) => update('pressure', v)} />
        </div>

        <BasisToggle basis={compBasis} setBasis={setCompBasis} />

        {compBasis === 'molar' && <>
            <div style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>MOLE FRACTIONS</div>
            {components.map((id, i) => {
                const isLast = i === components.length - 1;
                const val = isLast
                    ? Math.max(0, 1 - components.slice(0, -1).reduce((s, cid) => s + (molarComposition[cid] ?? 0), 0))
                    : (molarComposition[id] ?? 0);
                return (
                    <div key={id} style={fieldStyle}>
                        <label style={labelStyle}>{COMPONENTS_DB[id]?.name ?? id}{isLast ? ' (calculated)' : ''}</label>
                        <FractionInput
                            value={val}
                            readOnly={isLast}
                            inputStyle={inputStyle}
                            onChange={isLast ? undefined : (v) => {
                                const newMolarComp = { ...molarComposition, [id]: v };
                                const lastId = components[components.length - 1];
                                newMolarComp[lastId] = Math.max(0, 1 - components.slice(0, -1).reduce((s, cid) => s + (newMolarComp[cid] ?? 0), 0));
                                update('molarComposition', newMolarComp);
                                const totalMW = components.reduce((s, cid) => s + (newMolarComp[cid] ?? 0) * (COMPONENTS_DB[cid]?.molarMass ?? 0.030), 0);
                                const massComp: Record<string, number> = {};
                                components.forEach(cid => {
                                    massComp[cid] = totalMW > 0 ? ((newMolarComp[cid] ?? 0) * (COMPONENTS_DB[cid]?.molarMass ?? 0.030)) / totalMW : 0;
                                });
                                update('composition', massComp);
                            }} />
                    </div>
                );
            })}
            <div style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 6, marginTop: 8 }}>MASS FRACTIONS (calculated)</div>
            {components.map(id => {
                const totalMW = components.reduce((s, cid) => s + (molarComposition[cid] ?? 0) * (COMPONENTS_DB[cid]?.molarMass ?? 0.030), 0);
                const massFrac = totalMW > 0 ? ((molarComposition[id] ?? 0) * (COMPONENTS_DB[id]?.molarMass ?? 0.030)) / totalMW : 0;
                return (
                    <div key={id} style={fieldStyle}>
                        <label style={labelStyle}>{COMPONENTS_DB[id]?.name ?? id}</label>
                        <FractionInput value={massFrac} readOnly inputStyle={inputStyle} />
                    </div>
                );
            })}
        </>}

        {compBasis === 'mass' && <>
            <div style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>MASS FRACTIONS</div>
            {components.map((id, i) => {
                const isLast = i === components.length - 1;
                const val = isLast
                    ? Math.max(0, 1 - components.slice(0, -1).reduce((s, cid) => s + (composition[cid] ?? 0), 0))
                    : (composition[id] ?? 0);
                return (
                    <div key={id} style={fieldStyle}>
                        <label style={labelStyle}>{COMPONENTS_DB[id]?.name ?? id}{isLast ? ' (calculated)' : ''}</label>
                        <FractionInput
                            value={val}
                            readOnly={isLast}
                            inputStyle={inputStyle}
                            onChange={isLast ? undefined : (v) => {
                                const newComp = { ...composition, [id]: v };
                                const lastId = components[components.length - 1];
                                newComp[lastId] = Math.max(0, 1 - components.slice(0, -1).reduce((s, cid) => s + (newComp[cid] ?? 0), 0));
                                update('composition', newComp);
                                const totalMolesPerKg = components.reduce((s, cid) => s + (newComp[cid] ?? 0) / (COMPONENTS_DB[cid]?.molarMass ?? 0.030), 0);
                                const molarComp: Record<string, number> = {};
                                components.forEach(cid => {
                                    molarComp[cid] = totalMolesPerKg > 0 ? ((newComp[cid] ?? 0) / (COMPONENTS_DB[cid]?.molarMass ?? 0.030)) / totalMolesPerKg : 0;
                                });
                                update('molarComposition', molarComp);
                            }} />
                    </div>
                );
            })}
            <div style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 6, marginTop: 8 }}>MOLE FRACTIONS (calculated)</div>
            {components.map(id => {
                const totalMolesPerKg = components.reduce((s, cid) => s + (composition[cid] ?? 0) / (COMPONENTS_DB[cid]?.molarMass ?? 0.030), 0);
                const moleFrac = totalMolesPerKg > 0 ? ((composition[id] ?? 0) / (COMPONENTS_DB[id]?.molarMass ?? 0.030)) / totalMolesPerKg : 0;
                return (
                    <div key={id} style={fieldStyle}>
                        <label style={labelStyle}>{COMPONENTS_DB[id]?.name ?? id}</label>
                        <FractionInput value={moleFrac} readOnly inputStyle={inputStyle} />
                    </div>
                );
            })}
        </>}
    </>;
}

export default function PropertiesPanel({ node, components, onNodeDataChange }: PropertiesPanelProps) {
    const nodeType = node.data.nodeType as string;
    const data = node.data as Record<string, unknown>;

    const update = (key: string, value: unknown) => {
        onNodeDataChange(node.id, { [key]: value });
    };

    return (
        <div style={{ padding: '12px', fontSize: 11 }}>
            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 12, marginBottom: 12, fontFamily: 'monospace' }}>
                {String(data.label)} - {nodeType.toUpperCase()}
            </div>

            {nodeType === 'feed' && <FeedProperties data={data} components={components} update={update} />}
            
            {nodeType === 'pump' && <>
                <div style={fieldStyle}>
                    <label style={labelStyle}>Target Pressure (Pa)</label>
                    <NumberInput value={data.targetP as number ?? 183000} inputStyle={inputStyle} onChange={(v) => update('targetP', v)} />
                </div>
            </>}

            {nodeType === 'heater' && <>
                <div style={fieldStyle}>
                    <label style={labelStyle}>Target Temperature (K)</label>
                    <NumberInput value={data.targetT as number ?? 380} inputStyle={inputStyle} onChange={(v) => update('targetT', v)} />
                </div>
            </>}

            {nodeType === 'flash' && <>
                <div style={fieldStyle}>
                    <label style={labelStyle}>Temperature (K)</label>
                    <NumberInput value={data.targetT as number ?? 380} inputStyle={inputStyle} onChange={(v) => update('targetT', v)} />
                </div>
                <div style={fieldStyle}>
                    <label style={labelStyle}>Pressure (Pa)</label>
                    <NumberInput value={data.targetP as number ?? 183000} inputStyle={inputStyle} onChange={(v) => update('targetP', v)} />
                </div>
            </>}
            
            {nodeType === 'splitter' && <>
                <div style={fieldStyle}>
                    <label style={labelStyle}>Split Fraction (outlet 1)</label>
                    <FractionInput value={data.splitFraction as number ?? 0.6} inputStyle={inputStyle} onChange={(v) => update('splitFraction', v)} />
                </div>
            </>}
            
            {(nodeType === 'mixer' || nodeType === 'outlet') && (
                <div style={{ color: '#475569', fontSize: 11 }}>No parameters required.</div>
            )}
            
        </div>
    );
}