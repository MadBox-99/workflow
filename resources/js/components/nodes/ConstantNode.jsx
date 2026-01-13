import CustomNode from "./CustomNode";
import { useDarkMode } from "@/hooks/useDarkMode";

const ConstantNode = ({ data, selected, id }) => {
    const isDark = useDarkMode();

    // Display the constant value
    const displayValue =
        data.config?.value !== undefined
            ? String(data.config.value).substring(0, 30) +
              (String(data.config.value).length > 30 ? "..." : "")
            : "No value set";

    return (
        <CustomNode
            id={id}
            data={data}
            selected={selected}
            nodeType="constant"
            showInput={false}
            showOutput={true}
        >
            <div
                style={{
                    marginTop: "8px",
                    padding: "8px 10px",
                    background: isDark ? "#374151" : "#f3f4f6",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontFamily: "ui-monospace, monospace",
                    color: isDark ? "#e9d5ff" : "#7e22ce",
                    wordBreak: "break-all",
                }}
            >
                {displayValue}
            </div>
        </CustomNode>
    );
};

export default ConstantNode;
