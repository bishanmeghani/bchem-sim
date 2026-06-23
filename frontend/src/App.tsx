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
      return addEdge({
        ...connection,
        label: `S${streamNumber}`,
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

    setLoading(true);
    try {
      const res = await fetch('https://effective-goldfish-6v7jx659x7xf5rpq-8000.app.github.dev/');
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
          onConnect={onConnect}
          deleteKeyCode="Delete"
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedNodeId(null)}
          >
          <Controls />
        </ReactFlow>
      </div>
    </Layout>
  );
}