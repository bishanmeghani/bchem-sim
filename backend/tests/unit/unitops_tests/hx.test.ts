import { assert, assertAlmostEquals, assertThrows } from "@std/assert"
import { HeatExchanger } from "../../../src/unitops/unitops.ts";
import { Stream } from "../../../src/types/types.ts";

const baseStream: Stream = {
    id: "test-stream",
    massFlow: 10.0,
    temperature: 300,
    pressure: 101325,
    composition: { water: 0.5, ethanol: 0.5 },
    phase: "liquid"
};
   
Deno.test("Heat Exchanger: increasing the temperature requires a positive duty", () => {
    const { duty } = HeatExchanger.fromOutletTemp(baseStream, baseStream.temperature + 50);
    assert(duty > 0);
});
   
Deno.test("Heat Exchanger: heater is a cooler", () => {
    const { duty } = HeatExchanger.fromOutletTemp(baseStream, baseStream.temperature - 50);
    assert(duty < 0);
});

Deno.test("Heat Exchanger: outlet temperature equals target", () => {
    const { outStream } = HeatExchanger.fromOutletTemp(baseStream, 380);
    assertAlmostEquals(outStream.temperature, 380);
});

Deno.test("Heat Exchanger: mass flow is unchanged", () => {
    const { outStream } = HeatExchanger.fromOutletTemp(baseStream, 380);
    assertAlmostEquals(outStream.massFlow, baseStream.massFlow);
});

Deno.test("Heat Exchanger: no duty when target equals inlet temperature", () => {
    const { duty } = HeatExchanger.fromOutletTemp(baseStream, baseStream.temperature);
    assertAlmostEquals(duty, 0);
});