export type Composition = Record<string, number>;

export interface Stream {
    id: string;
    massFlow: number; //kg/s
    temperature: number; //K
    pressure?: number; //Pa
    composition: Composition; // mass fractions
    cp: number; // J/(kg·K)
}