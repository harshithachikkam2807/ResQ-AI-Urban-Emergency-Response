import os

html_dir = 'frontend'
bg_html = """<div class="ambient-bg">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
    </div>"""

for file in os.listdir(html_dir):
    if file.endswith('.html'):
        path = os.path.join(html_dir, file)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = content.replace('<div class="ambient-bg"></div>', bg_html)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

print("Blobs updated successfully.")
