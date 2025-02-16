import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow'

const useDiagramStore = create((set, get) => ({
  nodes: [],
  edges: [],

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes)
    })
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges)
    })
  },

  onConnect: (connection) => {
    const edge = {
      ...connection,
      type: 'relationship',
      // Always start with one-to-one relationship by default
      data: {
        sourceCardinality: 'one',
        targetCardinality: 'one'
      }
    };

    set((state) => ({
      edges: addEdge(edge, state.edges)
    }));
  },

  addTableNode: (table) => {
    const { nodes } = get()
    const newNode = {
      id: table.name,
      type: 'tableNode',
      position: table.position,
      data: {
        name: table.name,
        fields: table.fields
      }
    }
    set({ nodes: [...nodes, newNode] })
    return newNode.id
  },

  removeTable: (tableName) => {
    const { nodes, edges } = get()
    const nodeExists = nodes.some(node => node.id === tableName)
    if (!nodeExists) return false

    set({
      nodes: nodes.filter(node => node.id !== tableName),
      edges: edges.filter(edge => 
        edge.source !== tableName && edge.target !== tableName
      )
    })
    return true
  },

  removeColumn: (tableName, columnName) => {
    const { nodes, edges } = get()
    const tableNode = nodes.find(node => node.id === tableName)
    if (!tableNode) return false

    const fieldExists = tableNode.data.fields.some(field => field.name === columnName)
    if (!fieldExists) return false

    set({
      nodes: nodes.map(node => {
        if (node.id === tableName) {
          return {
            ...node,
            data: {
              ...node.data,
              fields: node.data.fields.filter(field => field.name !== columnName)
            }
          }
        }
        return node
      }),
      edges: edges.filter(edge => 
        !(edge.sourceHandle?.startsWith(columnName) || 
          edge.targetHandle?.startsWith(columnName))
      )
    })
    return true
  },

  addColumn: (tableName, column) => {
    const { nodes } = get()
    const tableNode = nodes.find(node => node.id === tableName)
    if (!tableNode) return false

    const fieldExists = tableNode.data.fields.some(field => field.name === column.name)
    if (fieldExists) return false

    set({
      nodes: nodes.map(node => {
        if (node.id === tableName) {
          return {
            ...node,
            data: {
              ...node.data,
              fields: [...node.data.fields, column]
            }
          }
        }
        return node
      })
    })
    return true
  },

  updateField: (tableName, fieldName, updates) => {
    const { nodes } = get()
    const tableNode = nodes.find(node => node.id === tableName)
    if (!tableNode) return false

    const fieldExists = tableNode.data.fields.some(field => field.name === fieldName)
    if (!fieldExists) return false

    set({
      nodes: nodes.map(node => {
        if (node.id === tableName) {
          return {
            ...node,
            data: {
              ...node.data,
              fields: node.data.fields.map(field => {
                if (field.name === fieldName) {
                  return { ...field, ...updates }
                }
                return field
              })
            }
          }
        }
        return node
      })
    })
    return true
  },

  setPrimaryKey: (tableName, fieldName) => {
    const { nodes } = get()
    const tableNode = nodes.find(node => node.id === tableName)
    if (!tableNode) return false

    const fieldExists = tableNode.data.fields.some(field => field.name === fieldName)
    if (!fieldExists) return false

    set({
      nodes: nodes.map(node => {
        if (node.id === tableName) {
          return {
            ...node,
            data: {
              ...node.data,
              fields: node.data.fields.map(field => ({
                ...field,
                isPrimary: field.name === fieldName
              }))
            }
          }
        }
        return node
      })
    })
    return true
  },

  setEdges: (newEdges) => {
    set({ edges: newEdges })
  },

  arrangeNodes: () => {
    const { nodes } = get()
    const radius = Math.max(300, nodes.length * 100)
    const center = { x: radius, y: radius }
    const angleStep = (2 * Math.PI) / nodes.length

    set({
      nodes: nodes.map((node, i) => ({
        ...node,
        position: {
          x: center.x + radius * Math.cos(i * angleStep),
          y: center.y + radius * Math.sin(i * angleStep)
        }
      }))
    })
  },

  clearDiagram: () => {
    set({
      nodes: [],
      edges: []
    })
  }
}))

export default useDiagramStore
