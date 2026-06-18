#!/usr/bin/env bash
# ============================================================
# AnyLet PR-Agent Review Script
# Runs automated static analysis on recent git changes.
# Called by: Reviewer skill (post-task)
# Usage: bash .agents/scripts/review.sh [optional: base_ref]
# ============================================================

set -euo pipefail

BASE_REF="${1:-HEAD~1}"
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
REPORT_FILE="$PROJECT_ROOT/review-report.md"
CHANGED_FILES=$(git diff "$BASE_REF" --name-only 2>/dev/null || git diff --name-only)

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║       🔍 AnyLet Post-Task Code Review               ║"
echo "╚══════════════════════════════════════════════════════╝"
echo "Base ref: $BASE_REF"
echo "Changed files:"
echo "$CHANGED_FILES" | sed 's/^/  • /'
echo ""

# ── Initialize report ─────────────────────────────────────
cat > "$REPORT_FILE" << HEADER
# 🔍 Post-Task Code Review Report
**Date**: $(date '+%Y-%m-%d %H:%M')
**Base Ref**: \`$BASE_REF\`

## Changed Files
\`\`\`
$CHANGED_FILES
\`\`\`

---
HEADER

ISSUES_FOUND=0
CRITICAL=0
MAJOR=0

# ── SECURITY CHECKS ────────────────────────────────────────
echo "🔒 Running Security Checks..."
echo "" >> "$REPORT_FILE"
echo "## 🔒 Security Findings" >> "$REPORT_FILE"

# Check for hardcoded secrets
SECRET_HITS=$(git diff "$BASE_REF" 2>/dev/null | grep -E '^\+.*(password|secret|api_key|apiKey|private_key|token)\s*=\s*["\x27][^"]{8,}' --include="*.js,*.jsx,*.ts,*.tsx" -i || true)
if [ -n "$SECRET_HITS" ]; then
  echo "  ❌ CRITICAL: Potential hardcoded secret detected"
  echo "- ❌ **CRITICAL**: Potential hardcoded secret or API key in diff" >> "$REPORT_FILE"
  CRITICAL=$((CRITICAL + 1))
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check for dangerouslySetInnerHTML
INNER_HTML=$(git diff "$BASE_REF" 2>/dev/null | grep '^\+.*dangerouslySetInnerHTML' || true)
if [ -n "$INNER_HTML" ]; then
  echo "  ⚠️  MAJOR: dangerouslySetInnerHTML usage added"
  echo "- ⚠️  **MAJOR**: \`dangerouslySetInnerHTML\` added — ensure content is sanitized with DOMPurify" >> "$REPORT_FILE"
  MAJOR=$((MAJOR + 1))
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check for eval()
EVAL_HITS=$(git diff "$BASE_REF" 2>/dev/null | grep '^\+.*\beval(' || true)
if [ -n "$EVAL_HITS" ]; then
  echo "  ❌ CRITICAL: eval() usage detected"
  echo "- ❌ **CRITICAL**: \`eval()\` found — this is a serious security vulnerability" >> "$REPORT_FILE"
  CRITICAL=$((CRITICAL + 1))
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

[ $ISSUES_FOUND -eq 0 ] && echo "- ✅ No security issues detected" >> "$REPORT_FILE"

# ── PERFORMANCE CHECKS ─────────────────────────────────────
echo "⚡ Running Performance Checks..."
echo "" >> "$REPORT_FILE"
echo "## ⚡ Performance Findings" >> "$REPORT_FILE"

PERF_ISSUES=0

# Check for getDocs without limit
NO_LIMIT=$(git diff "$BASE_REF" 2>/dev/null | grep -E '^\+.*getDocs\(collection\(' | grep -v 'limit(' || true)
if [ -n "$NO_LIMIT" ]; then
  echo "  ⚠️  MAJOR: getDocs() call without limit() detected"
  echo "- ⚠️  **MAJOR**: \`getDocs()\` used without \`limit()\` — could fetch unbounded data" >> "$REPORT_FILE"
  MAJOR=$((MAJOR + 1))
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
  PERF_ISSUES=$((PERF_ISSUES + 1))
fi

# Check for onSnapshot without cleanup reference
SNAPSHOT_NO_CLEANUP=$(git diff "$BASE_REF" 2>/dev/null | grep -E '^\+.*onSnapshot\(' || true)
if [ -n "$SNAPSHOT_NO_CLEANUP" ]; then
  # Check if return is nearby (heuristic)
  CLEANUP=$(git diff "$BASE_REF" 2>/dev/null | grep -E '^\+.*return\s+unsubscribe|return\s+\(\)\s*=>' || true)
  if [ -z "$CLEANUP" ]; then
    echo "  ⚠️  MAJOR: onSnapshot() without visible cleanup — check useEffect return"
    echo "- ⚠️  **MAJOR**: \`onSnapshot()\` added — verify the unsubscribe function is returned from \`useEffect\`" >> "$REPORT_FILE"
    MAJOR=$((MAJOR + 1))
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    PERF_ISSUES=$((PERF_ISSUES + 1))
  fi
fi

# Check for mousemove listeners
MOUSEMOVE=$(git diff "$BASE_REF" 2>/dev/null | grep '^\+.*addEventListener.*mousemove\|onMouseMove' || true)
if [ -n "$MOUSEMOVE" ]; then
  echo "  ⚠️  MODERATE: mousemove listener added — verify GPU perf impact"
  echo "- ⚠️  **Moderate**: \`mousemove\` listener detected — ensure it targets small elements only; prefer \`whileHover\` for Framer Motion cards" >> "$REPORT_FILE"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
  PERF_ISSUES=$((PERF_ISSUES + 1))
fi

[ $PERF_ISSUES -eq 0 ] && echo "- ✅ No performance issues detected" >> "$REPORT_FILE"

# ── CODE QUALITY CHECKS ────────────────────────────────────
echo "🧹 Running Code Quality Checks..."
echo "" >> "$REPORT_FILE"
echo "## 🧹 Code Quality Findings" >> "$REPORT_FILE"

QUALITY_ISSUES=0

# Check for console.log in production files
CONSOLE_LOGS=$(git diff "$BASE_REF" 2>/dev/null | grep -E '^\+.*console\.(log|warn|error)\(' | grep -v '//.*console' || true)
if [ -n "$CONSOLE_LOGS" ]; then
  COUNT=$(echo "$CONSOLE_LOGS" | wc -l | tr -d ' ')
  echo "  ℹ️  Minor: $COUNT console.log statement(s) found"
  echo "- ℹ️  **Minor**: $COUNT \`console.log/warn/error\` statement(s) added — remove before production" >> "$REPORT_FILE"
  QUALITY_ISSUES=$((QUALITY_ISSUES + 1))
fi

# Check for TODO/FIXME
TODOS=$(git diff "$BASE_REF" 2>/dev/null | grep -E '^\+.*(TODO|FIXME|HACK|XXX):' || true)
if [ -n "$TODOS" ]; then
  COUNT=$(echo "$TODOS" | wc -l | tr -d ' ')
  echo "  ℹ️  Minor: $COUNT TODO/FIXME comment(s) added"
  echo "- ℹ️  **Minor**: $COUNT \`TODO/FIXME\` comment(s) left in code" >> "$REPORT_FILE"
  QUALITY_ISSUES=$((QUALITY_ISSUES + 1))
fi

[ $QUALITY_ISSUES -eq 0 ] && echo "- ✅ No code quality issues detected" >> "$REPORT_FILE"

# ── FRAMER MOTION CHECKS ───────────────────────────────────
FM_CHANGED=$(echo "$CHANGED_FILES" | grep -E '\.(jsx|tsx)$' || true)
if [ -n "$FM_CHANGED" ]; then
  echo "🎨 Running Framer Motion Checks..."
  echo "" >> "$REPORT_FILE"
  echo "## 🎨 Framer Motion Findings" >> "$REPORT_FILE"
  FM_ISSUES=0

  # Check for inline animation objects
  INLINE_ANIM=$(git diff "$BASE_REF" 2>/dev/null | grep -E '^\+.*<motion\.[a-z]+ .*initial=\{\{|animate=\{\{' || true)
  if [ -n "$INLINE_ANIM" ]; then
    echo "  ⚠️  MODERATE: Inline animation objects detected (should use Variants)"
    echo "- ⚠️  **Moderate**: Inline animation objects \`{{ }}\` found in JSX — decouple into named \`Variants\` objects" >> "$REPORT_FILE"
    FM_ISSUES=$((FM_ISSUES + 1))
  fi

  [ $FM_ISSUES -eq 0 ] && echo "- ✅ No Framer Motion issues detected" >> "$REPORT_FILE"
fi

# ── SUMMARY ────────────────────────────────────────────────
echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## 📊 Summary" >> "$REPORT_FILE"

if [ $CRITICAL -gt 0 ]; then
  RISK="🔴 Critical"
elif [ $MAJOR -gt 0 ]; then
  RISK="🟠 Major"
elif [ $ISSUES_FOUND -gt 0 ]; then
  RISK="🟡 Moderate"
else
  RISK="🟢 Clean"
fi

echo "| Category | Count |" >> "$REPORT_FILE"
echo "|----------|-------|" >> "$REPORT_FILE"
echo "| 🔴 Critical | $CRITICAL |" >> "$REPORT_FILE"
echo "| 🟠 Major | $MAJOR |" >> "$REPORT_FILE"
echo "| Total Issues | $ISSUES_FOUND |" >> "$REPORT_FILE"
echo "| **Risk Level** | **$RISK** |" >> "$REPORT_FILE"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Review complete. Risk Level: $RISK"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Full report saved to: $REPORT_FILE"

# Exit with error code if critical issues found
[ $CRITICAL -gt 0 ] && exit 1 || exit 0
