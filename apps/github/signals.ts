import fetch from "node-fetch";

export async function extractGitHubSignals(params: {
  repo: string;
  prNumber: number;
  token: string;
}) {
  const { repo, prNumber, token } = params;

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // 🔹 Reviews → approval signal
  const reviews = await fetch(
    `https://api.github.com/repos/${repo}/pulls/${prNumber}/reviews`,
    { headers }
  ).then((r) => r.json());

  const isApproved = reviews.some((r: any) => r.state === "APPROVED");

  // 🔹 Files → critical path signal
  const files = await fetch(
    `https://api.github.com/repos/${repo}/pulls/${prNumber}/files`,
    { headers }
  ).then((r) => r.json());

  const touchesCriticalPath = files.some((f: any) =>
    f.filename.includes("billing")
  );

  return {
    isApproved,
    touchesCriticalPath,
    fileCount: files.length,
  };
}