import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

const defaultLayoutOptions = {
    "elk.algorithm": "layered",
    "elk.direction": "DOWN",
    "elk.spacing.nodeNode": "80",
    "elk.layered.spacing.nodeNodeBetweenLayers": "100",
    "elk.layered.spacing.edgeNodeBetweenLayers": "40",
    "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
    "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
};

export const getLayoutedElements = async (nodes, edges, direction = "DOWN") => {
    const layoutOptions = {
        ...defaultLayoutOptions,
        "elk.direction": direction,
    };

    const graph = {
        id: "root",
        layoutOptions,
        children: nodes.map((node) => ({
            id: node.id,
            width: node.style?.width || node.measured?.width || 180,
            height: node.style?.height || node.measured?.height || 70,
        })),
        edges: edges.map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target],
        })),
    };

    try {
        const layoutedGraph = await elk.layout(graph);

        const layoutedNodes = nodes.map((node) => {
            const layoutedNode = layoutedGraph.children?.find((n) => n.id === node.id);
            if (!layoutedNode) return node;

            return {
                ...node,
                position: {
                    x: layoutedNode.x || 0,
                    y: layoutedNode.y || 0,
                },
            };
        });

        return { nodes: layoutedNodes, edges };
    } catch (error) {
        console.error("ELK layout error:", error);
        return { nodes, edges };
    }
};
