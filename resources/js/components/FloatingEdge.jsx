import React from 'react';
import { BaseEdge, getStraightPath } from '@xyflow/react';

function FloatingEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, style }) {
    const [path] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });

    return (
        <BaseEdge
            id={id}
            path={path}
            markerEnd={markerEnd}
            style={style}
        />
    );
}

export default FloatingEdge;
