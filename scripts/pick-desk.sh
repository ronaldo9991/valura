#!/usr/bin/env bash
# Interactive desk picker — run from repo root: pnpm desk  OR  bash scripts/pick-desk.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT_UI="${PORT_UI:-5173}"
BASE="${DESK_BASE_URL:-http://localhost:${PORT_UI}}"

echo ""
echo "Valura desk picker"
echo "  UI base: ${BASE}"
echo "  (Start dev servers first: API on 8080, UI on ${PORT_UI})"
echo ""

PS3="Enter number: "
options=(
  "Pathfinder — outlook + scenario lab + Coach AI chat"
  "Pathfinder — AI Co-Investor chat only (full-width)"
  "Dashboard — portfolio command + AI sidebar (AI Co-Investor)"
  "Chronos — time-travel sandbox"
  "Print URLs only (no browser)"
  "Quit"
)

select _ in "${options[@]}"; do
  case ${REPLY:-} in
    1) url="${BASE}/pathfinder?desk=pathfinder" ;;
    2) url="${BASE}/pathfinder?desk=co-investor" ;;
    3) url="${BASE}/dashboard" ;;
    4) url="${BASE}/chronos" ;;
    5)
      echo ""
      echo "  Pathfinder (full):     ${BASE}/pathfinder?desk=pathfinder"
      echo "  Pathfinder (AI only):  ${BASE}/pathfinder?desk=co-investor"
      echo "  Dashboard:             ${BASE}/dashboard"
      echo "  Chronos:               ${BASE}/chronos"
      exit 0
      ;;
    6) echo "Bye."; exit 0 ;;
    *) echo "Invalid choice."; continue ;;
  esac
  break
done

echo ""
echo "Opening: ${url}"
if command -v open >/dev/null 2>&1; then
  open "${url}" || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "${url}" || true
else
  echo "Copy into your browser: ${url}"
fi
