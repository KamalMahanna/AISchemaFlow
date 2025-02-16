import { memo } from 'react'
import { Handle, Position } from 'reactflow'

const TableNode = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-3 min-w-[200px] group">
      {/* Table Name */}
      <div className="font-bold text-gray-700 border-b border-gray-200 pb-2 mb-2">
        {data.name}
      </div>

      {/* Fields */}
      <div className="space-y-1">
        {data.fields.map((field) => (
          <div
            key={field.name}
            className="flex items-center justify-between text-sm hover:bg-gray-50 rounded px-1 relative py-1"
          >
            {/* Left Handle */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2">
              <Handle
                type="source"
                position={Position.Left}
                id={`${field.name}-left`}
                className="w-2 h-2 rounded-full bg-gray-400 border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity"
                isValidConnection={(connection) => {
                  return connection.source !== data.id;
                }}
              />
              <Handle
                type="target"
                position={Position.Left}
                id={`${field.name}-left`}
                className="w-2 h-2 rounded-full bg-gray-400 border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity"
                isValidConnection={(connection) => {
                  return connection.target !== data.id;
                }}
              />
            </div>

            {/* Field Info */}
            <div className="flex flex-1 px-2 items-center min-w-0">
              {field.isPrimary && (
                <span className="text-yellow-600 mr-1.5 flex-shrink-0" title="Primary Key">🔑</span>
              )}
              <span className="text-gray-700 truncate flex items-center">
                {field.name}
                {field.isForeignKey && (
                  <span className="ml-1.5 text-xs text-blue-500" title="Foreign Key">
                    {`➜ ${field.references?.table}.${field.references?.field}`}
                  </span>
                )}
              </span>
              <span className="text-gray-400 ml-2 flex-shrink-0">{field.type}</span>
            </div>

            {/* Right Handle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <Handle
                type="source"
                position={Position.Right}
                id={`${field.name}-right`}
                className="w-2 h-2 rounded-full bg-gray-400 border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity"
                isValidConnection={(connection) => {
                  return connection.source !== data.id;
                }}
              />
              <Handle
                type="target"
                position={Position.Right}
                id={`${field.name}-right`}
                className="w-2 h-2 rounded-full bg-gray-400 border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity"
                isValidConnection={(connection) => {
                  return connection.target !== data.id;
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(TableNode)
