// js/report.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reportForm');
    const locationBtn = document.getElementById('getLocationBtn');
    const locationInput = document.getElementById('locationStr');
    const latInput = document.getElementById('lat');
    const lngInput = document.getElementById('lng');
    const gpsStatus = document.getElementById('gpsStatus');
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const formStatus = document.getElementById('formStatus');

    locationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            gpsStatus.innerText = "Locating...";
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    latInput.value = position.coords.latitude;
                    lngInput.value = position.coords.longitude;
                    locationInput.value = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
                    gpsStatus.innerText = "Location captured.";
                    gpsStatus.style.color = "green";
                },
                (error) => {
                    gpsStatus.innerText = "Location access denied or unavailable.";
                    gpsStatus.style.color = "red";
                }
            );
        } else {
            gpsStatus.innerText = "Geolocation not supported by browser.";
        }
    });

    imageUpload.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const reportData = {
            type: document.getElementById('emergencyType').value,
            description: document.getElementById('description').value,
            location: locationInput.value,
            lat: latInput.value,
            lng: lngInput.value,
            peopleAffected: document.getElementById('peopleAffected').value || "Unknown",
            hasImage: imageUpload.files.length > 0
        };

        // Save temporarily for analysis page
        sessionStorage.setItem('currentReport', JSON.stringify(reportData));
        window.location.href = 'analysis.html';
    });

    document.getElementById('openAssistantBtn').addEventListener('click', () => {
        alert("Demo AI Assistant: Please provide details like 'What happened?', 'Where?', and 'How many people?'.");
    });
});
