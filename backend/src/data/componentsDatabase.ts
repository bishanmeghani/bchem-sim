export type ComponentData = {
    id: string;
    name: string;
    molarMass: number; // kg/mol
    antoine: { A: number; B: number; C: number }; // log10(P/mmHg), T in °C
    cp: number; // J/kg/K
    hvap: number; // J/kg
};

export const COMPONENTS_DB: Record<string, ComponentData> = {
    water: {
        id: 'water', name: 'Water',
        molarMass: 0.018015,
        antoine: { A: 8.07131, B: 1730.630, C: 233.426 },
        cp: 4184, hvap: 2260000,
    },
    ethanol: {
        id: 'ethanol', name: 'Ethanol',
        molarMass: 0.04607,
        antoine: { A: 8.11220, B: 1592.864, C: 226.184 },
        cp: 2440, hvap: 841000,
    },
    methanol: {
        id: 'methanol', name: 'Methanol',
        molarMass: 0.03204,
        antoine: { A: 7.89750, B: 1474.080, C: 217.010 },
        cp: 2530, hvap: 1100000,
    },
    benzene: {
        id: 'benzene', name: 'Benzene',
        molarMass: 0.07811,
        antoine: { A: 6.90565, B: 1211.033, C: 220.790 },
        cp: 1720, hvap: 394000,
    },
    toluene: {
        id: 'toluene', name: 'Toluene',
        molarMass: 0.09214,
        antoine: { A: 6.95464, B: 1344.800, C: 219.482 },
        cp: 1690, hvap: 351000,
    },
};