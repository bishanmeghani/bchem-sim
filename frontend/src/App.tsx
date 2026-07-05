import React, { useRef, useState, useCallback } from 'react';
import { ReactFlow, Controls, useNodesState, useEdgesState, addEdge, useReactFlow, MarkerType } from '@xyflow/react';
import type { Connection, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Layout from './components/Layout';
import UnitOpNode from './nodes/UnitOpNode';
import toast from 'react-hot-toast';

const nodeTypes = { unitOp: UnitOpNode }

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [hoveredEdge, setHoveredEdge] = useState<{id: string, x: number, y: number} | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [components, setComponents] = useState<string[]>(['water', 'ethanol']);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;
  
  const onNew = () => {
    setNodes([]);
    setEdges([]);
  };

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => {
      const streamNumber = eds.length + 1;
      const streamLabel = `S${streamNumber}`;
      return addEdge({
        ...connection,
        id: streamLabel,
        label: streamLabel,
        type: 'step',
        style: { stroke: '#64748b', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b', width: 15, height: 15},
        labelStyle: { fontSize: 10, fill: '#94a3b8' },
        labelBgStyle: { fill: 'rgba(15,23,42,0.8)', fillOpacity: 1 }, 
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 3,
      }, eds);
    }), [setEdges]
  );

  const hasFeed = () => nodes.some(n => n.data.nodeType === 'feed');

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('nodeType');
    
    if (!type) return;

    if (type !== "feed" && !hasFeed()) {
      toast.error('Please add a feed node first');
      return;
    }

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const getNodeLabel = (type: string, existingNodes: Node[]) => {
      const prefixMap: Record<string, string> = {
        feed: 'F',
        pump: 'P',
        mixer: 'M',
        heater: 'H',
        flash: 'V',
        splitter: 'SP',
        outlet: 'O',
      };
      const prefix = prefixMap[type] ?? type[0].toUpperCase();
      const count = existingNodes.filter(n => n.data.nodeType === type).length + 1;
      return `${prefix}${count}`;
    };
    const label = getNodeLabel(type, nodes);
    const newNode = {
      id: `${type}-${Date.now()}`,
      type: 'unitOp',
      position,
      data: { label, nodeType: type }
    };
    setNodes((nds) => nds.concat(newNode));    
  };

  const runSimulation = async () => {
    const connectedNodeIds = new Set(edges.flatMap(e => [e.source, e.target]));
    const unconnectedNodes = nodes.filter(n => !connectedNodeIds.has(n.id));
    if (unconnectedNodes.length > 0) {
      toast.error('All nodes must be connected before running the simulation');
      return;
    }

    if (!hasFeed()) {
      toast.error('Please add a feed node before running the simulation');
      return;
    }

    const payload = {
      nodes: nodes.map(n => ({
            id: n.id,
            nodeType: n.data.nodeType,
            label: n.data.label,
            data: n.data,
        })),
      edges: edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
        })),
      components,
    };

    setLoading(true);
    try {
        const res = await fetch('https://effective-goldfish-6v7jx659x7xf5rpq-8000.app.github.dev/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        setResult(JSON.stringify(data, null, 2));
      toast.success("Simulation converged!");
    } catch (err) {
      toast.error("Couldn't reach backend");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onNodeDataChange = useCallback((id: string, newData: Record<string, unknown>) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...newData } } : n));
  }, [setNodes]);

  const onEdgeMouseEnter = useCallback((_: React.MouseEvent, edge: Edge) => {
    const el = document.querySelector(`[data-id="${edge.id}"]`);
    const rect = el?.getBoundingClientRect();
    if (rect) setHoveredEdge({ id: edge.id, x: rect.x + rect.width/2, y: rect.y });
  }, []);

  const onEdgeMouseLeave = useCallback(() => {
    setHoveredEdge(null);
  }, []);

  return (
    <Layout onRun={runSimulation} onNew={onNew} onFitView={fitView} result={result} loading={loading} components={components} onComponentsChange={setComponents} selectedNode={selectedNode} onNodeDataChange={onNodeDataChange}>
      <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
        onDragOver = {onDragOver}
        onDrop = {onDrop}>
        <ReactFlow
          snapToGrid={true}
          snapGrid={[20, 20]}
          proOptions={{ hideAttribution: true }}
          nodeTypes={nodeTypes}
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeMouseEnter={onEdgeMouseEnter}
          onEdgeMouseLeave={onEdgeMouseLeave}
          onConnect={onConnect}
          deleteKeyCode="Delete"
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedNodeId(null)}
          >
          <Controls />
        </ReactFlow>
        {hoveredEdge && (() => {
          const edge = edges.find(e => e.id === hoveredEdge.id);
          if (!edge) return null;
          const label = edge.label as string;
          const streamData = result ? (() => {
            try {
              const parsed = JSON.parse(result);
              return parsed.streams?.[label] ?? null;
            } catch { return null; }
          })() : null;
          return (
            <div style={{
              position: 'fixed', left: hoveredEdge.x, top: hoveredEdge.y - 10,
              transform: 'translate(-50%, -100%)',
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: 6, padding: '8px 12px', fontSize: 11,
              color: '#e2e8f0', zIndex: 1000, pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)', minWidth: 160
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#94a3b8', fontFamily: 'monospace' }}>{label}</div>
              {streamData ? <>
                <div style={{ color: '#475569', fontSize: 10, marginBottom: 2 }}>Mass Flow: <span style={{ color: '#e2e8f0' }}>{streamData.massFlow?.toFixed(3)} kg/s</span></div>
                <div style={{ color: '#475569', fontSize: 10, marginBottom: 2 }}>Temperature: <span style={{ color: '#e2e8f0' }}>{streamData.temperature?.toFixed(1)} K</span></div>
                <div style={{ color: '#475569', fontSize: 10, marginBottom: 2 }}>Pressure: <span style={{ color: '#e2e8f0' }}>{streamData.pressure?.toFixed(0)} Pa</span></div>
                <div style={{ color: '#475569', fontSize: 10, marginBottom: 2 }}>Phase: <span style={{ color: streamData.phase === 'vapor' ? '#f59e0b' : '#3b82f6' }}>{streamData.phase}</span></div>
                <div style={{ color: '#475569', fontSize: 10, marginTop: 4, marginBottom: 2, fontWeight: 700 }}>COMPOSITION</div>
                {Object.entries(streamData.composition ?? {}).map(([k, v]) => (
                    <div key={k} style={{ color: '#475569', fontSize: 10 }}>{k}: <span style={{ color: '#e2e8f0' }}>{(v as number).toFixed(4)}</span></div>
                ))}
              </> : <div style={{ color: '#475569', fontSize: 10 }}>No simulation data yet</div>}
            </div>
          );
        })()}
      </div>
    </Layout>
  );
}