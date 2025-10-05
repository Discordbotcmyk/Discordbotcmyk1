// --- Data Storage (In-memory for this example) ---
// Initial unit statuses set to the required 10-codes
let policeCalls = [];
let fireCalls = [];
let policeBolos = [];
let policeUnits = { 'P-1': '10-8 Available', 'P-2': '10-8 Available' };
let fireUnits = { 'E-1': '10-8 Available', 'L-1': '10-8 Available' };

let countdownInterval = null;
let messageTimeout = null;
let syncInterval = null; // New interval for the persistent countdown
let contextTarget = null; 

// --- Configuration Data ---
const SIX_DAYS_IN_MS = 6 * 24 * 60 * 60 * 1000;

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

function startSyncCountdown() {
    const syncCountdownElement = document.getElementById('sync-countdown');
    let targetTime = localStorage.getItem('syncTargetTime');

    if (!targetTime || new Date().getTime() >= parseInt(targetTime)) {
        // If no time is stored or the countdown has expired, set a new 6-day target
        targetTime = new Date().getTime() + SIX_DAYS_IN_MS;
        localStorage.setItem('syncTargetTime', targetTime);
    } else {
        targetTime = parseInt(targetTime);
    }

    if (syncInterval) clearInterval(syncInterval);

    syncInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetTime - now;

        if (distance <= 0) {
            clearInterval(syncInterval);
            syncCountdownElement.textContent = "SYSTEM SYNC COMPLETE. Refreshing in 3s...";
            localStorage.removeItem('syncTargetTime');
            setTimeout(() => window.location.reload(), 3000);
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        syncCountdownElement.textContent = 
            `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
            
    }, 1000);
}


function initialSetup() {
    setInterval(updateTime, 1000);
    updateTime(); 
    renderFireRigs();
    renderUnits('police');
    renderUnits('fire');
    setupContextMenuListeners();
    startSyncCountdown(); // Start the persistent countdown
}

// --- Dashboard Transition Logic (Removed Admin checks) ---
function showDashboard(department) {
    const dashboards = document.querySelectorAll('.dashboard');

    let targetId;
    if (department === 'police') targetId = 'police-dashboard';
    else if (department === 'fire') targetId = 'fire-dashboard';
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

// --- Clear All Functionality (unchanged) ---
function clearAll(department) {
    if (!confirm(`Are you sure you want to CLEAR ALL data (Calls/Units${department === 'police' ? '/Bolos' : ''}) for ${department.toUpperCase()}?`)) {
        return;
    }

    if (department === 'police') {
        policeCalls = [];
        policeBolos = [];
        policeUnits = { 'P-1': '10-8 Available', 'P-2': '10-8 Available' }; 
        renderBolos();
        renderCalls('police');
        renderUnits('police');
    } else if (department === 'fire') {
        fireCalls = [];
        fireUnits = { 'E-1': '10-8 Available', 'L-1': '10-8 Available' };
        renderCalls('fire');
        renderUnits('fire');
    }
}

// --- Context Menu (Right-Click Removal - Fixed) ---

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
    
    if (parentId.includes('calls')) {
        const dept = parentId.includes('police') ? 'police' : 'fire';
        const data = dept === 'police' ? policeCalls : fireCalls;
        data.splice(data.length - 1 - itemIndex, 1);
        renderCalls(dept);
    } else if (parentId.includes('bolos')) {
        policeBolos.splice(policeBolos.length - 1 - itemIndex, 1);
        renderBolos();
    } 
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

// --- Script Overlay Functions (unchanged) ---
function displayScript(scriptName) {
    const overlay = document.getElementById('script-overlay');
    const content = document.getElementById('script-content');
    
    content.textContent = SCRIPTS[scriptName] || 'Script not found.';
    overlay.classList.add('active');
}

function hideScript() {
    document.getElementById('script-overlay').classList.remove('active');
}

// --- Rendering Functions (unchanged) ---

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

// --- Action Functions (Unit updates fixed to use dropdown value) ---

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

    policeUnits[unit] = status;
    renderUnits('police');

    document.getElementById('p-unit-call-sign').value = '';
    document.getElementById('p-unit-status').value = '10-8 Available'; 
}


function createFireCall() {
    const type = document.getElementById('f-call-type').value;
    const address = document.getElementById('f-address').value; 
    const description = document.getElementById('f-call-desc').value;
    const crossroads = document.getElementById('f-crossroads').value;
    const rigs = document.getElementById('f-rigs-responding').value;

    if (!type || !address || !crossroads || !rigs) return alert("Please fill out Call Type, Address, Crossroads, and Rigs Responding.");

    const newCall = {
        time: document.getElementById('time-display').textContent.split(' ')[0],
        type,
        address, 
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

    fireUnits[unit] = status;
    renderUnits('fire');

    document.getElementById('f-unit-call-sign').value = '';
    document.getElementById('f-unit-status').value = '10-8 Available'; 
}

// --- Administrator/Message Functions (kept for potential internal use/message setting, but access removed) ---

// Removed startUpdateCountdown and its associated logic, as the admin access is gone.

function sendMessageBanner() {
    // This functionality is still available if you want to set a message programmatically later
    // or through an external tool, but the UI access is removed.
    const message = "System status messages are currently unavailable.";
    const banner = document.getElementById('message-banner');

    if (messageTimeout) clearTimeout(messageTimeout);

    banner.textContent = message;
    banner.classList.remove('hidden');

    messageTimeout = setTimeout(() => {
        banner.classList.add('hidden');
    }, 5000); // 5 seconds display for internal notification
}

document.addEventListener('DOMContentLoaded', initialSetup);
