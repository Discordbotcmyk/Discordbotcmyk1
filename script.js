// --- Data Storage (In-memory for this example) ---
// Initial unit statuses set to the required 10-codes
let policeCalls = [];
let fireCalls = [];
let policeBolos = [];
let policeUnits = { 'P-1': '10-8 Available', 'P-2': '10-8 Available' };
let fireUnits = { 'E-1': '10-8 Available', 'L-1': '10-8 Available' };

let countdownInterval = null;
let messageTimeout = null;
let contextTarget = null; 

const ADMIN_PASSCODE = "Administrator";

// --- Configuration Data ---
const SCRIPTS = {
    paging: `(Page sound) Attention (fire department name). Attention (fire department name) station (number). (Call type) (call description) (responding rigs) (cross streets). (number). (Call type) (call description) (responding rigs) (cross streets) (timeout 24 hour military time).`
};

const FIRE_RIGS = [
    { name: 'Engine (E-X)', criteria: 'Structure Fires, Vehicle Fires, EMS calls, Alarms' },
    { name: 'Ladder (L-X)', criteria: 'Structure Fires (Search/Ventilation), Technical Rescue' },
    { name: 'Rescue (R-X)', criteria: 'MVA with Entrapment, High-Angle Rescue, Water Rescue' },
    { name: 'Battalion (B-X)', criteria: 'Supervisor/Command for all working incidents' }
];

// --- Time and Initial Setup ---
function updateTime() {
    const now = new Date();
    const options = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false, 
        timeZone: 'America/New_York' 
    };
    const militaryTime = now.toLocaleTimeString('en-US', options);
    
    document.getElementById('time-display').textContent = `${militaryTime} EST`;
    
    if (document.getElementById('police-call-time')) {
        document.getElementById('police-call-time').textContent = `Time: ${militaryTime} EST`;
    }
    if (document.getElementById('fire-call-time')) {
        document.getElementById('fire-call-time').textContent = `Time: ${militaryTime} EST`;
    }
}

function initialSetup() {
    setInterval(updateTime, 1000);
    updateTime(); 
    renderFireRigs();
    renderUnits('police');
    renderUnits('fire');
    setupContextMenuListeners();
}

// --- Dashboard Transition Logic ---
function showDashboard(department) {
    const dashboards = document.querySelectorAll('.dashboard');

    let targetId;
    if (department === 'police') targetId = 'police-dashboard';
    else if (department === 'fire') targetId = 'fire-dashboard';
    else if (department === 'admin') targetId = 'admin-dashboard';
    else if (department === 'admin-pass') targetId = 'admin-pass-dashboard';
    else targetId = 'initial-dashboard';
    
    const targetDashboard = document.getElementById(targetId);

    // Fade out
    dashboards.forEach(d => {
        if (!d.classList.contains('hidden')) {
            d.style.opacity = 0;
        }
    });

    // Hide all, then show/fade in target
    setTimeout(() => {
        dashboards.forEach(d => d.classList.add('hidden'));

        if (targetDashboard) {
            targetDashboard.classList.remove('hidden');
            setTimeout(() => {
                targetDashboard.style.opacity = 1;
            }, 50); 
        }
    }, 500); 
}

// --- Administrator Dashboard Logic (unchanged) ---
function checkAdminPasscode() {
    const input = document.getElementById('admin-passcode');
    if (input.value === ADMIN_PASSCODE) {
        showDashboard('admin');
        input.value = ''; 
    } else {
        alert("Incorrect Passcode. Access Denied.");
        input.value = '';
    }
}

function showUpdateMenu() {
    document.getElementById('update-menu-overlay').classList.remove('hidden');
}

function hideUpdateMenu() {
    document.getElementById('update-menu-overlay').classList.add('hidden');
}

function startUpdateCountdown() {
    hideUpdateMenu();
    const version = document.getElementById('update-version').value || 'System';
    const durationMinutes = parseInt(document.getElementById('update-duration').value) || 5;
    
    let timeRemaining = durationMinutes * 60;
    const countdownElement = document.getElementById('update-countdown');

    if (countdownInterval) clearInterval(countdownInterval);

    countdownElement.classList.remove('hidden');
    
    countdownInterval = setInterval(() => {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        
        countdownElement.textContent = `UPDATE: ${version} in T-${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeRemaining <= 0) {
            clearInterval(countdownInterval);
            countdownElement.textContent = `${version} UPDATE IN PROGRESS.`;
        }
        timeRemaining--;
    }, 1000);
}

function showMessageMenu() {
    document.getElementById('message-menu-overlay').classList.remove('hidden');
}

function hideMessageMenu() {
    document.getElementById('message-menu-overlay').classList.add('hidden');
}

function sendMessageBanner() {
    hideMessageMenu();
    const message = document.getElementById('broadcast-message').value;
    const banner = document.getElementById('message-banner');

    if (messageTimeout) clearTimeout(messageTimeout);

    banner.textContent = message;
    banner.classList.remove('hidden');

    // Display for 24 hours (86,400,000 milliseconds)
    messageTimeout = setTimeout(() => {
        banner.classList.add('hidden');
    }, 86400000);

    document.getElementById('broadcast-message').value = '';
}

// --- Clear All Functionality (unchanged) ---
function clearAll(department) {
    if (!confirm(`Are you sure you want to CLEAR ALL data (Calls/Units${department === 'police' ? '/Bolos' : ''}) for ${department.toUpperCase()}?`)) {
        return;
    }

    if (department === 'police') {
        policeCalls = [];
        policeBolos = [];
        // Reset units to default
        policeUnits = { 'P-1': '10-8 Available', 'P-2': '10-8 Available' }; 
        renderBolos();
        renderCalls('police');
        renderUnits('police');
    } else if (department === 'fire') {
        fireCalls = [];
        // Reset units to default
        fireUnits = { 'E-1': '10-8 Available', 'L-1': '10-8 Available' };
        renderCalls('fire');
        renderUnits('fire');
    }
}

// --- Context Menu (Right-Click Removal) ---

function setupContextMenuListeners() {
    const lists = ['police-active-calls', 'fire-active-calls', 'police-active-bolos', 'police-unit-status', 'fire-unit-status'];
    const menu = document.getElementById('context-menu');

    lists.forEach(id => {
        const list = document.getElementById(id);
        if (list) {
            list.addEventListener('contextmenu', (e) => {
                const target = e.target.closest('.call-event, .bolo-event, .unit-status');

                if (target) {
                    e.preventDefault();
                    contextTarget = target;
                    menu.style.top = `${e.clientY}px`;
                    menu.style.left = `${e.clientX}px`;
                    menu.classList.remove('hidden');
                } else {
                    menu.classList.add('hidden');
                }
            });
        }
    });
    document.addEventListener('click', () => document.getElementById('context-menu').classList.add('hidden'));
}

function removeItemFromContext() {
    if (!contextTarget) return;

    const parentId = contextTarget.parentElement.id;
    const listChildren = Array.from(contextTarget.parentElement.children);
    const itemIndex = listChildren.indexOf(contextTarget);
    
    if (itemIndex === -1) {
        document.getElementById('context-menu').classList.add('hidden');
        return;
    }
    
    // Logic for Call Center / Bolos (Reversed Indexing Fix)
    if (parentId.includes('calls')) {
        const dept = parentId.includes('police') ? 'police' : 'fire';
        const data = dept === 'police' ? policeCalls : fireCalls;
        // Index in data array = data.length - 1 - itemIndex (display index)
        data.splice(data.length - 1 - itemIndex, 1);
        renderCalls(dept);
    } else if (parentId.includes('bolos')) {
        policeBolos.splice(policeBolos.length - 1 - itemIndex, 1);
        renderBolos();
    } 
    // Logic for Unit Status (Deletion by Key)
    else if (parentId.includes('unit-status')) {
        const unitName = contextTarget.textContent.split(':')[0].trim();
        if (parentId.includes('police')) {
            delete policeUnits[unitName];
            renderUnits('police');
        } else {
            delete fireUnits[unitName];
            renderUnits('fire');
        }
    }

    document.getElementById('context-menu').classList.add('hidden');
    contextTarget = null;
}

// --- Script Overlay Functions (Fixed Activation) ---
function displayScript(scriptName) {
    const overlay = document.getElementById('script-overlay');
    const content = document.getElementById('script-content');
    
    content.textContent = SCRIPTS[scriptName] || 'Script not found.';
    overlay.classList.add('active');
}

function hideScript() {
    document.getElementById('script-overlay').classList.remove('active');
}

// --- Rendering Functions ---

function renderCalls(department) {
    const listElement = document.getElementById(`${department}-active-calls`);
    const data = department === 'police' ? policeCalls : fireCalls;
    
    listElement.innerHTML = '';

    if (data.length === 0) {
        listElement.innerHTML = `<div class="call-event">No active calls.</div>`;
    }

    [...data].reverse().forEach((call) => {
        const div = document.createElement('div');
        div.className = 'call-event';
        if (department === 'police') {
            div.innerHTML = `<strong>${call.time} - ${call.type}</strong><br>
                             ${call.address} | Desc: ${call.description} | Units: ${call.units}`;
        } else {
            // Updated Fire display to include Address
            div.innerHTML = `<strong>${call.time} - ${call.type}</strong><br>
                             ${call.address} | Cross: ${call.crossroads} | Rigs: ${call.rigs}`;
        }
        listElement.appendChild(div); 
    });
}

function renderBolos() {
    const listElement = document.getElementById('police-active-bolos');
    listElement.innerHTML = '';
    
    if (policeBolos.length === 0) {
        listElement.innerHTML = `<div class="bolo-event">No active BOLOs.</div>`;
    }

    [...policeBolos].reverse().forEach((bolo) => {
        const div = document.createElement('div');
        div.className = 'bolo-event';
        div.innerHTML = `<strong>${bolo.time} BOLO:</strong> ${bolo.details}`;
        listElement.appendChild(div); 
    });
}

function renderUnits(department) {
    const listElement = document.getElementById(`${department}-unit-status`);
    const units = department === 'police' ? policeUnits : fireUnits;
    
    listElement.innerHTML = ''; 

    if (Object.keys(units).length === 0) {
        listElement.innerHTML = `<div class="unit-status">No active units.</div>`;
    }

    for (const [unit, status] of Object.entries(units)) {
        const div = document.createElement('div');
        div.className = 'unit-status';
        div.textContent = `${unit}: ${status}`;
        listElement.appendChild(div);
    }
}

function renderFireRigs() {
    const listElement = document.getElementById('responding-rigs');
    listElement.innerHTML = '';
    FIRE_RIGS.forEach(rig => {
        const div = document.createElement('div');
        div.className = 'unit-status';
        div.innerHTML = `<strong>${rig.name}</strong>: ${rig.criteria}`;
        listElement.appendChild(div);
    });
}

// --- Action Functions ---

function createPoliceCall() {
    const type = document.getElementById('p-call-type').value;
    const address = document.getElementById('p-address').value;
    const description = document.getElementById('p-call-desc').value;
    const units = document.getElementById('p-units-responding').value;

    if (!type || !address || !units) return alert("Please fill out Call Type, Address, and Units Responding.");

    const newCall = {
        time: document.getElementById('time-display').textContent.split(' ')[0],
        type,
        address,
        description,
        units
    };
    policeCalls.push(newCall);
    renderCalls('police');

    document.querySelectorAll('#police-dashboard .create-form input').forEach(input => input.value = '');
}

function createBolo() {
    const details = document.getElementById('bolo-details').value;

    if (!details) return alert("Please fill out BOLO Details.");

    const newBolo = {
        time: document.getElementById('time-display').textContent.split(' ')[0],
        details
    };
    policeBolos.push(newBolo);
    renderBolos();

    document.getElementById('bolo-details').value = '';
}

function addPoliceUnit() {
    const unit = document.getElementById('p-unit-call-sign').value.toUpperCase();
    const status = document.getElementById('p-unit-status').value;

    if (!unit || !status) return alert("Please provide a Unit Call Sign and Status.");

    // Update existing unit or add new one
    policeUnits[unit] = status;
    renderUnits('police');

    document.getElementById('p-unit-call-sign').value = '';
    document.getElementById('p-unit-status').value = '10-8 Available'; // Reset dropdown
}


function createFireCall() {
    const type = document.getElementById('f-call-type').value;
    const address = document.getElementById('f-address').value; // Get new address
    const description = document.getElementById('f-call-desc').value;
    const crossroads = document.getElementById('f-crossroads').value;
    const rigs = document.getElementById('f-rigs-responding').value;

    if (!type || !address || !crossroads || !rigs) return alert("Please fill out Call Type, Address, Crossroads, and Rigs Responding.");

    const newCall = {
        time: document.getElementById('time-display').textContent.split(' ')[0],
        type,
        address, // Save new address
        description,
        crossroads,
        rigs
    };
    fireCalls.push(newCall);
    renderCalls('fire');

    document.querySelectorAll('#fire-dashboard .create-form input').forEach(input => input.value = '');
}

function addFireUnit() {
    const unit = document.getElementById('f-unit-call-sign').value.toUpperCase();
    const status = document.getElementById('f-unit-status').value;

    if (!unit || !status) return alert("Please provide a Unit Call Sign and Status.");

    // Update existing unit or add new one
    fireUnits[unit] = status;
    renderUnits('fire');

    document.getElementById('f-unit-call-sign').value = '';
    document.getElementById('f-unit-status').value = '10-8 Available'; // Reset dropdown
}

// Start the CAD system when the page loads
document.addEventListener('DOMContentLoaded', initialSetup);
