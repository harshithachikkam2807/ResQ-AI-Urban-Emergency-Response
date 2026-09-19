import os
import re

html_dir = 'frontend'

# 1. Update HTML files
for file in os.listdir(html_dir):
    if file.endswith('.html'):
        path = os.path.join(html_dir, file)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract status text
        match = re.search(r'<div class="system-status-indicator">.*?<span>(.*?)</span>', content, re.DOTALL)
        status_text = match.group(1) if match else "AI SYSTEM ONLINE"
        
        # Remove the <header> tag completely and replace with <resq-navbar>
        content = re.sub(r'<header class="header">.*?</header>', f'<resq-navbar status="{status_text}"></resq-navbar>', content, flags=re.DOTALL)
        
        # Ensure navbar.js is included
        if 'navbar.js' not in content:
            if '<script src="js/storage.js"></script>' in content:
                content = content.replace('<script src="js/storage.js"></script>', '<script src="js/storage.js"></script>\n    <script src="js/navbar.js"></script>')
            elif 'js/storage.js' in content:
                content = content.replace('<script src="../js/storage.js"></script>', '<script src="../js/storage.js"></script>\n    <script src="../js/navbar.js"></script>')
            else:
                # Fallback, just put it before </body>
                content = content.replace('</body>', '    <script src="js/navbar.js"></script>\n</body>')
                
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)


# 2. Update style.css
css_path = 'frontend/css/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css_content = f.read()

new_header_css = '''/* Smart Navigation */
.header {
    position: fixed;
    top: 16px; left: 24px; right: 24px;
    max-width: 1280px;
    margin: 0 auto;
    z-index: 1000;
    background: rgba(10, 10, 15, 0.5);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: var(--transition);
}
.header.scrolled {
    background: rgba(10, 10, 15, 0.85);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    border-color: rgba(255, 255, 255, 0.2);
}'''

css_content = re.sub(r'/\* Smart Navigation \*/.*?\.header \{.*?\}', new_header_css, css_content, flags=re.DOTALL)
css_content = css_content.replace('.main-content { padding-top: 100px;', '.main-content { padding-top: 120px;')

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css_content)

print("Navbar extraction and styling successfully applied.")
