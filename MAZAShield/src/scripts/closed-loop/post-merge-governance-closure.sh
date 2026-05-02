#!/usr/bin/env bash
# MAZALab — post-merge closure (Bash). Same contract as .ps1.
# export MERGED_PR_URL="https://github.com/ORG/REPO/pull/NNN"
# bash scripts/closed-loop/post-merge-governance-closure.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
if [ -z "${MERGED_PR_URL:-}" ]; then
  echo "Set MERGED_PR_URL to the merged PR URL" >&2
  exit 1
fi
PR_URL="${MERGED_PR_URL}"
for p in \
  "docs/qmsr-iso13485/records/rvtm/rvtm-light-v1.1.md" \
  "docs/qmsr-iso13485/records/validation/README.md" \
  "docs/qmsr-iso13485/records/validation/oq/OQ-GOV-SUP-001.md"; do
  if [ -f "$p" ] && grep -q "TBD_PR_URL" "$p" 2>/dev/null; then
    if sed --version 2>&1 | grep -q GNU; then sed -i "s|TBD_PR_URL|${PR_URL//|/\\|}|g" "$p"
    else sed -i.bak "s|TBD_PR_URL|${PR_URL//|/\\|}|g" "$p" && rm -f "${p}.bak"
    fi
    echo "Replaced TBD_PR_URL: $p"
  fi
done
echo ""
echo "== npm run typecheck; npm test (OQ-GOV-SUP-001 evidence) =="
npm run typecheck
npm test
SHA="$(git rev-parse HEAD)"
OQ="docs/qmsr-iso13485/records/validation/oq/OQ-GOV-SUP-001.md"
if [ -f "$OQ" ] && grep -q "__MERGE_SHA_MAIN__" "$OQ"; then
  if sed --version 2>&1 | grep -q GNU; then sed -i "s|__MERGE_SHA_MAIN__|${SHA}|g" "$OQ"
  else sed -i.bak "s|__MERGE_SHA_MAIN__|${SHA}|g" "$OQ" && rm -f "${OQ}.bak"
  fi
  echo "OQ: __MERGE_SHA_MAIN__ -> ${SHA}"
fi
PC="docs/PROJECT_CONTEXT.md"
if [ -f "$PC" ] && grep -q 'PENDING_V11_0_OP_CLOSE' "$PC"; then
  export POST_MERGE_SHA="${SHA}"
  node <<'NODE'
const fs = require("fs");
const p = "docs/PROJECT_CONTEXT.md";
const pr = process.env.MERGED_PR_URL;
const sha = process.env.POST_MERGE_SHA;
const rel =
  `**v1.1.0 released** on \`main\` — PR: ${pr} — merge commit \`${sha}\` — OQ-GOV-SUP-001 (npm typecheck + npm test Pass). Regulatory: [DP-2026-GOV-001 v1.1](qmsr-iso13485/records/design-plans/DP-2026-GOV-001.md), [DR-2026-GOV-001-001](qmsr-iso13485/records/design-reviews/DR-2026-GOV-001-001.md), [RVTM v1.1](qmsr-iso13485/records/rvtm/rvtm-light-v1.1.md); [SOP-001 §12](qmsr-iso13485/sop-design-and-development.md#12-design-changes--change-control-integración-con-audit-trail-y-re-validation); [RELEASE-2026-Q2-v1.0](qmsr-iso13485/records/releases/RELEASE-2026-Q2-v1.0.md); [Management Sign-off Q2 2026](qmsr-iso13485/records/management-signoff-q2-2026.md).`;
const before = fs.readFileSync(p, "utf8");
const after = before.replace("`PENDING_V11_0_OP_CLOSE`", rel);
if (after === before) {
  console.error("PROJECT_CONTEXT: token `PENDING_V11_0_OP_CLOSE` not replaced");
  process.exit(1);
}
fs.writeFileSync(p, after);
console.log("PROJECT_CONTEXT: v1.1.0 released line applied.");
NODE
  unset POST_MERGE_SHA
fi
git add \
  docs/qmsr-iso13485/records/rvtm/rvtm-light-v1.1.md \
  docs/qmsr-iso13485/records/validation/README.md \
  docs/qmsr-iso13485/records/validation/oq/OQ-GOV-SUP-001.md \
  docs/PROJECT_CONTEXT.md
if git diff --cached --quiet; then
  echo "No staged changes to commit."
  exit 1
fi
git commit -m "docs(qmsr): post-merge v1.1.0 -- RVTM, OQ-GOV-SUP-001, PROJECT_CONTEXT; PR ${PR_URL}; SHA ${SHA}" \
  -m "SOP-001 12. DP-2026-GOV-001 v1.1. DR-2026-GOV-001-001. RVTM v1.1. OQ-GOV-SUP-001. Baseline RELEASE-2026-Q2-v1.0. Management Sign-off Q2 2026."
echo "Done. See docs/qmsr-iso13485/records/change-control/TAG-v1.1.0.md — then: git tag -a v1.1.0 ... && git push origin main && git push origin v1.1.0"
