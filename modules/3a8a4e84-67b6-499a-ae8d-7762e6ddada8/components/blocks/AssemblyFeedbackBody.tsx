import type { AssemblyFeedback } from '../../domain/assemblyFeedback';
import './AssemblyFeedbackBody.css';
export function AssemblyFeedbackBody({ feedback }: {
    feedback: AssemblyFeedback;
}) {
    return <div className="tr-assembly-feedback-body">
    <p className="tr-assembly-feedback-needed"><span className="tr-assembly-feedback-warning" aria-hidden="true">!</span>此处需要<mark>{feedback.neededAction}</mark>。</p>
    <p className="tr-assembly-feedback-actual">{feedback.actualAction}。</p>
  </div>;
}
