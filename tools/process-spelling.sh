#!/bin/bash

# Extract misspellings with file information from the spellcheck output
# Format: filename | line | column | word

input_file="spellcheck-output.txt"

# Create a formatted output with file and misspelling info
tmp_file=$(mktemp)

# Extract lines that contain file information (format from pyspelling)
# Lines starting with ':' contain file info, lines starting with '>' show context
grep -E '^\.' "$input_file" | while read line; do
  echo "$line"
done > "$tmp_file"

# If no '.' format found, try extracting from context lines
if [ ! -s "$tmp_file" ]; then
  grep -E '^[^[:space:]]' "$input_file" | head -n 100 > "$tmp_file"
fi

# Move the formatted output back
mv "$tmp_file" "$input_file"

echo "Spelling issues with file information:"
cat "$input_file"
