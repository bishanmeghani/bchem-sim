import { Stream } from './types/types.ts';
import { Mixer, HeatExchanger, FlashDrum, Splitter, Pump } from './unitops/unitops.ts'

function runSimulationWithRecycle(freshFeed: Stream, targetT: number, targetP: number, _targetQ: number) {
    console.log("🌀 [Solver] Initializing Property-Method Based Tear Loop...");
    const recycleFraction = 0.6;

    let recycleGuess: Stream = {
        id: "RECYCLE-STREAM",
        massFlow: 0, 
        temperature: freshFeed.temperature,
        pressure: freshFeed.pressure,
        composition: { water: 0.3, ethanol: 0.7 },
        phase: "liquid"
    };

    const maxIterations = 50;
    const tolerance = 1e-4;
    let prevInput: number | null = null;
    let prevOutput: number | null = null;

    for ( let iter = 1; iter <= maxIterations; iter++) {
        const { outStream: pumpPout } = Pump.pressurised(freshFeed, 183000);
        const mixerOut = Mixer.mix([pumpPout, recycleGuess]);
        const { outStream: heaterOut, duty: Q } = HeatExchanger.fromOutletTemp(mixerOut, targetT);
        const { vaporStream, liquidStream } = FlashDrum.flashTP(heaterOut, targetT, targetP);
        //const { vaporStream, liquidStream } = FlashDrum.flashPQ(heaterOut, targetP, targetQ)
        const [liquidRecycle, liquidProduct] = Splitter.split(liquidStream, [recycleFraction, 1-recycleFraction]);

        const currentInput = recycleGuess.massFlow;
        const currentOutput = liquidRecycle. massFlow;
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

    throw new Error("❌ [Solver] Flowsheet stalled or failed to reach convergence limit.");
}

Deno.serve((_req) => {
    console.log(">>> NEW REQUEST", Date.now());
    
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    };
    
    const freshFeed: Stream = {
        id: "FRESH-FEED",
        massFlow: 10.0,
        temperature: 300.0,
        pressure: 101325,
        composition: { water: 0.3, ethanol: 0.7 },
        phase: "liquid"
    };

    try {
        const simulationResult = runSimulationWithRecycle(freshFeed, 380, 183000, 35555);
        return new Response(JSON.stringify(simulationResult, null, 2), {
            headers: corsHeaders
        });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ status: "Failed", error: errorMessage }), {
            status: 500,
            headers: corsHeaders
        });
    }
});