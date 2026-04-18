export interface PRSignal {
  approvals: number;
  changeRequests: number;
  commitsAfterApproval: number;
}

export interface ClassifiedSignals {
  isApproved: boolean;
  hasNewCommitsAfterApproval: boolean;
}

export function classifyPRSignals(input: PRSignal): ClassifiedSignals {
  return {
    isApproved: input.approvals > 0 && input.changeRequests === 0,
    hasNewCommitsAfterApproval: input.commitsAfterApproval > 0,
  };
}