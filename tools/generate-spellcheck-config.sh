#!/bin/bash

# Generate a spell check configuration that excludes draft articles
# This creates a temporary .spellcheck-non-draft.yml file with only non-draft sources

output_config=".spellcheck-non-draft.yml"

# Ensure we're in the repository root
if [ ! -d "content/learning-paths" ]; then
  echo "Error: content/learning-paths directory not found" >&2
  exit 1
fi

echo "Finding draft Learning Paths to exclude..."

# Find all _index.md files that have 'draft: true' and get their directories
draft_dirs=()
while IFS= read -r file; do
  dir=$(dirname "$file")
  draft_dirs+=("$dir")
done < <(find content/learning-paths -type f -name "_index.md" -exec grep -l "^draft: true$" {} \; 2>/dev/null)

# Start building the config file
cat > "$output_config" << 'EOF'
matrix:
- name: Markdown
  expect_match: false
  apsell:
    mode: en
  dictionary:
    wordlists:
    - .wordlist.txt
    output: wordlist.dic
    encoding: utf-8
  pipeline:
  - pyspelling.filters.markdown:
      markdown_extensions:
      - markdown.extensions.extra:
  - pyspelling.filters.html:
      comments: false
      attributes:
      - alt
      ignores:
      - ':matches(code, pre)'
      - 'code'
      - 'pre'
      - 'blockquote'
  sources:
  - 'content/install-guides/**/*.md'
  - 'content/learning-paths/**/*.md'
EOF

# Add exclusions section if draft paths were found
if [ ${#draft_dirs[@]} -gt 0 ]; then
  echo "  excludes:" >> "$output_config"
  for dir in "${draft_dirs[@]}"; do
    echo "  - '$dir/**/*.md'" >> "$output_config"
  done
  
  echo "Excluding ${#draft_dirs[@]} draft Learning Path(s) from spell check"
else
  echo "No draft Learning Paths found, checking all content"
fi

echo "Generated spell check configuration: $output_config"

# Verify the file was created
if [ ! -f "$output_config" ]; then
  echo "Error: Failed to create $output_config" >&2
  exit 1
fi

echo "Config file size: $(wc -c < "$output_config") bytes"
