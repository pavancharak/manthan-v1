import { computeProofHash, signPayload } from "./signing";

export function signDecision(params: {
  decision_input: any;
  signals: any;
  rule_snapshot: any;
  allowed_actions: string[];
  decision: string;
}) {
  const proof_hash = computeProofHash({
    decision_input: params.decision_input,
    signals: params.signals,
    rule_snapshot: params.rule_snapshot,
    allowed_actions: params.allowed_actions,
    decision: params.decision,
  });

  const signature = signPayload({
    decision_input: params.decision_input,
    signals: params.signals,
    rule_snapshot: params.rule_snapshot,
    allowed_actions: params.allowed_actions,
    decision: params.decision,
    proof_hash,
  });

  return { proof_hash, signature };
}