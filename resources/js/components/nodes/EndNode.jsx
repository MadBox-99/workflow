import CustomNode from "./CustomNode";

const EndNode = ({ data, selected, id }) => {
    return (
        <CustomNode
            id={id}
            data={{ ...data, label: data.label || "End" }}
            selected={selected}
            nodeType="end"
            showInput={true}
            showOutput={false}
        />
    );
};

export default EndNode;
