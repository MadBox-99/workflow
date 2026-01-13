import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Shadcn utility for merging Tailwind classes
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Calculate the edge parameters to connect nodes from their centers
export function getEdgeParams(source, target) {
    const sourceIntersectionPoint = getNodeIntersection(source, target);
    const targetIntersectionPoint = getNodeIntersection(target, source);

    const sourcePos = source.position;
    const targetPos = target.position;
    const sourceWidth = source.measured?.width ?? 0;
    const sourceHeight = source.measured?.height ?? 0;
    const targetWidth = target.measured?.width ?? 0;
    const targetHeight = target.measured?.height ?? 0;

    const sx = sourceIntersectionPoint.x;
    const sy = sourceIntersectionPoint.y;
    const tx = targetIntersectionPoint.x;
    const ty = targetIntersectionPoint.y;

    return { sx, sy, tx, ty };
}

// Get the intersection point between a node and a line to another node
function getNodeIntersection(intersectionNode, targetNode) {
    const {
        measured: intersectionNodeSize,
        position: intersectionNodePosition,
    } = intersectionNode;
    const targetPosition = targetNode.position;

    const w = intersectionNodeSize?.width ?? 0;
    const h = intersectionNodeSize?.height ?? 0;

    const x2 = intersectionNodePosition.x + w / 2;
    const y2 = intersectionNodePosition.y + h / 2;
    const x1 = targetPosition.x + (targetNode.measured?.width ?? 0) / 2;
    const y1 = targetPosition.y + (targetNode.measured?.height ?? 0) / 2;

    const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
    const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
    const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
    const xx3 = a * xx1;
    const yy3 = a * yy1;
    const x = w * (xx3 + yy3) + x2;
    const y = h * (-xx3 + yy3) + y2;

    return { x, y };
}
