import os
import re

html_dir = 'frontend'
for file in os.listdir(html_dir):
    if file.endswith('.html'):
        path = os.path.join(html_dir, file)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace <div class="logo"> ... </div> with <a href="index.html" class="logo"> ... </a>
        content = re.sub(
            r'<div class="logo">(.*?)</div>',
            r'<a href="index.html" class="logo" style="text-decoration:none; transition: transform 0.2s ease;">\1</a>',
            content,
            flags=re.DOTALL
        )
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

print("Logo links successfully updated.")
