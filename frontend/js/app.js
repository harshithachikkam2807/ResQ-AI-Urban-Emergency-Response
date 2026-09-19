// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    const demoToggle = document.getElementById('demoModeToggle');
    if (demoToggle) {
        demoToggle.checked = isDemoMode();
        demoToggle.addEventListener('change', (e) => {
            setDemoMode(e.target.checked);
            alert("Demo Mode set to: " + e.target.checked);
        });
    }
});
