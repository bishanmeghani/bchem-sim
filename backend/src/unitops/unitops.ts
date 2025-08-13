import { Stream } from '../types/types.ts';

export class Mixer { 
    static mix(streams: Stream[]): Stream {
        const id = "mixer-out";
        const massFlow = streams.reduce((s, x) => s + x.massFlow, 0);
        const temperature = streams.reduce((acc, s) => acc + s.temperature * massFlow, 0) / massFlow;
        const comp: Record<string, number> = {};
        for (const s of streams) {
            for (const k of Object.keys(s.composition)) {
                comp[k] = (comp[k] || 0) + (s.composition[k] || 0) * s.massFlow;
            }
        }
        for (const k of Object.keys(comp)) comp[k] = comp[k] / massFlow;
        return { id, massFlow, temperature, composition: comp, pressure: streams[0].pressure, cp: streams[0].cp };
    }
}

export class Splitter {
    static split(stream: Stream, fractions: number[]): Stream[] {
        const outputs = fractions.map((f, i) => {
            const massFlow = stream.massFlow * f;
            return { id: `${stream.id}-split${i+1}`, massFlow, temperature: stream.temperature, composition: { ...stream.composition }, pressure: stream.pressure, cp: stream.cp };
        });
        return outputs;
    }
}

export class HeatExchanger {

    static fromOutletTemp(stream: Stream, targetT: number): { outStream: Stream; duty: number} {
        const Q = stream.cp * stream.massFlow * (targetT - stream.temperature);
        const outStream: Stream = { ...stream, id: stream.id + "-hx", temperature: targetT };
        return { outStream, duty: Q };
    }

    static fromDuty(stream: Stream, duty: number): Stream {
        const T = stream.temperature + duty / (stream.cp * stream.massFlow);      
        return { ...stream, id: stream.id + "-hx", temperature: T };
    }
}