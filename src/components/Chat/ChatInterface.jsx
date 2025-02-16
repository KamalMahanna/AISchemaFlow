import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { FiSend, FiLoader, FiHelpCircle } from 'react-icons/fi'
import aiService from '../../services/aiService'
import useDiagramStore from '../../store/useDiagramStore'
import HelpModal from '../UI/HelpModal'

let messageIdCounter = 0;
const generateUniqueId = () => `msg_${Date.now()}_${++messageIdCounter}`;

const ChatInterface = forwardRef((props, ref) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  
  // Expose clearChat method to parent components
  useImperativeHandle(ref, () => ({
    clearChat: () => {
      setMessages([]);
      setInput('');
      setIsProcessing(false);
    }
  }));

  const {
    nodes,
    edges,
    addTableNode,
    removeTable,
    removeColumn,
    addColumn,
    updateField,
    setPrimaryKey,
    setEdges,
  } = useDiagramStore()

  useEffect(() => {
    if (!localStorage.getItem('gemini_api_key')) {
      setMessages([{
        id: 'welcome',
        text: 'Welcome! Please set your Gemini API key using the API Key button to get started.',
        sender: 'system'
      }]);
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 96; // 4 lines (24px * 4)
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = (message) => {
    setMessages(prev => [...prev, { ...message, id: generateUniqueId() }])
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleModification = async (modificationData) => {
    const { type, tableName, columnName, column, fieldName, newType } = modificationData;
    
    switch (type) {
      case 'remove_table':
        if (removeTable(tableName)) {
          addMessage({
            text: `Successfully removed table '${tableName}'`,
            sender: 'ai'
          });
        } else {
          addMessage({
            text: `Table '${tableName}' not found. Please check the table name.`,
            sender: 'ai'
          });
        }
        break;

      case 'remove_column':
        if (removeColumn(tableName, columnName)) {
          addMessage({
            text: `Successfully removed column '${columnName}' from table '${tableName}'`,
            sender: 'ai'
          });
        } else {
          addMessage({
            text: `Could not remove column '${columnName}' from table '${tableName}'. Please check table and column names.`,
            sender: 'ai'
          });
        }
        break;

      case 'add_column':
        if (addColumn(tableName, column)) {
          addMessage({
            text: `Added new column '${column.name}' (${column.type}) to table '${tableName}'`,
            sender: 'ai'
          });
        } else {
          addMessage({
            text: `Could not add column to table '${tableName}'. The table might not exist or the column name is already in use.`,
            sender: 'ai'
          });
        }
        break;

      case 'set_primary_key':
        if (setPrimaryKey(tableName, fieldName)) {
          addMessage({
            text: `Set '${fieldName}' as primary key for table '${tableName}'`,
            sender: 'ai'
          });
        } else {
          addMessage({
            text: `Could not set primary key in table '${tableName}'. Please check table and field names.`,
            sender: 'ai'
          });
        }
        break;

      case 'change_type':
        if (updateField(tableName, fieldName, { type: newType })) {
          addMessage({
            text: `Updated field '${fieldName}' in table '${tableName}' to type ${newType}`,
            sender: 'ai'
          });
        } else {
          addMessage({
            text: `Could not update field type. Please check table and field names.`,
            sender: 'ai'
          });
        }
        break;

      default:
        addMessage({
          text: 'Unknown modification requested. Please try rephrasing your command.',
          sender: 'ai'
        });
    }
  }

  const processSchemaWithAI = async (description) => {
    try {
      const result = await aiService.parseSchemaDescription(description);
      
      if (result.isModification) {
        await handleModification(result);
        return;
      }

      const schema = result.schema;
      if (!schema.tables || schema.tables.length === 0) {
        throw new Error('Failed to parse schema. Click the ? button above to see example commands and schema format.');
      }

      // Get existing table names
      const existingTables = new Map(
        nodes.map(node => [node.data.name, node])
      );

      // Add new tables
      const newTables = schema.tables.filter(
        table => !existingTables.has(table.name)
      );

      if (newTables.length === 0 && schema.relationships.length === 0) {
        addMessage({
          text: 'The table already exist :(',
          sender: 'ai'
        });
        return;
      }

      // Calculate positions for new tables
      const startAngle = nodes.length > 0 ? Math.PI / 2 : 0;
      const totalTables = nodes.length + newTables.length;
      const tablePositions = calculateTablePositions(totalTables, startAngle);

      // Add new table nodes
      const tableNodesMap = new Map(
        [...nodes.map(node => [node.data.name, node.id])]
      );

      newTables.forEach((table, index) => {
        const position = tablePositions[nodes.length + index];
        const nodeId = addTableNode({
          ...table,
          position
        });
        tableNodesMap.set(table.name, nodeId);
      });

      if (newTables.length > 0) {
        addMessage({
          text: `👍 Added ${newTables.length} new table(s):\n${
            newTables.map(table => 
              `• ${table.name}: ${table.fields.length} fields`
            ).join('\n')
          }`,
          sender: 'ai'
        });
      }

      // Process relationships
      if (schema.relationships && schema.relationships.length > 0) {
        const newEdges = schema.relationships
          .filter(rel => {
            return tableNodesMap.has(rel.from.table) && 
                   tableNodesMap.has(rel.to.table) &&
                   !edges.some(edge => 
                     edge.source === tableNodesMap.get(rel.from.table) &&
                     edge.target === tableNodesMap.get(rel.to.table)
                   );
          })
          .map(rel => ({
            id: `edge-${generateUniqueId()}`,
            source: tableNodesMap.get(rel.from.table),
            target: tableNodesMap.get(rel.to.table),
            sourceHandle: `${rel.from.field}-right`,
            targetHandle: `${rel.to.field}-left`,
            type: 'relationship',
            data: {
              sourceCardinality: rel.type.startsWith('many') ? 'many' : 'one',
              targetCardinality: 'one'
            }
          }));

        if (newEdges.length > 0) {
          setEdges([...edges, ...newEdges]);

          addMessage({
            text: `Added ${newEdges.length} new relationships:\n${
              schema.relationships
                .filter(rel => tableNodesMap.has(rel.from.table) && tableNodesMap.has(rel.to.table))
                .map(rel =>
                  `• ${rel.from.table}.${rel.from.field} → ${rel.to.table}.${rel.to.field} (${rel.type})`
                ).join('\n')
            }`,
            sender: 'ai'
          });
        }
      }

    } catch (error) {
      console.error('Error:', error);
      
      if (error.message.includes('API key')) {
        addMessage({
          text: 'There was a problem with your API key. Please check it and try again.',
          sender: 'system'
        });
      } else {
        addMessage({
          text: error.message,
          sender: 'ai'
        });
      }
    }
  }

  const calculateTablePositions = (count, startAngle = 0) => {
    const radius = Math.max(300, count * 100);
    const positions = [];
    for (let i = 0; i < count; i++) {
      const angle = startAngle + (i / count) * 2 * Math.PI;
      positions.push({
        x: radius * Math.cos(angle) + radius,
        y: radius * Math.sin(angle) + radius
      });
    }
    return positions;
  }

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userInput = input.trim();
    setInput('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    setIsProcessing(true);

    addMessage({
      text: userInput,
      sender: 'user'
    });

    try {
      await processSchemaWithAI(userInput);
    } catch (error) {
      addMessage({
        text: error.message,
        sender: 'system'
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-gray-500 text-center p-4">
            <h3 className="font-bold mb-2">Draw Database with AI</h3>
            <p className="mb-4">Create and modify your database schema using natural language.</p>
            <div className="text-sm space-y-4">
              <div>
                <p className="font-bold mb-1">Create Tables:</p>
                <p className="bg-gray-50 p-2 rounded mb-2">
                  "Create a users table with name, email, password"
                </p>
                <p className="bg-gray-50 p-2 rounded">
                  "Create a blog with users (name, email), posts (title, content), and comments (content, created_at)"
                </p>
              </div>
              <div className="text-xs text-gray-600">
                Create tables one by one or multiple at once - it's up to you!
              </div>
            </div>
          </div>
        )}
        
        {messages.map(message => (
          <div
            key={message.id}
            className={`chat-message ${
              message.sender === 'user' 
                ? 'bg-blue-50 ml-8'
                : message.sender === 'system'
                  ? 'bg-red-50'
                  : 'bg-gray-50 mr-8'
            }`}
          >
            <div className="whitespace-pre-wrap">{message.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input">
        <div className="flex items-center gap-2">
          <textarea
            ref={textareaRef}
            rows="1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isProcessing 
              ? "Processing..."
              : "Describe your schema or modifications..."
            }
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto"
            disabled={isProcessing}
            style={{ maxHeight: '96px' }} // 4 lines (24px * 4)
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              title="Show modification commands"
            >
              <FiHelpCircle className="w-5 h-5" />
            </button>
            <button
              type="submit"
              className={`w-10 h-10 flex items-center justify-center text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <FiLoader className="w-5 h-5 animate-spin" />
              ) : (
                <FiSend className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </form>

      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </>
  )
});

export default ChatInterface;
