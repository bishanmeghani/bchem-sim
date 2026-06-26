import { Stream } from './types/types.ts';
import { Mixer, HeatExchanger, FlashDrum, Splitter, Pump } from './unitops/unitops.ts';

const corsHeaders = {
    "Access-Control-Allow-Origin": '*',
    "Access-Control-Allow-Methods": 'GET, POST, OPTIONS',
    "Access-Control-Allow-Headers": 'Content-Type',
    "Content-Type": 'application/json',
}

function runSimulationWithRecycle(
    freshFeed: Stream, 
    targetT: number, 
    targetP: number, 
    _targetQ: number,
    pumpP: number = 183000,
    splitFraction: number = 0.6
) {
    console.log("🌀 [Solver] Initializing Property-Method Based Tear Loop...");

    let recycleGuess: Stream = {
        id: "RECYCLE-STREAM",
        massFlow: 0, 
        temperature: freshFeed.temperature,
        pressure: freshFeed.pressure,
        composition: freshFeed.composition,
        phase: "liquid"
    };

    const maxIterations = 50;
    const tolerance = 1e-4;
    let prevInput: number | null = null;
    let prevOutput: number | null = null;

    for ( let iter = 1; iter <= maxIterations; iter++) {
        const { outStream: pumpPout } = Pump.pressurised(freshFeed, pumpP);
        const mixerOut = Mixer.mix([pumpPout, recycleGuess]);
        const { outStream: heaterOut, duty: Q } = HeatExchanger.fromOutletTemp(mixerOut, targetT);
        const { vaporStream, liquidStream } = FlashDrum.flashTP(heaterOut, targetT, targetP);
        //const { vaporStream, liquidStream } = FlashDrum.flashPQ(heaterOut, targetP, targetQ)
        const [liquidRecycle, liquidProduct] = Splitter.split(liquidStream, [splitFraction, 1-splitFraction]);

        const currentInput = recycleGuess.massFlow;
        const currentOutput = liquidRecycle.massFlow;
        const error = Math.abs(currentOutput - currentInput);

        if (error < tolerance) {
            console.log(`✅ [Solver] Flowsheet converged cleanly in ${iter} iterations!`);
            return {
                status: "Success",
                converged_at_iteration: iter,
                streams: {
                    freshFeed,
                    pumpPout,
                    mixerOut,
                    heaterOut,
                    Q,
                    vaporProduct: vaporStream,
                    liquidProduct,
                    liquidRecycle,
                }
            };
        }

        let nextFlow: number;
        if (prevInput === null || Math.abs(currentInput - prevInput) < 1e-10) {
            nextFlow = 0.5 * (currentOutput + currentInput);
        } else {
            const slope = (currentOutput - prevOutput!) / (currentInput - prevInput);
            const q = Math.max(-5, Math.min(0, slope / (slope - 1)));
            nextFlow = (1 - q) * currentOutput + q* currentInput;
            const totalMassFlow = mixerOut.massFlow;
            if (nextFlow < 0 || nextFlow > totalMassFlow || isNaN(nextFlow)) {
                nextFlow = 0.5 * (currentOutput + currentInput);
            }
        }

        prevInput = currentInput;
        prevOutput = currentOutput;

        recycleGuess = {
            ...liquidRecycle,
            id: "RECYCLE-STREAM",
            massFlow: Math.max(0, nextFlow)
        };
    }

    throw new Error("❌ [Solver] Failed to converge.");
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === '/simulate') {
        try {
            const body = await req.json();
            const { nodes, edges: _edges, components: _components } = body;

            const feedNode = nodes.find((n: any) => n.nodeType === 'feed');
            if (!feedNode) throw new Error("No feed node found");

            const freshFeed: Stream = {
                id: feedNode.id,
                massFlow: feedNode.data.massFlow ?? 10,
                temperature: feedNode.data.temperature ?? 300,
                pressure: feedNode.data.pressure ?? 101325,
                composition: feedNode.data.composition ?? { water: 0.3, ethanol: 0.7 },
                phase: "liquid"
            };
            const pumpNode = nodes.find((n: any) => n.nodeType === 'pump');
            const heaterNode = nodes.find((n: any) => n.nodeType === 'heater');
            const flashNode = nodes.find((n: any) => n.nodeType === 'flash');
            const splitterNode = nodes.find((n: any) => n.nodeType === 'splitter');

            const pumpP = pumpNode?.data?.targetP ?? 183000;
            const targetT = heaterNode?.data?.targetT ?? 380;
            const targetP = flashNode?.data?.targetP ?? 183000;
            const splitFraction = splitterNode?.data?.splitFraction ?? 0.4;

            const result = runSimulationWithRecycle(freshFeed, targetT, targetP, 0, pumpP, splitFraction);

            return new Response(JSON.stringify(result, null, 2), { headers: corsHeaders });
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            return new Response(JSON.stringify({ status: "Failed", error: errorMessage }), {
                status: 500,
                headers: corsHeaders
            });
        }
    }   

    return new Response(JSON.stringify({ status: "Not found" }), {
        status: 404,
        headers: corsHeaders
    });
});