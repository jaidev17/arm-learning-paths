#!/bin/bash

# Generate a spell check configuration that excludes draft articles
# This creates a temporary .spellcheck-non-draft.yml file with only non-draft sources

output_config=".spellcheck-non-draft.yml"

# Find all _index.md files that have 'draft: true' and exclude entire directories
echo "Finding draft Learning Paths to exclude..."
draft_paths=$(find content/learning-paths -type f -name "_index.md" -exec grep -l "^draft: true$" {} \; 2>/dev/null | while read file; do
  # Get the directory of the _index.md file
  dir=$(dirname "$file")
  # Output exclusion pattern for all .md files in that directory
  echo "  - '!${dir}/**/*.md'"
done | sort)

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

# Add exclusions for draft Learning Paths if any were found
if [ -n "$draft_paths" ]; then
  echo "$draft_paths" >> "$output_config"
  draft_count=$(echo "$draft_paths" | wc -l | tr -d ' ')
  echo "Excluding $draft_count draft Learning Path(s) from spell check"
else
  echo "No draft Learning Paths found, checking all content"
fi

echo "Generated spell check configuration: $output_config"
