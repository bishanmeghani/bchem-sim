import { Stream, Composition } from '../types/types.ts';
import { COMPONENTS_DB } from '../data/componentsDatabase.ts';

export function massToMolar(composition: Composition, massFlow: number) : { molarComposition: Composition; molarFlow: number } {
    const totalMolesPerKg = Object.entries(composition).reduce((s, [id, massFrac]) => {
        const mw = COMPONENTS_DB[id]?.molarMass ?? 0.030;
        return s + massFrac / mw;
    }, 0);

    const molarComposition: Composition = {};
    for (const [id, massFrac] of Object.entries(composition)) {
        const mw = COMPONENTS_DB[id]?.molarMass ?? 0.030;
        molarComposition[id] = (massFrac / mw) / totalMolesPerKg;
    }

    const avgMW = 1 / totalMolesPerKg;
    const molarFlow = massFlow / avgMW;
    return { molarComposition, molarFlow };
}

export function getMixtureCp(composition: Composition): number {
    let mixedCp = 0;
    let totalFraction = 0;

    for (const [component, fraction] of Object.entries(composition)) {
        const comp = COMPONENTS_DB[component];
        if (!comp) throw new Error(`Missing Cp for component [${component}]`);
        mixedCp += fraction * comp.cp;
        totalFraction += fraction;
    }

    return totalFraction > 0 ? mixedCp / totalFraction : 4184;
}

export class Mixer { 
    static mix(streams: Stream[]): Stream {
        if (streams.length === 0) throw new Error("Mixer requires feeds.");
        
        const id = "mixer-out";
        const totalMassFlow = streams.reduce((s, x) => s + x.massFlow, 0);
        
        if (totalMassFlow === 0) { return { id, massFlow: 0, molarFlow: 0, temperature: streams[0].temperature, composition: {}, molarComposition: {},pressure: streams[0].pressure, phase: "liquid" }; }
        
        const totalEnergyFlow = streams.reduce((acc, s) => {
            return acc + (s.temperature * s.massFlow * getMixtureCp(s.composition));
        }, 0);

        const totalHeatCapacityFlow = streams.reduce((acc, s) => {
            return acc + (s.massFlow * getMixtureCp(s.composition))
        }, 0);

        const temperature = totalEnergyFlow / totalHeatCapacityFlow;

        const comp: Record<string, number> = {};
        for (const s of streams) {
            for (const [k, v] of Object.entries(s.composition)) {
                comp[k] = (comp[k] || 0) + v * s.massFlow;
            }
        }
        for (const k of Object.keys(comp)) { comp[k] = comp[k] / totalMassFlow };

        const { molarComposition, molarFlow } = massToMolar(comp, totalMassFlow);

        const pressure = Math.min(...streams.map(s => s.pressure));
        return { id, massFlow: totalMassFlow, molarFlow, temperature, composition: comp, molarComposition, pressure, phase: "liquid" };
    }
}

export class Splitter {
    static split(stream: Stream, fractions: number[]): Stream[] {
        const sum = fractions.reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 1.0) > 1e-6) throw new Error("Split fractions must sum to 1");  
        
        return fractions.map((f, i) => ({
            id: `${stream.id}-split${i + 1}`,
            massFlow: stream.massFlow * f,
            molarFlow: stream.molarFlow * f,
            temperature: stream.temperature,
            composition: { ...stream.composition },
            molarComposition: { ...stream.molarComposition },
            pressure: stream.pressure,
            phase: stream.phase
        }));
    }
}

export class HeatExchanger {
    static fromOutletTemp(stream: Stream, targetT: number): { outStream: Stream; duty: number} {
        const streamCp = getMixtureCp(stream.composition);
        const Q = streamCp * stream.massFlow * (targetT - stream.temperature);
        const outStream: Stream = { ...stream, id: stream.id + "-hx", temperature: targetT };
        return { outStream, duty: Q };
    }
}

export class FlashDrum {
    static flashTP(stream: Stream, targetT: number, targetP: number): { vaporStream: Stream; liquidStream: Stream; vaporFraction: number } {
        const P_mmHg = targetP / 133.322;
        const T_celsius = targetT - 273.15;
        
        let totalMolesInlet = 0;
        const z_mole: Record<string, number> = {};
        
        for (const [component, massFrac] of Object.entries(stream.composition)) {
            const comp = COMPONENTS_DB[component];
            if (!comp) throw new Error(`Missing data for component [${component}]`);
            totalMolesInlet += massFrac / comp.molarMass;
        }
        
        for (const [component, massFrac] of Object.entries(stream.composition)) {
            const mw = COMPONENTS_DB[component]?.molarMass ?? 0.030;
            z_mole[component] = (massFrac / mw) / totalMolesInlet;
        }
        const K_values: Record<string, number> = {};
        for (const component of Object.keys(stream.composition)) {
            const comp = COMPONENTS_DB[component];
            if (!comp) throw new Error(`Missing Antoine coeffs for [${component}]`);
            const logPsat = comp.antoine.A - comp.antoine.B / (T_celsius + comp.antoine.C);;
            K_values[component] = Math.pow(10, logPsat) / P_mmHg;
        }

        let psi = 0.5;
        let lo = 0.0, hi = 1.0;

        const f0 = Object.entries(z_mole).reduce((s, [c, z]) => s + z * (K_values[c] - 1), 0);
        const f1 = Object.entries(z_mole).reduce((s, [c, z]) => s + z * (K_values[c] - 1) / K_values[c], 0);

        if (f0 <= 0) {
            psi = 0;
        } else if (f1 >= 0) {
            psi = 1;
        } else {
            for (let iter = 0; iter < 100; iter++) {
                psi = 0.5 * (lo + hi);
                const f = Object.entries(z_mole).reduce((s, [c, z]) => {
                    return s + z * (K_values[c] - 1) / (1 + psi * (K_values[c] - 1));
                }, 0);
                if (Math.abs(f) < 1e-8) break;
                if (f > 0) lo = psi;
                else hi = psi;
            }
        }

        // Now clamp final result to physical [0,1]
        psi = Math.max(0, Math.min(1, psi));

        const vaporPhase = "vapor" as const;
        const liquidPhase = "liquid" as const;

        if (psi >= 1.0) {
            return {
                vaporStream: { ...stream, id: `${stream.id}-vapor`, massFlow: stream.massFlow, molarFlow: stream.molarFlow, temperature: targetT, pressure: targetP, composition: stream.composition, molarComposition: stream.molarComposition, phase: vaporPhase },
                liquidStream: { ...stream, id: `${stream.id}-liquid`, massFlow: 0, molarFlow: 0, temperature: targetT, pressure: targetP, composition: stream.composition, molarComposition: stream.molarComposition, phase: liquidPhase },
                vaporFraction: 1.0
            };
        } 
        
        if (psi <= 0.0) {
            return {
                vaporStream: { ...stream, id: `${stream.id}-vapor`, massFlow: 0, molarFlow:0, temperature: targetT, composition: stream.composition, molarComposition: stream.molarComposition, pressure: targetP, phase: vaporPhase },
                liquidStream: { ...stream, id: `${stream.id}-liquid`, massFlow: stream.massFlow, molarFlow: stream.molarFlow, temperature: targetT, composition: stream.composition, molarComposition: stream.molarComposition, pressure: targetP, phase: liquidPhase },
                vaporFraction: 0.0
            };
        } 
            
        const liquidMoleComp: Composition = {};
        const vaporMoleComp: Composition = {};

        for (const [component, z_i] of Object.entries(z_mole)) {
            const K_i = K_values[component];
            liquidMoleComp[component] = z_i / (1 + psi * (K_i - 1));
            vaporMoleComp[component] = liquidMoleComp[component] * K_i;
        }

            // Convert back to mass fractions
        const liquidMassComp: Composition = {};
        const vaporMassComp: Composition = {};
        let liquidMassSum = 0;
        let vaporMassSum = 0;

        for (const component of Object.keys(stream.composition)) {
            const mw = COMPONENTS_DB[component]?.molarMass ?? 0.030;
            liquidMassComp[component] = liquidMoleComp[component] * mw;
            vaporMassComp[component] = vaporMoleComp[component] * mw;
            liquidMassSum += liquidMassComp[component];
            vaporMassSum += vaporMassComp[component];
        }

        for (const k of Object.keys(liquidMassComp)) liquidMassComp[k] /= liquidMassSum;
        for (const k of Object.keys(vaporMassComp)) vaporMassComp[k] /= vaporMassSum;

        const totalInletMassMW = streamsTotalMW(z_mole);
        const vaporMW = streamsTotalMW(vaporMoleComp);
        const massVaporFraction = psi * (vaporMW / totalInletMassMW);

        const { molarComposition: vaporMolarComp, molarFlow: vaporMolarFlow } = massToMolar(vaporMassComp, stream.massFlow * massVaporFraction);
        const { molarComposition: liquidMolarComp, molarFlow: liquidMolarFlow } = massToMolar(liquidMassComp, stream.massFlow * (1 - massVaporFraction));

        return {
            vaporStream: { id: `${stream.id}-vapor`, massFlow: stream.massFlow * massVaporFraction, molarFlow: vaporMolarFlow, temperature: targetT, pressure: targetP, composition: vaporMassComp, molarComposition: vaporMolarComp, phase: vaporPhase },
            liquidStream: { id: `${stream.id}-liquid`, massFlow: stream.massFlow * (1 - massVaporFraction), molarFlow: liquidMolarFlow, temperature: targetT, pressure: targetP, composition: liquidMassComp, molarComposition: liquidMolarComp, phase: liquidPhase },
            vaporFraction: massVaporFraction
        };
    }

    static flashPQ(stream: Stream, targetP: number, Q: number): { vaporStream: Stream; liquidStream: Stream; vaporFraction: number } {
        let T_lo = 273.15 + 20;
        let T_hi = 273.15 + 200;

        for (let iter = 0; iter < 100; iter++) {
            const T_mid = 0.5 * (T_lo + T_hi);
            const result = FlashDrum.flashTP(stream, T_mid, targetP);
            const Cp = getMixtureCp(stream.composition);
            const Q_actual = Cp * stream.massFlow * (T_mid - stream.temperature);
            if (Math.abs(Q_actual - Q) < 1e-3) return result;
            if (Q_actual < Q) T_lo = T_mid;
            else T_hi = T_mid;
        }
        return FlashDrum.flashTP(stream, 0.5 * (T_lo + T_hi), targetP);
    }
}

export class Pump {
    static pressurised(stream: Stream, targetP: number): { outStream: Stream; work: number } { 
        const outStream: Stream = { ...stream, id: stream.id + "-pump", pressure: targetP };
        return { outStream, work: 0 }
    }
}

// Small helper function for molecular weight mixture averaging
function streamsTotalMW(moleComp: Composition): number {
    let sum = 0;
    for (const [k, v] of Object.entries(moleComp)) {
        sum += v * (COMPONENTS_DB[k]?.molarMass ?? 0.030);
    }
    return sum;
}