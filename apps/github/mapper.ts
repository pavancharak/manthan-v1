export function mapGitHubSignalsToDecisionInput(signals: any) {
  return {
    isApproved: signals.isApproved,
    hasNewCommitsAfterApproval: false, // extend later
  };
}