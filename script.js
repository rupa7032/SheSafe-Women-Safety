```javascript
"use strict";

let watchId = null;
let currentLocation = null;

const CONTACT_STORAGE_KEY = "shesafe_trusted_contacts";

function showSOS() {
    document.getElementById("sosPanel").hidden = false;
    document.getElementById("sosPanel").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function closeSOS() {
    document.getElementById("sosPanel").hidden = true;
}

function startTracking() {
    const status = document.getElementById("locationStatus");

    if (!("geolocation" in navigator)) {
        status.textContent = "Your browser does not support GPS location.";
        return;
    }

    if (watchId !== null) {
        status.textContent = "GPS tracking is already running.";
        return;
    }

    status.textContent = "Requesting location permission...";

    watchId = navigator.geolocation.watchPosition(
        function (position) {
            currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };

            document.getElementById("latitude").textContent =
                currentLocation.latitude.toFixed(6);

            document.getElementById("longitude").textContent =
                currentLocation.longitude.toFixed(6);

            document.getElementById("accuracy").textContent =
                Math.round(currentLocation.accuracy) + " metres";

            const mapLink = document.getElementById("mapLink");
            mapLink.href =
                "https://www.google.com/maps?q=" +
                currentLocation.latitude + "," +
                currentLocation.longitude;
            mapLink.hidden = false;

            status.textContent =
                "Location updated successfully. Tracking is active.";
        },
        function (error) {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }

            const messages = {
                1: "Location permission was denied. Allow location access in your browser settings.",
                2: "Your location is currently unavailable. Check your device location settings.",
                3: "Location request timed out. Please try again."
            };

            status.textContent =
                messages[error.code] || "Unable to get your location.";
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 15000
        }
    );
}

function stopTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    document.getElementById("locationStatus").textContent =
        "Location tracking is stopped.";
}

function getContacts() {
    try {
        const saved = localStorage.getItem(CONTACT_STORAGE_KEY);
        const contacts = saved ? JSON.parse(saved) : [];
        return Array.isArray(contacts) ? contacts : [];
    } catch (error) {
        return [];
    }
}

function saveContacts(contacts) {
    try {
        localStorage.setItem(
            CONTACT_STORAGE_KEY,
            JSON.stringify(contacts)
        );
        return true;
    } catch (error) {
        document.getElementById("contactStatus").textContent =
            "Unable to save contacts in this browser.";
        return false;
    }
}

function normalizePhone(phone) {
    return phone.replace(/[^\d+]/g, "");
}

function renderContacts() {
    const list = document.getElementById("contactList");
    const contacts = getContacts();

    list.replaceChildren();

    if (contacts.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "No trusted contacts saved yet.";
        list.appendChild(emptyMessage);
        return;
    }

    contacts.forEach(function (contact, index) {
        const item = document.createElement("div");
        item.className = "contact-item";

        const details = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = contact.name;

        const phone = document.createElement("p");
        phone.textContent = contact.phone;

        details.appendChild(name);
        details.appendChild(phone);

        const actions = document.createElement("div");
        actions.className = "contact-actions";

        const callLink = document.createElement("a");
        callLink.href = "tel:" + normalizePhone(contact.phone);
        callLink.textContent = "Call";

        const smsLink = document.createElement("a");
        smsLink.href = "sms:" + normalizePhone(contact.phone);
        smsLink.textContent = "SMS";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Remove";
        deleteButton.addEventListener("click", function () {
            deleteContact(index);
        });

        actions.appendChild(callLink);
        actions.appendChild(smsLink);
        actions.appendChild(deleteButton);

        item.appendChild(details);
        item.appendChild(actions);
        list.appendChild(item);
    });
}

function deleteContact(index) {
    const contacts = getContacts();
    contacts.splice(index, 1);

    if (saveContacts(contacts)) {
        document.getElementById("contactStatus").textContent =
            "Contact removed.";
        renderContacts();
    }
}

document.getElementById("contactForm").addEventListener(
    "submit",
    function (event) {
        event.preventDefault();

        const nameInput = document.getElementById("contactName");
        const phoneInput = document.getElementById("contactPhone");

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();

        if (!name || !phone || !/[0-9]{5,}/.test(phone)) {
            document.getElementById("contactStatus").textContent =
                "Enter a name and a valid phone number.";
            return;
        }

        const contacts = getContacts();

        if (contacts.length >= 5) {
            document.getElementById("contactStatus").textContent =
                "You can save up to five trusted contacts. Remove one first.";
            return;
        }

        contacts.push({
            name: name,
            phone: phone
        });

        if (saveContacts(contacts)) {
            nameInput.value = "";
            phoneInput.value = "";
            document.getElementById("contactStatus").textContent =
                "Trusted contact saved successfully.";
            renderContacts();
        }
    }
);

function prepareEmergencyMessage() {
    const messageElement = document.getElementById("sosMessage");
    const contacts = getContacts();

    let message = "I need help. Please contact me as soon as possible.";

    if (currentLocation) {
        const mapUrl =
            "https://www.google.com/maps?q=" +
            currentLocation.latitude + "," +
            currentLocation.longitude;

        message += " My current location: " + mapUrl;
    } else {
        message += " My location is not available in SheSafe yet.";
    }

    if (contacts.length === 0) {
        messageElement.textContent =
            "No trusted contacts are saved. Save a contact below to prepare an emergency message.";
        return;
    }

    const smsUrl =
        "sms:?body=" + encodeURIComponent(message);

    messageElement.textContent =
        "Your emergency message is ready. Choose a recipient in your messaging app and check the message before sending.";

    const link = document.createElement("a");
    link.href = smsUrl;
    link.textContent = "Open SMS app";
    link.className = "map-link";

    const oldLink = document.getElementById("emergencySmsLink");
    if (oldLink) {
        oldLink.remove();
    }

    link.id = "emergencySmsLink";
    messageElement.appendChild(document.createTextNode(" "));
    messageElement.appendChild(link);
}

renderContacts();
```
