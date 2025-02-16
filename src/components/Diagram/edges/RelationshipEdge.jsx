import React, { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
  Position,
} from 'reactflow';
import ConfirmModal from '../../UI/ConfirmModal';
import './RelationshipEdge.css';

const RelationshipEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const { setEdges, deleteElements } = useReactFlow();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDoubleClick = (event) => {
    event.preventDefault();
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    deleteElements({ edges: [{ id }] });
    setShowDeleteModal(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  // Fixed offsets for edge rendering
  const markerOffset = 30;
  const foldOffset = 50;


  // Adjust marker and control points based on connection type
  const sourceMarker = {
    x: sourcePosition === Position.Left ? sourceX - markerOffset : sourceX + markerOffset,
    y: sourceY,
  };

  const targetMarker = {
    x: targetPosition === Position.Left ? targetX - markerOffset : targetX + markerOffset,
    y: targetY,
  };

  // Calculate control points with adjusted offsets based on connection type
  const sourceControl = sourcePosition === Position.Left ? sourceX - foldOffset : sourceX + foldOffset;
  const targetControl = targetPosition === Position.Left ? targetX - foldOffset : targetX + foldOffset;
  const midY = (sourceY + targetY) / 2;

  // Create path with consistent left/right connections
  const edgePath = `M ${sourceX} ${sourceY}
    L ${sourceControl} ${sourceY}
    L ${sourceControl} ${midY}
    L ${targetControl} ${midY}
    L ${targetControl} ${targetY}
    L ${targetX} ${targetY}`;

  const labelX = (sourceControl + targetControl) / 2;
  const labelY = midY;
  const toggleCardinality = (end) => {
    setEdges((edges) =>
      edges.map((edge) => {
        if (edge.id === id) {
          const key = `${end}Cardinality`;
          return {
            ...edge,
            data: {
              ...edge.data,
              [key]: edge.data?.[key] === 'one' ? 'many' : 'one',
            },
          };
        }
        return edge;
      })
    );
  };

  const OneMarker = ({ className }) => (
    <line
      x1="0"
      y1="-10"
      x2="0"
      y2="10"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    />
  );

  const ManyMarker = ({ className, isTarget }) => {
    const position = isTarget ? targetPosition : sourcePosition;
    const isLeft = position === Position.Left;
    
    return (
      <path
        d={isLeft ? "M 8,-10 L 0,0 L 8,10" : "M -8,-10 L 0,0 L -8,10"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={className}
      />
    );
  };

  return (
    <>
      <ConfirmModal
        isOpen={showDeleteModal}
        message="Are you sure you want to remove this relationship?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <g className="react-flow__connection">
        {/* Interactive background path */}
        <path
          d={edgePath}
          className="cursor-pointer"
          stroke="#4b5563"
          strokeWidth={12}
          strokeOpacity={0}
          fill="none"
          onDoubleClick={handleDoubleClick}
          onMouseEnter={(e) => e.target.style.strokeOpacity = 0.05}
          onMouseLeave={(e) => e.target.style.strokeOpacity = 0}
          style={{ pointerEvents: 'stroke' }}
        />
        {/* Visible edge with animation */}
        <path
          d={edgePath}
          stroke="#4b5563"
          strokeWidth={1.5}
          fill="none"
          className="animated-edge"
          style={{ 
            pointerEvents: 'none'
          }}
          markerEnd={markerEnd}
        />

      <EdgeLabelRenderer>
        {/* Source Marker */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceMarker.x}px, ${sourceMarker.y}px)`,
            pointerEvents: 'all',
            cursor: 'pointer',
            zIndex: 1001,
            padding: '1px',
            borderRadius: '50%',
          }}
          className="nodrag nopan"
          onClick={() => toggleCardinality('source')}
        >
          <svg width="20" height="20" viewBox="-10 -10 20 20">
            {data?.sourceCardinality === 'many' ? (
              <ManyMarker 
                className="text-gray-500 hover:text-blue-500"
                isTarget={false}
              />
            ) : (
              <OneMarker className="text-gray-500 hover:text-blue-500" />
            )}
          </svg>
        </div>

        {/* Target Marker */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${targetMarker.x}px, ${targetMarker.y}px)`,
            pointerEvents: 'all',
            cursor: 'pointer',
            zIndex: 1001,
            padding: '1px',
            borderRadius: '50%',
          }}
          className="nodrag nopan"
          onClick={() => toggleCardinality('target')}
        >
          <svg width="20" height="20" viewBox="-10 -10 20 20">
            {data?.targetCardinality === 'many' ? (
              <ManyMarker 
                className="text-gray-500 hover:text-blue-500"
                isTarget={true}
              />
            ) : (
              <OneMarker className="text-gray-500 hover:text-blue-500" />
            )}
          </svg>
        </div>

      </EdgeLabelRenderer>
    </g>
    </>
  );
};

export default RelationshipEdge;
