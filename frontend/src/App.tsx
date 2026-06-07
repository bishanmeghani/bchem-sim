import React, { useRef, useState, useCallback } from 'react';
import { ReactFlow,  Background, Controls, useNodesState, useEdgesState, addEdge, useReactFlow } from '@xyflow/react';
import type { Connection, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import UnitOpNode from './nodes/UnitOpNode';
import Palette from './components/Palette';

const nodeTypes = { unitOp: UnitOpNode }

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('nodeType');
    const label = e.dataTransfer.getData('nodeLabel');
    if (!type) return;

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const newNode = {
      id: `${type}-${Date.now()}`,
      type: 'unitOp',
      position,
      data: { label, nodeType: type }
    };
    setNodes((nds) => nds.concat(newNode));
  };

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
    <div ref={reactFlowWrapper} style={{ width: '100vw', height: '100vh', position: 'relative' }}
      onDragOver = {onDragOver}
      onDrop = {onDrop}>
      <ReactFlow
        proOptions={{ hideAttribution: true }}
        nodeTypes={nodeTypes}
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        deleteKeyCode="Delete"
        fitView>
        <Background />
        <Controls />
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
      <Palette />
    </div>
  );
}