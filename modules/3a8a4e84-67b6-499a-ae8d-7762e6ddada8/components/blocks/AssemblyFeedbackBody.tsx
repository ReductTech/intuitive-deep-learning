import type { AssemblyFeedback } from '../../domain/assemblyFeedback';
import './AssemblyFeedbackBody.css';
export function AssemblyFeedbackBody({ feedback }: {
    feedback: AssemblyFeedback;
}) {
    return <div shuku-edit-id="e-2c6b37a4-1170-4957-a5d8-1a4e218aa24c" className="tr-assembly-feedback-body">
    <p shuku-edit-id="e-a0c48642-dd07-4be8-9074-198ee04526b0" className="tr-assembly-feedback-needed"><span shuku-edit-id="e-8c90d037-5297-408d-b8e3-eed9a3a63440" className="tr-assembly-feedback-warning" aria-hidden="true">!</span>此处需要<mark shuku-edit-id="e-1fbefea5-1079-472b-abd9-bd520ed8f0e8">{feedback.neededAction}</mark>。</p>
    <p shuku-edit-id="e-da13ac3d-bdf4-4f15-8691-415dab9fed7f" className="tr-assembly-feedback-actual">{feedback.actualAction}。</p>
  </div>;
}
