import ActionNode from './ActionNode';
import ConditionNode from './ConditionNode';
import ConstantNode from './ConstantNode';
import StartNode from './StartNode';
import EndNode from './EndNode';
import BranchNode from './BranchNode';
import JoinNode from './JoinNode';
import GoogleCalendarNode from './GoogleCalendarNode';

export { ActionNode, ConditionNode, ConstantNode, StartNode, EndNode, BranchNode, JoinNode, GoogleCalendarNode };

export const nodeTypes = {
    action: ActionNode,
    condition: ConditionNode,
    constant: ConstantNode,
    start: StartNode,
    end: EndNode,
    branch: BranchNode,
    join: JoinNode,
    googleCalendar: GoogleCalendarNode,
};

export default nodeTypes;
