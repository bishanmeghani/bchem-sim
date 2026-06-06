import { assert, assertEquals, assertAlmostEquals } from "@std/assert"
import { FlashDrum } from "../../../src/unitops/unitops.ts"
import { Stream } from "../../../src/types/types.ts"

const baseStream: Stream = {
    id: "test-stream",
    massFlow: 10.0,
    temperature: 380,
    pressure: 183000,
    composition: { water: 0.3, ethanol: 0.7 },
    phase: "liquid"
};

const partialFlashStream: Stream = {
    id: "test-stream",
    massFlow: 10.0,
    temperature: 380,
    pressure: 183000,
    composition: { water: 0.3, ethanol: 0.7 },
    phase: "liquid"
};

const allLiquidStream: Stream = {
    id: "test-stream",
    massFlow: 10.0,
    temperature: 360,
    pressure: 101325,
    composition: { water: 0.5, ethanol: 0.5 },
    phase: "liquid"
};

Deno.test("Flashdrum TP partial flash water/ethanol", () => {
    const { vaporStream, liquidStream } = FlashDrum.flashTP(baseStream, 380, 183000);
    assert(vaporStream.composition.ethanol > baseStream.composition.ethanol);
    assertAlmostEquals(vaporStream.massFlow + liquidStream.massFlow, baseStream.massFlow);
});

Deno.test("Flashdrum PQ partial flash water/ethanol", () => {
    const { vaporStream, liquidStream } = FlashDrum.flashPQ(baseStream, 183000, 35555);
    assert(vaporStream.composition.ethanol > baseStream.composition.ethanol);
    assertAlmostEquals(vaporStream.massFlow + liquidStream.massFlow, baseStream.massFlow);
});

Deno.test("FlashDrum: partial flash enriches vapor in ethanol", () => {
    const { vaporStream, liquidStream } = FlashDrum.flashTP(partialFlashStream, 380, 183000);
    assert(vaporStream.composition.ethanol > partialFlashStream.composition.ethanol);
    assert(liquidStream.composition.water > partialFlashStream.composition.water);
});

Deno.test("FlashDrum: partial flash mass balance", () => {
    const { vaporStream, liquidStream } = FlashDrum.flashTP(partialFlashStream, 380, 183000);
    assertAlmostEquals(vaporStream.massFlow + liquidStream.massFlow, partialFlashStream.massFlow);
});

Deno.test("FlashDrum: below bubble point returns all liquid", () => {
    const { vaporStream, liquidStream, vaporFraction } = FlashDrum.flashTP(allLiquidStream, 360, 101325);
    assertAlmostEquals(vaporFraction, 0);
    assertAlmostEquals(liquidStream.massFlow, allLiquidStream.massFlow);
    assertAlmostEquals(vaporStream.massFlow, 0);
});

Deno.test("FlashDrum: flashPQ mass balance", () => {
    const { vaporStream, liquidStream } = FlashDrum.flashPQ(partialFlashStream, 183000, 35555);
    assertAlmostEquals(vaporStream.massFlow + liquidStream.massFlow, partialFlashStream.massFlow);
});