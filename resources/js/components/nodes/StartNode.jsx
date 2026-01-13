import CustomNode from "./CustomNode";

const StartNode = ({ data, selected, id }) => {
    return (
        <CustomNode
            id={id}
            data={{ ...data, label: data.label || "Start" }}
            selected={selected}
            nodeType="start"
            showInput={false}
            showOutput={true}
        />
    );
};

export default StartNode;
