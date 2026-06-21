export type HandleConfig = {
    id: string;
    type: "source" | "target";
    position: "top" | "bottom" | "left" | "right";
}

export type UnitOpDef = {
    type: string;
    label: string;
    category: string;
    maxInlets: number;
    maxOutlets: number;
    converged: boolean;
    handles: HandleConfig[];
    description: string;
}

export const UNIT_OPS_DB: Record<string, UnitOpDef> = {
    feed: {
        type: "feed",
        label: "Feed",
        category: "Stream",
        maxInlets: 0,
        maxOutlets: 1,
        converged: false,
        handles: [
            { id: 'out', type: 'source', position: 'right' },
        ],
        description: "A feed stream entering the process.",
    },
    pump: {
        type: "pump",
        label: "Pump",
        category: "Pressure Changers",
        maxInlets: 1,
        maxOutlets: 1,
        converged: false,
        handles: [
            { id: 'in', type: 'target', position: 'left' },
            { id: 'out', type: 'source', position: 'right' },
        ],
        description: "A pump for increasing fluid pressure.",
    },
    mixer: {
        type: "mixer",
        label: "Mixer",
        category: "Mixing",
        maxInlets: 10,
        maxOutlets: 1,
        converged: false,
        handles: [
            { id: 'in-1', type: 'target', position: 'left' },
            { id: 'in-2', type: 'target', position: 'bottom' },
            { id: 'out', type: 'source', position: 'right' },
        ],
        description: "A mixer for combining multiple streams.",
    },
    heater: {
        type: "heater",
        label: "Heater",
        category: "Heat Exchangers",
        maxInlets: 1,
        maxOutlets: 1,
        converged: false,
        handles: [
            { id: 'in', type: 'target', position: 'left' },
            { id: 'out', type: 'source', position: 'right' },
        ],
        description: "A heater for increasing fluid temperature.",
    },
    flash: {
        type: "flash",
        label: "Flash Drum",
        category: "Separation",
        maxInlets: 1,
        maxOutlets: 2,
        converged: false,
        handles: [
            { id: 'in', type: 'target', position: 'left' },
            { id: 'vapor', type: 'source', position: 'top' },
            { id: 'liquid', type: 'source', position: 'bottom' },
        ],
        description: "Isothermal flash drum for vapor-liquid separation.",
    },
    splitter: {
        type: "splitter",
        label: "Splitter",
        category: "Mixing",
        maxInlets: 1,
        maxOutlets: 10,
        converged: false,
        handles: [
            { id: 'in', type: 'target', position: 'left' },
            { id: 'out-1', type: 'source', position: 'right' },
            { id: 'out-2', type: 'source', position: 'bottom' },
        ],
        description: "A splitter for dividing a stream into multiple outlets.",
    },
    outlet: {
        type: "outlet",
        label: "Outlet",
        category: "Stream",
        maxInlets: 1,
        maxOutlets: 0,
        converged: false,
        handles: [
            { id: 'in', type: 'target', position: 'left' },
        ],
        description: "An outlet stream leaving the process.",
    },
}

export const PALETTE_CATEGORIES = [
    "Stream",
    "Pressure Changers",
    "Mixing",
    "Heat Exchangers",
    "Separation",
]