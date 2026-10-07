// Where the web app forwards /api/* (see next.config.js). Plain JS because next.config.js loads it.

// Vercel names branch deployments <project>-git-<branch>-<scope>.vercel.app and shortens
// hostnames past 63 characters in a way we can't predict, so long branches use production
const VERCEL_SCOPE = "elisabeth-nnamanis-projects";
const API_PROJECT = "finsight-api";
const MAX_LABEL = 63;

/**
 * API_ORIGIN when set (local, production); on a preview, the API preview built from the same branch.
 * @param {Record<string, string | undefined>} env
 */
function apiOrigin(env = process.env) {
  if (env.API_ORIGIN) return env.API_ORIGIN;
  const branch = env.VERCEL_GIT_COMMIT_REF;
  if (env.VERCEL_ENV === "preview" && branch) {
    const slug = branch.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const label = `${API_PROJECT}-git-${slug}-${VERCEL_SCOPE}`;
    if (label.length <= MAX_LABEL) return `https://${label}.vercel.app`;
  }
  return env.API_PRODUCTION_ORIGIN ?? "http://localhost:8000";
}

module.exports = { apiOrigin };
