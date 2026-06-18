#!/usr/bin/env python3
"""
Enterprise Logger Migration Script
Replaces console.log/error/warn with logger calls across all src files.
"""
import os
import re
import sys

SRC = os.path.join(os.path.dirname(__file__), '..', 'src')
SKIP = {'seedDatabase.js', 'logger.js'}

REPLACEMENTS = [
    (r'console\.log\(', 'logger.info('),
    (r'console\.error\(', 'logger.error('),
    (r'console\.warn\(', 'logger.warn('),
]

def get_relative_logger_path(filepath):
    """Calculate correct relative import path for logger."""
    rel = os.path.relpath(SRC + '/utils/logger', os.path.dirname(filepath))
    rel = rel.replace('\\', '/')
    if not rel.startswith('.'):
        rel = './' + rel
    return rel

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Skip if no console calls
    if not re.search(r'console\.(log|error|warn)\(', content):
        return False

    # Replace console calls
    for pattern, replacement in REPLACEMENTS:
        content = re.sub(pattern, replacement, content)

    # Add logger import if not present
    if 'import logger from' not in content:
        logger_path = get_relative_logger_path(filepath)
        # Find position after last import line
        imports = list(re.finditer(r'^import .+;?\s*$', content, re.MULTILINE))
        if imports:
            last_import_end = imports[-1].end()
            content = content[:last_import_end] + f'\nimport logger from \'{logger_path}\';' + content[last_import_end:]
        else:
            content = f"import logger from '{logger_path}';\n" + content

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

count = 0
for root, dirs, files in os.walk(SRC):
    # Skip node_modules
    dirs[:] = [d for d in dirs if d != 'node_modules']
    for fname in files:
        if fname in SKIP:
            continue
        if not (fname.endswith('.jsx') or fname.endswith('.js') or fname.endswith('.ts') or fname.endswith('.tsx')):
            continue
        fpath = os.path.join(root, fname)
        if process_file(fpath):
            print(f'  ✅ {os.path.relpath(fpath, SRC)}')
            count += 1

print(f'\n✨ Migrated {count} files to enterprise logger.')
