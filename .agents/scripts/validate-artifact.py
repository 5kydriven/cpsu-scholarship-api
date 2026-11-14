#!/usr/bin/env python3
"""
Deterministic Artifact Schema Validator

Validates handoff markdown artifacts against defined schema headers and verdicts.
Zero external dependencies. Fast local CPU execution (0 LLM tokens).

Usage:
  python .agents/scripts/validate-artifact.py --file=.agent-work/TASK-123/ARCHITECTURE_PLAN.md --type=architecture
"""

import argparse
import os
import re
import sys

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding='utf-8')
    except (AttributeError, ValueError):
        pass

MI = re.MULTILINE | re.IGNORECASE

SCHEMAS = {
    'task_context': {
        'required_headers': [
            (re.compile(r'^##\s+(?:\d+\.\s+)?Feature', MI), '## Feature (or ## 1. Feature Scope)'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?(?:Business Goal|Feature Scope & Business Goal)', MI), '## Business Goal'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?Actors', MI), '## Actors & Permissions'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?(?:Requirements|Core Requirements)', MI), '## Requirements'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?Constraints', MI), '## Constraints'),
        ],
        'required_patterns': [
            (re.compile(r'TASK_ID', re.IGNORECASE), 'TASK_ID declaration'),
        ],
    },
    'architecture': {
        'required_headers': [
            (re.compile(r'^##\s+(?:\d+\.\s+)?Architecture', MI), '## Architecture Summary'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?Reused', MI), '## Reused Components'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?(?:Database|Schema|Data Model)', MI), '## Database Schema Changes'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?(?:Security|Tenancy)', MI), '## Security & Tenancy'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?QA Risk', MI), '## QA Risk Matrix'),
        ],
        'required_patterns': [
            (re.compile(r'TASK-[0-9]{3}'), 'At least one task ID (e.g. TASK-001)'),
        ],
    },
    'implementation_plan': {
        'required_headers': [
            (re.compile(r'^##\s+(?:\d+\.\s+)?Implementation Summary', MI), '## Implementation Summary'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?Files to Create', MI), '## Files to Create'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?Files to Modify', MI), '## Files to Modify'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?Implementation Order', MI), '## Implementation Order'),
        ],
        'required_patterns': [],
    },
    'code_review': {
        'required_headers': [
            (re.compile(r'^##\s+(?:\d+\.\s+)?(?:Overall Status|CODE_REVIEW_STATUS)', MI), '## Overall Status'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?Findings', MI), '## Findings'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?Architecture Compliance', MI), '## Architecture Compliance'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?(?:Mermaid Diagram|Sequence Diagram)', MI), '## Mermaid Diagram'),
        ],
        'required_patterns': [
            (re.compile(r'(?:CODE_REVIEW_STATUS|Overall Status|Reviewer Verdict):\s*(?:PASS|FAIL)', re.IGNORECASE), 'Explicit PASS/FAIL verdict status'),
        ],
    },
    'qa': {
        'required_headers': [
            (re.compile(r'^##\s+(?:\d+\.\s+)?(?:QA Status|QA_STATUS)', MI), '## QA Status'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?Requirement Validation', MI), '## Requirement Validation'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?Acceptance Criteria', MI), '## Acceptance Criteria'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?Manual Verification Guide', MI), '## Manual Verification Guide'),
        ],
        'required_patterns': [
            (re.compile(r'(?:QA_STATUS|QA Status|Final QA Verdict):\s*(?:PASS|FAIL)', re.IGNORECASE), 'Explicit PASS/FAIL QA status'),
        ],
    },
    'release': {
        'required_headers': [
            (re.compile(r'^##\s+(?:\d+\.\s+)?User Approval', MI), '## User Approval'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?Documentation Updated', MI), '## Documentation Updated'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?MEMORY\.md Updated', MI), '## MEMORY.md Updated'),
            (re.compile(r'^##\s+(?:\d+\.\s+)?Commit', MI), '## Commit'),
        ],
        'required_patterns': [],
    },
}


def main() -> int:
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument('--file')
    parser.add_argument('--type')
    args, _ = parser.parse_known_args()

    file_path = args.file
    type_ = args.type

    if not file_path or not type_:
        sys.stderr.write(
            "❌ Usage: python validate-artifact.py --file=<path> --type=<task_context|architecture|implementation_plan|code_review|qa|release>\n"
        )
        return 1

    if not os.path.exists(file_path):
        sys.stderr.write(f"❌ ERROR: File not found: {file_path}\n")
        return 1

    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except OSError:
        sys.stderr.write(f"❌ ERROR: File is empty: {file_path}\n")
        return 1

    if content is None or content.strip() == '':
        sys.stderr.write(f"❌ ERROR: File is empty: {file_path}\n")
        return 1

    if type_ not in SCHEMAS:
        sys.stderr.write(f"❌ ERROR: Unknown schema type '{type_}'. Supported: {', '.join(SCHEMAS.keys())}\n")
        return 1

    schema = SCHEMAS[type_]
    errors = []

    # 1. Validate mandatory headers using regex
    for pattern, label in schema['required_headers']:
        if not pattern.search(content):
            errors.append(f"Missing mandatory section: '{label}'")

    # 2. Validate mandatory regex patterns
    for pattern, description in schema['required_patterns']:
        if not pattern.search(content):
            errors.append(f"Missing required pattern: {description}")

    # 3. Output results
    if errors:
        sys.stderr.write(f"❌ SCHEMA VALIDATION FAILED for [{type_}] ({file_path}):\n")
        for err in errors:
            sys.stderr.write(f"   • {err}\n")
        return 1

    print(f"✅ Artifact schema [{type_}] verified successfully: {file_path}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
