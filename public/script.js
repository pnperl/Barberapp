let selectedServices = [];
let allServices = [];

async function init() {
    await loadServices();
    await loadQueue();
}

async function loadServices() {
    const res = await fetch('/api/services');
    allServices = await res.json();
    renderServiceGrid();
}

function renderServiceGrid() {
    const grid = document.getElementById('serviceGrid');
    grid.innerHTML = '';
    allServices.forEach(s => {
        const btn = document.createElement('div');
        btn.className = 'svc-card';
        btn.innerHTML = `<strong>${s.name}</strong><br>${s.duration}m`;
        btn.onclick = () => toggleService(s, btn);
        grid.appendChild(btn);
    });
}

function toggleService(service, element) {
    const index = selectedServices.findIndex(s => s.id === service.id);
    if (index > -1) {
        selectedServices.splice(index, 1);
        element.classList.remove('active');
    } else {
        selectedServices.push(service);
        element.classList.add('active');
    }
    document.getElementById('tempWait').innerText = selectedServices.reduce((sum, s) => sum + s.duration, 0);
}

async function submitToQueue() {
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value.replace(/\D/g,''); // Clean phone number
    if (!name || !phone || selectedServices.length === 0) return alert("Please check name, phone, and services!");

    await fetch('/api/queue', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            customerName: name,
            phone: phone,
            serviceNames: selectedServices.map(s => s.name).join(', '),
            totalDuration: selectedServices.reduce((sum, s) => sum + s.duration, 0)
        })
    });
    alert("Success! You are in line.");
    location.reload();
}

async function loadQueue() {
    const res = await fetch('/api/queue');
    const queue = await res.json();
    const display = document.getElementById('queueDisplay');
    let runningWait = 0;

    display.innerHTML = queue.map((q, i) => {
        const itemHtml = `
            <div class="queue-item">
                <div>
                    <strong>${q.customerName}</strong><br>
                    <small>${q.serviceNames} (${q.totalDuration}m)</small>
                </div>
                <div>
                    <a href="https://wa.me/${q.phone}" class="btn-wa">💬</a>
                    <button onclick="completeUser(${q.id})">✅</button>
                </div>
            </div>`;
        runningWait += q.totalDuration;
        return itemHtml;
    }).join('');
    document.getElementById('globalWait').innerText = runningWait;
}

async function completeUser(id) {
    if(confirm("Mark as completed and save to history?")) {
        await fetch(`/api/complete/${id}`, { method: 'POST' });
        loadQueue();
    }
}

init();