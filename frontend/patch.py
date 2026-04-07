import codecs

filepath = r'c:\Users\lenovo\OneDrive\Desktop\Projects\Proton_SMS\frontend\src\app\admin\students\page.tsx'

with codecs.open(filepath, 'r', 'utf-8') as f:
    text = f.read()

start_idx = text.find('<style dangerouslySetInnerHTML')
if start_idx != -1:
    end_idx = text.find('`}} />', start_idx) + 6
    style_str = text[start_idx:end_idx]
    
    # remove from inside
    text = text[:start_idx] + "{INLINE_STYLES}" + text[end_idx:]
    
    # insert at top
    export_stmt = 'export default function StudentsPage() {'
    top_str = f"const INLINE_STYLES = (\n    {style_str}\n);\n\n{export_stmt}"
    text = text.replace(export_stmt, top_str)
    
    with codecs.open(filepath, 'w', 'utf-8') as f:
        f.write(text)
    print("CSS extracted successfully")
else:
    print("Could not find style block")
