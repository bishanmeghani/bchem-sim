import { useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import type { Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: 'feed',     position: {x: 50,  y: 250}, data: {label: "Feed"} },
  { id: 'pump',     position: {x: 200, y: 250}, data: {label: "Pump"} },
  { id: 'mixer',    position: {x: 350, y: 250}, data: {label: "Mixer"} },
  { id: 'heater',   position: {x: 500, y: 250}, data: {label: "Heater"} },
  { id: 'flash',    position: {x: 650, y: 250}, data: {label: "Flash Drum"} },
  { id: 'vapor',    position: {x: 800, y: 100}, data: {label: "Vapor"} },
  { id: 'splitter', position: {x: 800, y: 350}, data: {label: "Splitter"} },
  { id: 'liquid',   position: {x: 950, y: 350}, data: {label: "Liquid"} }
];

const initialEdges = [
  { id: 'e1', source: 'feed', target: 'pump' },
  { id: 'e2', source: 'pump', target: 'mixer' },
  { id: 'e3', source: 'mixer', target: 'heater' },
  { id: 'e4', source: 'heater', target: 'flash' },
  { id: 'e5', source: 'flash', target: 'vapor' },
  { id: 'e6', source: 'flash', target: 'splitter' },
  { id: 'e7', source: 'splitter', target: 'liquid' },
  { id: 'e8', source: 'splitter', target: 'mixer', label: 'recycle' }
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges]
  );

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://effective-goldfish-6v7jx659x7xf5rpq-8000.app.github.dev/');
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult('Error: could not reach backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ReactFlow 
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView>
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8}}>
        <button onClick={runSimulation} disabled={loading} style= {{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          {loading ? 'Running...' : 'Run Simulation'}
        </button>
          {result && (
            <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 12, borderRadius: 6, fontSize: 11, maxHeight: 400, overflow: 'auto', maxWidth: 350 }}>
              {result}
            </pre>
          )}
      </div>
    </div>
  );
}