import ActionNode from './ActionNode';
import ConditionNode from './ConditionNode';
import ConstantNode from './ConstantNode';
import StartNode from './StartNode';
import EndNode from './EndNode';
import BranchNode from './BranchNode';
import JoinNode from './JoinNode';
import MergeNode from './MergeNode';
import GoogleCalendarNode from './GoogleCalendarNode';
import GoogleDocsNode from './GoogleDocsNode';
import TemplateNode from './TemplateNode';

export { ActionNode, ConditionNode, ConstantNode, StartNode, EndNode, BranchNode, JoinNode, MergeNode, GoogleCalendarNode, GoogleDocsNode, TemplateNode };

export const nodeTypes = {
    action: ActionNode,
    condition: ConditionNode,
    constant: ConstantNode,
    start: StartNode,
    end: EndNode,
    branch: BranchNode,
    join: JoinNode,
    merge: MergeNode,
    googleCalendar: GoogleCalendarNode,
    googleDocs: GoogleDocsNode,
    template: TemplateNode,
};

export default nodeTypes;
