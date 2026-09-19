// js/navbar.js

class ResQNavbar extends HTMLElement {
    connectedCallback() {
        const statusText = this.getAttribute('status') || 'AI SYSTEM ONLINE';
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';

        const links = [
            { path: 'index.html', label: 'Overview' },
            { path: 'report.html', label: 'Report Emergency' },
            { path: 'dashboard.html', label: 'Command Center' },
            { path: 'responsible-ai.html', label: 'Responsible AI' }
        ];

        const navHtml = links.map(link => {
            // Determine active state intelligently
            let isActive = false;
            if (currentPath === link.path) isActive = true;
            // Aliases for child pages
            if (currentPath === 'incident.html' && link.path === 'dashboard.html') isActive = true;
            if (currentPath === 'analysis.html' && link.path === 'report.html') isActive = true;
            
            return `<a href="${link.path}" class="${isActive ? 'active' : ''}">${link.label}</a>`;
        }).join('');

        this.innerHTML = `
            <header class="header" id="mainHeader">
                <div class="container" style="display:flex; justify-content:space-between; align-items:center; height: 70px;">
                    <a href="index.html" class="logo" style="text-decoration:none; transition: transform 0.2s ease;">
                        <i data-lucide="shield-alert"></i> ResQ-AI
                    </a>
                    <nav class="nav">
                        ${navHtml}
                    </nav>
                    <div class="system-status-indicator">
                        <div class="status-dot"></div>
                        <span>${statusText}</span>
                    </div>
                </div>
            </header>
        `;

        // Wait a tick for lucide icons to be parsed if they haven't been
        if (window.lucide) {
            window.lucide.createIcons({ root: this });
        }

        // Scroll effect
        const header = this.querySelector('#mainHeader');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

customElements.define('resq-navbar', ResQNavbar);
