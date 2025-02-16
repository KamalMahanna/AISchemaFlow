import { useCallback, useState, useRef, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  Panel,
  useReactFlow,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import ChatInterface from './components/Chat/ChatInterface'
import TableNode from './components/Diagram/nodes/TableNode'
import RelationshipEdge from './components/Diagram/edges/RelationshipEdge'
import ConfirmModal from './components/UI/ConfirmModal'
import useDiagramStore from './store/useDiagramStore'
import { FiRefreshCw, FiTrash2, FiKey } from 'react-icons/fi'

// Define custom node types
const nodeTypes = {
  tableNode: TableNode,
}

// Define custom edge types
const edgeTypes = {
  relationship: RelationshipEdge,
}

// Default edge options
const defaultEdgeOptions = {
  type: 'relationship'
}

function FlowCanvas({ chatInterfaceRef }) {
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, edgeId: null });
  const [showApiKeyInput, setShowApiKeyInput] = useState(!localStorage.getItem('gemini_api_key'));
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    clearDiagram,
    arrangeNodes,
    setEdges,
  } = useDiagramStore()

  const { fitView } = useReactFlow()

  // Auto-fit view when tables are added or removed
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2 })
      }, 50)
    }
  }, [nodes.length, fitView])

  const handleArrangeClick = useCallback(() => {
    arrangeNodes()
    setTimeout(() => {
      fitView({ padding: 0.2 })
    }, 50)
  }, [arrangeNodes, fitView])

  const handleClearClick = useCallback(() => {
    setConfirmModal({
      isOpen: true,
      edgeId: null,
      message: 'This will clear everything and reset the application. Are you sure?',
      onConfirm: () => {
        clearDiagram();
        if (chatInterfaceRef.current) {
          chatInterfaceRef.current.clearChat();
        }
        setConfirmModal({ isOpen: false, edgeId: null });
        window.location.reload();
      }
    });
  }, [clearDiagram]);

  const handleEdgeDoubleClick = useCallback((evt, edge) => {
    evt.preventDefault();
    setConfirmModal({
      isOpen: true,
      edgeId: edge.id,
      message: 'Do you want to remove this connection?',
      onConfirm: () => {
        setEdges(edges.filter(e => e.id !== edge.id));
        setConfirmModal({ isOpen: false, edgeId: null });
      }
    });
  }, [edges, setEdges]);

  const handleCancelModal = useCallback(() => {
    setConfirmModal({ isOpen: false, edgeId: null });
  }, []);

  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', apiKey);
    setShowApiKeyInput(false);
    window.location.reload();
  };

  const handleConnect = onConnect;

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onEdgeDoubleClick={handleEdgeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        className="flow-container"
        minZoom={0.1}
        maxZoom={4}
        connectionMode="loose"
      >
        <Background color="#94a3b8" gap={16} />
        <Controls 
          showZoom={true}
          showFitView={true}
          showInteractive={true}
          position="bottom-left"
        />
        
        {/* Control Panel - Right with horizontal layout */}
        <Panel position="top-right" className="flex flex-row gap-2">
          <button
            onClick={handleArrangeClick}
            className="control-btn bg-blue-500 hover:bg-blue-600"
            title="Arrange tables in a circle"
          >
            <FiRefreshCw className="w-5 h-5" />
            <span>Arrange</span>
          </button>
          <button
            onClick={handleClearClick}
            className="control-btn bg-red-500 hover:bg-red-600"
            title="Reset application"
          >
            <FiTrash2 className="w-5 h-5" />
            <span>Clear</span>
          </button>
          <button
            onClick={() => setShowApiKeyInput(true)}
            className="control-btn bg-gray-500 hover:bg-gray-600"
            title="Set API Key"
          >
            <FiKey className="w-5 h-5" />
            <span>API Key</span>
          </button>
        </Panel>

        {/* Guide Panel at Top Center */}
        {nodes.length === 0 && (
          <Panel position="top" className="guide-panel mt-4">
            <p className="mt-2">
              1. Set your Gemini API key<br />
              2. Describe your tables in the chat<br />
              3. Drag from a field's connection point to another field<br />
              4. Use the Arrange button to organize tables<br />
              5. Double-click on a connection to remove it<br />
              6. Clear button resets everything<br />
              7. Click | or ≺ to toggle relationship type
            </p>
          </Panel>
        )}
      </ReactFlow>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={handleCancelModal}
      />

      {showApiKeyInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Set Your Gemini API Key</h3>
            <form onSubmit={handleApiKeySubmit} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Get your API key from{' '}
                  <a 
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    Google AI Studio
                  </a>
                </p>
                <input
                  type="text"
                  value={apiKey.length > 5 ? '•'.repeat(apiKey.length - 5) + apiKey.slice(-5) : apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="Enter your API key"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowApiKeyInput(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function App() {
  const chatInterfaceRef = useRef(null);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat Interface - 25% width */}
      <div className="chat-container">
        <ChatInterface ref={chatInterfaceRef} />
      </div>

      {/* Diagram Canvas - 75% width */}
      <div className="diagram-container">
        <FlowCanvas chatInterfaceRef={chatInterfaceRef} />
      </div>
    </div>
  )
}

export default App
