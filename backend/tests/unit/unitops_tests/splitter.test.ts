import { assert, assertEquals, assertAlmostEquals, assertThrows } from "@std/assert"
import { Splitter } from "../../../src/unitops/unitops.ts"
import { Stream } from "../../../src/types/types.ts"

const baseStream: Stream = {
    id: "test-stream",
    massFlow: 10.0,
    temperature: 300,
    pressure: 101325,
    composition: { water: 0.5, ethanol: 0.5 },
    phase: "liquid"
};

Deno.test("Splitter: mass flow splits correctly", () => {
    const [s1, s2] = Splitter.split(baseStream, [0.6, 0.4]);
    assertAlmostEquals(s1.massFlow, 6.0);
    assertAlmostEquals(s2.massFlow, 4.0);
});

Deno.test("Splitter: split flows sum up to inlet", () => {
    const [s1, s2] = Splitter.split(baseStream, [0.6, 0.4]);
    assertAlmostEquals(s1.massFlow + s2.massFlow, baseStream.massFlow);
});

Deno.test("Splitter: composition is preserved", () => {
    const [s1, s2] = Splitter.split(baseStream, [0.6, 0.4]);
    assertAlmostEquals(baseStream.composition.ethanol, s1.composition.ethanol);
    assertAlmostEquals(baseStream.composition.water, s1.composition.water);
    assertAlmostEquals(baseStream.composition.ethanol, s2.composition.ethanol);
    assertAlmostEquals(baseStream.composition.water, s2.composition.water);
});

Deno.test("Splitter: temperature and pressure is preserved", () => {
    const [s1, s2] = Splitter.split(baseStream, [0.6, 0.4]);
    assertAlmostEquals(baseStream.temperature, s1.temperature);
    assertAlmostEquals(baseStream.temperature, s1.temperature);
    assertAlmostEquals(baseStream.pressure, s2.pressure);
    assertAlmostEquals(baseStream.pressure, s2.pressure);
});

Deno.test("Splitter: invalid split ratios throw error", () => {
    assertThrows(() => Splitter.split(baseStream, [0.5, 0.6]), Error, "Split fractions must sum to 1");
});

Deno.test("Splitter: single split returns identical stream", () => {
    const [s1] = Splitter.split(baseStream, [1.0]);
    assertAlmostEquals(s1.massFlow, baseStream.massFlow);
});

Deno.test("Splitter: zero split returns zero mass flow", () => {
    const [s1, s2] = Splitter.split(baseStream, [0.0, 1.0]);
    assertAlmostEquals(s1.massFlow, 0.0);
    assertAlmostEquals(s2.massFlow, baseStream.massFlow);
});

Deno.test("Splitter: stream ids are unique", () => {
    const [s1, s2] = Splitter.split(baseStream, [0.5, 0.5]);
    assertEquals(s1.id, "test-stream-split1");
    assertEquals(s2.id, "test-stream-split2");
});