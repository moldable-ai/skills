#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

failed=0

while IFS= read -r -d '' file; do
  [[ -f "$file" ]] || continue

  first_line=""
  IFS= read -r first_line < "$file" || true
  if [[ "$first_line" == '#!'* ]] && [[ ! -x "$file" ]]; then
    echo "missing +x: $file"
    failed=1
  fi
done < <(git ls-files -z)

if [[ "$failed" -ne 0 ]]; then
  echo
  echo "Shebang files must be executable."
  echo "Fix with: chmod +x <file> && git update-index --chmod=+x <file>"
  exit 1
fi

echo "OK: all tracked shebang files are executable."
