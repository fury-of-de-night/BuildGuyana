interface Props {
  isOpen: boolean;
  policyTexts: { privacy: string; cookie: string };
  policyActive: { privacy: boolean; cookie: boolean };
  policyAccepting: boolean;
  onAccept: () => void;
}

export default function PolicyModal({
  isOpen,
  policyTexts,
  policyActive,
  policyAccepting,
  onAccept,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white border border-background-200/70 rounded-lg w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-background-200/70">
          <h2 className="font-heading text-lg text-foreground-900">Updated Policies</h2>
          <p className="text-xs text-foreground-500 mt-0.5">Please review and accept to continue.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {policyActive.privacy && policyTexts.privacy && (
            <div>
              <h3 className="font-heading text-sm font-semibold text-foreground-900 mb-2">Privacy Notice</h3>
              <div className="text-sm text-foreground-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto bg-background-50 p-3 rounded-md border border-background-200/70">
                {policyTexts.privacy}
              </div>
            </div>
          )}
          {policyActive.cookie && policyTexts.cookie && (
            <div>
              <h3 className="font-heading text-sm font-semibold text-foreground-900 mb-2">Cookie Policy</h3>
              <div className="text-sm text-foreground-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto bg-background-50 p-3 rounded-md border border-background-200/70">
                {policyTexts.cookie}
              </div>
            </div>
          )}
          {!policyTexts.privacy && !policyTexts.cookie && (
            <p className="text-sm text-foreground-500 text-center py-4">No policy content is currently available. Click Agree to continue.</p>
          )}
        </div>
        <div className="p-4 border-t border-background-200/70 flex justify-end">
          <button
            onClick={onAccept}
            disabled={policyAccepting}
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            {policyAccepting ? 'Accepting...' : 'Agree'}
          </button>
        </div>
      </div>
    </div>
  );
}