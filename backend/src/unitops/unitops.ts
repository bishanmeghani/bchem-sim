import { Stream, Composition } from '../types/types.ts';

const HVAP_DATABASE: Record<string, number> = {
    water: 2260000,   // J/kg at 100°C
    ethanol: 841000   // J/kg at 78°C
};

const CP_DATABASE: Record<string, number> = {
    water: 4184,
    ethanol: 2440
};

const ANTOINE_DATABASE: Record<string, { A: number, B: number; C: number }> = {
    water:   { A: 8.07131, B: 1730.630, C: 233.426 },
    ethanol: { A: 8.11220, B: 1592.864, C: 226.184 }
};

export function getMixtureCp(composition: Composition): number {
    let mixedCp = 0;
    let totalFraction = 0;

    for (const [component, fraction] of Object.entries(composition)) {
        const pureCp = CP_DATABASE[component];
        if (pureCp === undefined) {
            throw new Error(`Thermodynamic Error: Missing Cp coefficient for component [${component}]`);
        }
        mixedCp += fraction * pureCp;
        totalFraction += fraction;
    }

    return totalFraction > 0 ? mixedCp / totalFraction : 4184;
}

export class Mixer { 
    static mix(streams: Stream[]): Stream {
        if (streams.length === 0) throw new Error("Mixer requires feeds.");
        
        const id = "mixer-out";
        const totalMassFlow = streams.reduce((s, x) => s + x.massFlow, 0);
        
        if (totalMassFlow === 0) { return { id, massFlow: 0, temperature: streams[0].temperature, composition: {}, pressure: streams[0].pressure, phase: "liquid" }; }
        
        const totalEnergyFlow = streams.reduce((acc, s) => {
            const streamCp = getMixtureCp(s.composition);
            return acc + (s.temperature * s.massFlow * streamCp);
        }, 0);

        const totalHeatCapacityFlow = streams.reduce((acc, s) => {
            const streamCp = getMixtureCp(s.composition);
            return acc + (s.massFlow * streamCp)
        }, 0);

        const temperature = totalEnergyFlow / totalHeatCapacityFlow;

        const comp: Record<string, number> = {};
        for (const s of streams) {
            for (const [k, v] of Object.entries(s.composition)) {
                comp[k] = (comp[k] || 0) + v * s.massFlow;
            }
        }
        for (const k of Object.keys(comp)) { comp[k] = comp[k] / totalMassFlow };

        const pressure = Math.min(...streams.map(s => s.pressure));
        return { id, massFlow: totalMassFlow, temperature, composition: comp, pressure, phase: "liquid" };
    }
}

export class Splitter {
    static split(stream: Stream, fractions: number[]): Stream[] {
        const sum = fractions.reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 1.0) > 1e-6) throw new Error("Split fractions must sum to 1");  
        
        return fractions.map((f, i) => ({
            id: `${stream.id}-split${i+1}`,
            massFlow: stream.massFlow * f,
            temperature: stream.temperature,
            composition: { ...stream.composition },
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

        const MW: Record<string, number> = {
            water: 0.018015,
            ethanol: 0.04607
        };
        let totalMolesInlet = 0;
        const z_mole: Record<string, number> = {};
        
        for (const [component, massFrac] of Object.entries(stream.composition)) {
            const mw = MW[component] || 0.030;
            totalMolesInlet += massFrac / mw;
        }
        for (const [component, massFrac] of Object.entries(stream.composition)) {
            const mw = MW[component] || 0.030;
            z_mole[component] = (massFrac / mw) / totalMolesInlet;
        }
        const K_values: Record<string, number> = {};

        for (const component of Object.keys(stream.composition)) {
            const constants = ANTOINE_DATABASE[component];
            if (!constants) throw new Error(`Missing Antoine coeffs for [${component}]`);
            const T_celsius = targetT - 273.15
            const logPsat = constants.A - constants.B / (T_celsius + constants.C);
            K_values[component] = Math.pow(10, logPsat) / P_mmHg;
        }

        let psi = 0.5;
        let lo = 0.0, hi = 1.0;

        const f0 = Object.entries(z_mole).reduce((s, [c, z]) => s + z * (K_values[c] - 1), 0);
        const f1 = Object.entries(z_mole).reduce((s, [c, z]) => s + z * (K_values[c] - 1) / K_values[c], 0);

        if (f0 <= 0) {
            console.warn(`[Flash] Below bubble point at T=${targetT}K, P=${targetP}Pa — all liquid`);
            psi = 0;
        } else if (f1 >= 0) {
            console.warn(`[Flash] Above dew point at T=${targetT}K, P=${targetP}Pa — all vapor`);
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

        const liquidMoleComp: Composition = {};
        const vaporMoleComp: Composition = {};
        if (psi >= 1.0) {
            psi = 1.0;
            const vaporPhase = "vapor" as const;
            const liquidPhase = "liquid" as const;
            return {
                vaporStream: { ...stream, id: `${stream.id}-vapor`, massFlow: stream.massFlow, temperature: targetT, pressure: targetP, phase: vaporPhase },
                liquidStream: { ...stream, id: `${stream.id}-liquid`, massFlow: 0, temperature: targetT, pressure: targetP, phase: liquidPhase },
                vaporFraction: 1.0
            };
        } else if (psi <= 0.0) {
            psi = 0.0;
            const vaporPhase = "vapor" as const;
            const liquidPhase = "liquid" as const;
            return {
                vaporStream: { ...stream, id: `${stream.id}-vapor`, massFlow: 0, temperature: targetT, pressure: targetP, phase: vaporPhase },
                liquidStream: { ...stream, id: `${stream.id}-liquid`, massFlow: stream.massFlow, temperature: targetT, pressure: targetP, phase: liquidPhase },
                vaporFraction: 0.0
            };
        } else {
            // Partial flash calculated in mole metrics
            for (const [component, z_i] of Object.entries(z_mole)) {
                const K_i = K_values[component];
                liquidMoleComp[component] = z_i / (1 + psi * (K_i - 1));
                vaporMoleComp[component] = liquidMoleComp[component] * K_i;
            }

            // Convert molar fractions back into mass fractions for outer equipment
            const liquidMassComp: Composition = {};
            const vaporMassComp: Composition = {};
            let liquidMassSum = 0;
            let vaporMassSum = 0;

            for (const component of Object.keys(stream.composition)) {
                const mw = MW[component] || 0.030;
                liquidMassComp[component] = liquidMoleComp[component] * mw;
                vaporMassComp[component] = vaporMoleComp[component] * mw;
                liquidMassSum += liquidMassComp[component];
                vaporMassSum += vaporMassComp[component];
            }

            // Normalize mass composition fractions
            for (const k of Object.keys(liquidMassComp)) liquidMassComp[k] /= liquidMassSum;
            for (const k of Object.keys(vaporMassComp)) vaporMassComp[k] /= vaporMassSum;

            // Calculate exact total mass split ratio using molecular averages
            const totalInletMassMW = streamsTotalMW(z_mole, MW);
            const vaporMW = streamsTotalMW(vaporMoleComp, MW);
            const massVaporFraction = psi * (vaporMW / totalInletMassMW);

            const vaporPhase = "vapor" as const;
            const liquidPhase = "liquid" as const;

            return {
                vaporStream: { id: `${stream.id}-vapor`, massFlow: stream.massFlow * massVaporFraction, temperature: targetT, pressure: targetP, composition: vaporMassComp, phase: vaporPhase },
                liquidStream: { id: `${stream.id}-liquid`, massFlow: stream.massFlow * (1 - massVaporFraction), temperature: targetT, pressure: targetP, composition: liquidMassComp, phase: liquidPhase },
                vaporFraction: massVaporFraction
            };
        }
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
function streamsTotalMW(moleComp: Composition, mwDb: Record<string, number>): number {
    let sum = 0;
    for (const [k, v] of Object.entries(moleComp)) {
        sum += v * (mwDb[k] || 0.030);
    }
    return sum;
}