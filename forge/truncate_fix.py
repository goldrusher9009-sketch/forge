import sys
path = r'C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-web-studio\app\components\ForgeApp.tsx'
with open(path, encoding='utf-8-sig') as f:
    lines = f.readlines()
sentinel = next(i for i, l in enumerate(lines) if '// SENTINEL_END' in l)
print(f'sentinel at line {sentinel+1}')
out = lines[:sentinel]
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(out)
print(f'done, total lines: {len(out)}')
