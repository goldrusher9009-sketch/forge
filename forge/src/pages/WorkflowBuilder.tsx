import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Alert from '../components/Alert';
import '../styles/WorkflowBuilder.css';

interface Node {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'end';
  label: string;
  x: number;
  y: number;
  config: Record<string, any>;
}

interface Edge {
  from: string;
  to: string;
  condition?: string;
}

const WorkflowBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', type: 'trigger', label: 'Start', x: 50, y: 50, config: {} },
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [workflowName, setWorkflowName] = useState('New Workflow');

  const addNode = (type: Node['type']) => {
    const newId = Math.max(...nodes.map(n => parseInt(n.id)), 0) + 1;
    const newNode: Node = {
      id: String(newId),
      type,
      label: `${type.charAt(0).toUpperCase()}${type.slice(1)} ${newId}`,
      x: 100,
      y: 100 + nodes.length * 50,
      config: {},
    };
    setNodes([...nodes, newNode]);
  };

  const deleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    setEdges(edges.filter(e => e.from !== id && e.to !== id));
    setSelectedNode(null);
  };

  const handleNodeDrag = useCallback((id: string, dx: number, dy: number) => {
    setNodes(nodes.map(node =>
      node.id === id ? { ...node, x: node.x + dx, y: node.y + dy } : node
    ));
  }, [nodes]);

  const handleNodeMouseDown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggedNode(id);
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      handleNodeDrag(id, dx, dy);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setDraggedNode(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const connectNodes = (fromId: string, toId: string) => {
    if (fromId !== toId) {
      setEdges([...edges, { from: fromId, to: toId }]);
    }
  };

  const handleSave = async () => {
    try {
      const workflowData = {
        name: workflowName,
        nodes,
        edges,
      };

      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/workflows/${id}` : '/api/workflows';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData),
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'Workflow saved successfully' });
        setTimeout(() => navigate('/workflows'), 1500);
      } else {
        setAlert({ type: 'error', message: 'Failed to save workflow' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Error saving workflow' });
    }
  };

  const nodeTypeColors: Record<Node['type'], string> = {
    trigger: '#10b981',
    action: '#7c3aed',
    condition: '#f59e0b',
    end: '#ef4444',
  };

  return (
    <div className="workflow-builder-page">
      <div className="builder-header">
        <Button variant="secondary" onClick={() => navigate('/workflows')}>
          ← Back
        </Button>
        <Input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="Workflow name"
          style={{ maxWidth: '300px' }}
        />
        <div className="builder-actions">
          <Button variant="secondary" onClick={() => navigate('/workflows')}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Workflow
          </Button>
        </div>
      </div>

      <div className="builder-container">
        <div className="toolbar">
          <Card>
            <div className="card-header">
              <h3>Components</h3>
            </div>
            <div className="card-body toolbar-buttons">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => addNode('action')}
              >
                + Action
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => addNode('condition')}
              >
                + Condition
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => addNode('end')}
              >
                + End
              </Button>
            </div>
          </Card>
        </div>

        <div className="canvas-wrapper">
          <div className="canvas" ref={canvasRef}>
            <svg className="edges-svg">
              {edges.map((edge, idx) => {
                const fromNode = nodes.find(n => n.id === edge.from);
                const toNode = nodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;
                return (
                  <line
                    key={idx}
                    x1={fromNode.x + 60}
                    y1={fromNode.y + 30}
                    x2={toNode.x + 60}
                    y2={toNode.y + 30}
                    stroke="#ccc"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>

            {nodes.map(node => (
              <div
                key={node.id}
                className={`canvas-node ${selectedNode === node.id ? 'selected' : ''}`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  backgroundColor: nodeTypeColors[node.type],
                }}
                onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                onClick={() => setSelectedNode(node.id)}
              >
                <div className="node-label">{node.label}</div>
                <div className="node-handles">
                  <div
                    className="handle handle-out"
                    onMouseDown={(e) => e.stopPropagation()}
                    title="Drag to connect"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedNode && (
          <Card className="node-config">
            <div className="card-header">
              <h3>Node Configuration</h3>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  deleteNode(selectedNode);
                  setSelectedNode(null);
                }}
              >
                Delete
              </Button>
            </div>
            <div className="card-body">
              <Input
                label="Label"
                value={nodes.find(n => n.id === selectedNode)?.label || ''}
                onChange={(e) => {
                  setNodes(nodes.map(n =>
                    n.id === selectedNode ? { ...n, label: e.target.value } : n
                  ));
                }}
              />
              <p className="hint">Drag nodes on the canvas to position them. Connect nodes by dragging from the output handle.</p>
            </div>
          </Card>
        )}
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
    </div>
  );
};

export default WorkflowBuilder;