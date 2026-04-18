export interface Suggestion {
  type: "coverage" | "shadow" | "conflict" | "optimization";
  message: string;
}

export function generateSuggestions(params: {
  warnings?: string[];
  escalateCases?: { reason: string; details?: any }[];
}): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const seen = new Set<string>(); // avoid duplicates

  // ✅ From compiler warnings
  if (params.warnings) {
    for (const warning of params.warnings) {
      if (warning.includes("shadowed")) {
        if (!seen.has(warning)) {
          suggestions.push({
            type: "shadow",
            message: warning,
          });
          seen.add(warning);
        }
      }

      if (warning.includes("No rule covers")) {
        if (!seen.has(warning)) {
          suggestions.push({
            type: "coverage",
            message: warning,
          });
          seen.add(warning);
        }
      }
    }
  }

  // ✅ From simulation ESCALATE (HIGH VALUE)
  if (params.escalateCases) {
    for (const esc of params.escalateCases) {
      // 🔥 Detect missing input fields (most important)
      if (esc.reason === "incomplete_input") {
        const missing = esc.details?.missing_fields || [];

        for (const field of missing) {
          const msg = `Input missing for required field '${field}' → ensure upstream system provides it`;

          if (!seen.has(msg)) {
            suggestions.push({
              type: "coverage",
              message: msg,
            });
            seen.add(msg);
          }
        }
      } else {
        // fallback generic ESCALATE insight
        const msg = `ESCALATE detected: ${esc.reason}`;

        if (!seen.has(msg)) {
          suggestions.push({
            type: "coverage",
            message: msg,
          });
          seen.add(msg);
        }
      }
    }
  }

  return suggestions;
}