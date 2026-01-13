import CustomNode from "./CustomNode";

const ActionNode = ({ data, selected, id }) => {
    const nodeType = data.type || "apiAction";

    return (
        <CustomNode
            id={id}
            data={data}
            selected={selected}
            nodeType={nodeType}
            showInput={true}
            showOutput={true}
        />
    );
};

export default ActionNode;
