#!/bin/bash
# Simple script to generate excludes list for draft Learning Paths
# Usage: ./tools/generate-spellcheck-excludes.sh > excludes.txt

echo "excludes:"
find content/learning-paths -name "_index.md" -exec grep -l "^draft: true$" {} \; | while read -r file; do
  dir=$(dirname "$file")
  echo "  - '$dir/**/*.md'"
done
