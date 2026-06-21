export type ComponentDef = {
    id: string;
    name: string;
    formula: string;
    molarMass: number;
    antoine: { A: number, B: number, C: number };
    cp: number;
    hvap: number;
}

export const COMPONENTS_DB: Record<string, ComponentDef> = {
    water: {
        id: 'water',
        name: 'Water',
        formula: 'H₂O',
        molarMass: 0.018015,
        antoine: { A: 8.07131, B: 1730.630, C: 233.426 },
        cp: 4184,
        hvap: 2260000,
    },
    ethanol: {
        id: 'ethanol',
        name: 'Ethanol',
        formula: 'C₂H₅OH',
        molarMass: 0.04607,
        antoine: { A: 8.11220, B: 1592.864, C: 226.184 },
        cp: 2440,
        hvap: 841000,
    },
    methanol: {
        id: 'methanol',
        name: 'Methanol',
        formula: 'CH₃OH',
        molarMass: 0.03204,
        antoine: { A: 7.89750, B: 1474.080, C: 217.010 },
        cp: 2530,
        hvap: 1100000,
    },
    benzene: {
        id: 'benzene',
        name: 'Benzene',
        formula: 'C₆H₆',
        molarMass: 0.07811,
        antoine: { A: 6.90565, B: 1211.033, C: 220.790 },
        cp: 1720,
        hvap: 394000,
    },
    toluene: {
        id: 'toluene',
        name: 'Toluene',
        formula: 'C₇H₈',
        molarMass: 0.09214,
        antoine: { A: 6.95464, B: 1344.800, C: 219.482 },
        cp: 1690,
        hvap: 351000,
    },
}