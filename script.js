"use strict";

const CONTACTS_KEY = "shesafe_trusted_contacts";
const MAX_CONTACTS = 5;

const contactForm = document.getElementById("contactForm");
const contactName = document.getElementById("contactName");
const contactPhone = document.getElementById("contactPhone");
const contactList = document.getElementById("contactList");
const contactStatus = document.getElementById("contactStatus");

function loadContacts() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONTACTS_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter(item =>
          item &&
          typeof item.name === "string" &&
          typeof item.phone === "string"
        ).slice(0, MAX_CONTACTS)
      : [];
  } catch (error) {
    return [];
  }
}

let contacts = loadContacts();

function saveContacts() {
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
    return true;
  } catch (error) {
    contactStatus.textContent =
      "Could not save contacts. Check your browser storage settings.";
    return false;
  }
}

function makeButton(label, className, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

function renderContacts() {
  contactList.replaceChildren();

  if (contacts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "status";
    empty.textContent = "No trusted contacts added yet.";
    contactList.appendChild(empty);
    return;
  }

  contacts.forEach((contact, index) => {
    const item = document.createElement("article");
    item.className = "contact-item";

    const avatar = document.createElement("div");
    avatar.className = "contact-avatar";
    avatar.textContent = contact.name.trim().charAt(0).toUpperCase() || "?";

    const info = document.createElement("div");
    info.className = "contact-info";

    const name = document.createElement("strong");
    name.textContent = contact.name;

    const phone = document.createElement("span");
    phone.textContent = contact.phone;

    info.append(name, phone);

    const actions = document.createElement("div");
    actions.className = "contact-actions";

    const callButton = makeButton("Call", "small-button", () => {
      window.location.href = "tel:" + contact.phone.replace(/[^\d+]/g, "");
    });

    const smsButton = makeButton("SMS", "small-button", () => {
      const message = "I may need help. Please contact me as soon as possible.";
      const url = "sms:" + contact.phone.replace(/[^\d+]/g, "") +
        "?body=" + encodeURIComponent(message);
      window.location.href = url;
    });

    const deleteButton = makeButton("Remove", "small-button delete-button", () => {
      contacts.splice(index, 1);
      if (saveContacts()) {
        renderContacts();
        contactStatus.textContent = "Contact removed.";
      }
    });

    actions.append(callButton, smsButton, deleteButton);
    item.append(avatar, info, actions);
    contactList.appendChild(item);
  });
}

contactForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = contactName.value.trim();
  const phone = contactPhone.value.trim();

  if (!name || !phone) {
    contactStatus.textContent = "Please enter a name and phone number.";
    return;
  }

  // Accept common international phone-number formats.
  if (!/^\+?[\d\s().-]{7,20}$/.test(phone)) {
    contactStatus.textContent = "Please enter a valid phone number.";
    return;
  }

  if (contacts.length >= MAX_CONTACTS) {
    contactStatus.textContent =
      "You can save up to five trusted contacts. Remove one to add another.";
    return;
  }

  contacts.push({ name, phone });

  if (saveContacts()) {
    renderContacts();
    contactForm.reset();
    contactStatus.textContent = "Trusted contact saved in this browser.";
  } else {
    contacts.pop();
  }
});

// Prepare an SMS for the first saved trusted contact.
// Your messaging app must still be opened and the message sent by you.
document.getElementById("prepareMessage").addEventListener("click", () => {
  const status = document.getElementById("messageStatus");
  const message = document.getElementById("safetyMessage").value.trim();

  if (!message) {
    status.textContent = "Please enter a message first.";
    return;
  }

  if (contacts.length === 0) {
    status.textContent =
      "Add a trusted contact first, then you can prepare an SMS.";
    return;
  }

  const phone = contacts[0].phone.replace(/[^\d+]/g, "");
  const smsUrl = "sms:" + phone + "?body=" + encodeURIComponent(message);

  status.textContent =
    "Opening your messaging app for " + contacts[0].name +
    ". Review the message and send it yourself.";

  window.location.href = smsUrl;
});

// Request the current location only after the user presses the button.
document.getElementById("getLocation").addEventListener("click", () => {
  const status = document.getElementById("locationStatus");
  const mapLink = document.getElementById("mapLink");

  mapLink.hidden = true;

  if (!("geolocation" in navigator)) {
    status.textContent = "This browser does not support location access.";
    return;
  }

  status.textContent = "Requesting location permission…";

  navigator.geolocation.getCurrentPosition(
    position => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      const mapUrl =
        "https://www.google.com/maps?q=" +
        encodeURIComponent(latitude + "," + longitude);

      mapLink.href = mapUrl;
      mapLink.hidden = false;

      status.textContent =
        "Location found. Latitude: " + latitude.toFixed(5) +
        ", longitude: " + longitude.toFixed(5) +
        ". Use the map link if you want to view or share it.";
    },
    error => {
      const messages = {
        1: "Location permission was denied. Allow location access in your browser settings and try again.",
        2: "Your location is currently unavailable. Check your device location settings and try again.",
        3: "The location request timed out. Please try again."
      };

      status.textContent =
        messages[error.code] || "Could not get your location. Please try again.";
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
});

renderContacts();