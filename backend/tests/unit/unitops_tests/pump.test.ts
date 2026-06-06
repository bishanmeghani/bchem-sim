import { assert, assertAlmostEquals, assertThrows } from "@std/assert"
import { Pump } from "../../../src/unitops/unitops.ts";
import { Stream } from "../../../src/types/types.ts";

const baseStream: Stream = {
    id: "test-stream",
    massFlow: 10.0,
    temperature: 300,
    pressure: 101325,
    composition: { water: 0.5, ethanol: 0.5 },
    phase: "liquid"
};

Deno.test("Pump: pressure increase is correct", () => {
    const { outStream} = Pump.pressurised(baseStream, baseStream.pressure + 50000);
    assertAlmostEquals(outStream.pressure, baseStream.pressure + 50000);
});

Deno.test("Pump: mass flow is conserved", () => {
    const { outStream} = Pump.pressurised(baseStream, baseStream.pressure + 50000);
    assertAlmostEquals(outStream.massFlow, baseStream.massFlow);
});