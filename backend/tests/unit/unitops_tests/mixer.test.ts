import { assert, assertAlmostEquals, assertThrows } from "@std/assert"
import { Mixer } from "../../../src/unitops/unitops.ts";
import { Stream } from "../../../src/types/types.ts";

const baseStream1: Stream = {
    id: "test-stream",
    massFlow: 10.0,
    temperature: 300,
    pressure: 101325,
    composition: { water: 0.5, ethanol: 0.5 },
    phase: "liquid"
};

const baseStream2: Stream = {
    id: "test-stream",
    massFlow: 10.0,
    temperature: 300,
    pressure: 101325,
    composition: { water: 0.5, ethanol: 0.5 },
    phase: "liquid"
};

Deno.test("Mixer: mass flow is conserved", () => {
    const s = Mixer.mix([baseStream1, baseStream2]);
    assertAlmostEquals(s.massFlow, baseStream1.massFlow + baseStream2.massFlow);
});

Deno.test("Mixer: composition is conserved", () => {
    const s = Mixer.mix([baseStream1, baseStream2]);
    assertAlmostEquals(s.composition.water, baseStream1.composition.water);
    assertAlmostEquals(s.composition.ethanol, baseStream1.composition.ethanol);
    assertAlmostEquals(s.composition.water, baseStream2.composition.water);
    assertAlmostEquals(s.composition.ethanol, baseStream2.composition.ethanol);
});

const hotStream: Stream = {
    id: "hot-stream",
    massFlow: 5.0,
    temperature: 400,
    pressure: 183000,
    composition: { water: 0.2, ethanol: 0.8 },
    phase: "liquid"
};

const coldStream: Stream = {
    id: "cold-stream",
    massFlow: 5.0,
    temperature: 300,
    pressure: 101325,
    composition: { water: 0.8, ethanol: 0.2 },
    phase: "liquid"
};

Deno.test("Mixer: temperature is weighted average", () => {
    const s = Mixer.mix([hotStream, coldStream]);
    // equal mass flows and equal Cp so simple average
    assertAlmostEquals(s.temperature, 350, 1);
});

Deno.test("Mixer: composition is weighted average", () => {
    const s = Mixer.mix([hotStream, coldStream]);
    assertAlmostEquals(s.composition.water, 0.5);
    assertAlmostEquals(s.composition.ethanol, 0.5);
});

Deno.test("Mixer: pressure takes minimum", () => {
    const s = Mixer.mix([hotStream, coldStream]);
    assertAlmostEquals(s.pressure, 101325);
});

Deno.test("Mixer: empty array throws", () => {
    assertThrows(() => Mixer.mix([]), Error, "Mixer requires feeds");
});