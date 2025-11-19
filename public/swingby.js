// Constants (same as C program)
const G = 6.67430e-11;  // m^3/kg/s^2
const M = 5.972e24;     // kg (Earth mass)
const GM = G * M;

// Simulation state
let simulationData = [];
let currentStep = 0;
let isRunning = false;
let animationId = null;

// Initial conditions
let x0, y0, vx0, vy0, dt;

// Canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Initialize speed slider
document.getElementById('speed').addEventListener('input', function() {
    document.getElementById('speedValue').textContent = this.value + 'x';
});

// Fourth-order Runge-Kutta method
function rungeKutta4(x, y, vx, vy, dt) {
    const r = Math.sqrt(x * x + y * y);
    
    // k1
    const k1_x = vx;
    const k1_y = vy;
    const k1_vx = -GM * x / Math.pow(r, 3);
    const k1_vy = -GM * y / Math.pow(r, 3);
    
    // k2
    const x_2 = x + 0.5 * k1_x * dt;
    const y_2 = y + 0.5 * k1_y * dt;
    const r_2 = Math.sqrt(x_2 * x_2 + y_2 * y_2);
    const vx_2 = vx + 0.5 * k1_vx * dt;
    const vy_2 = vy + 0.5 * k1_vy * dt;
    
    const k2_x = vx_2;
    const k2_y = vy_2;
    const k2_vx = -GM * x_2 / Math.pow(r_2, 3);
    const k2_vy = -GM * y_2 / Math.pow(r_2, 3);
    
    // k3
    const x_3 = x + 0.5 * k2_x * dt;
    const y_3 = y + 0.5 * k2_y * dt;
    const r_3 = Math.sqrt(x_3 * x_3 + y_3 * y_3);
    const vx_3 = vx + 0.5 * k2_vx * dt;
    const vy_3 = vy + 0.5 * k2_vy * dt;
    
    const k3_x = vx_3;
    const k3_y = vy_3;
    const k3_vx = -GM * x_3 / Math.pow(r_3, 3);
    const k3_vy = -GM * y_3 / Math.pow(r_3, 3);
    
    // k4
    const x_4 = x + k3_x * dt;
    const y_4 = y + k3_y * dt;
    const r_4 = Math.sqrt(x_4 * x_4 + y_4 * y_4);
    const vx_4 = vx + k3_vx * dt;
    const vy_4 = vy + k3_vy * dt;
    
    const k4_x = vx_4;
    const k4_y = vy_4;
    const k4_vx = -GM * x_4 / Math.pow(r_4, 3);
    const k4_vy = -GM * y_4 / Math.pow(r_4, 3);
    
    // Update values
    const new_vx = vx + (1.0/6.0) * (k1_vx + 2.0*k2_vx + 2.0*k3_vx + k4_vx) * dt;
    const new_vy = vy + (1.0/6.0) * (k1_vy + 2.0*k2_vy + 2.0*k3_vy + k4_vy) * dt;
    const new_x = x + (1.0/6.0) * (k1_x + 2.0*k2_x + 2.0*k3_x + k4_x) * dt;
    const new_y = y + (1.0/6.0) * (k1_y + 2.0*k2_y + 2.0*k3_y + k4_y) * dt;
    
    return { x: new_x, y: new_y, vx: new_vx, vy: new_vy };
}

// Initialize simulation
function initializeSimulation() {
    x0 = parseFloat(document.getElementById('x0').value) * 1e6;
    y0 = parseFloat(document.getElementById('y0').value) * 1e6;
    vx0 = parseFloat(document.getElementById('vx0').value) * 1e3;
    vy0 = parseFloat(document.getElementById('vy0').value) * 1e3;
    dt = parseFloat(document.getElementById('dt').value);
    
    simulationData = [];
    currentStep = 0;
    
    let x = x0, y = y0, vx = vx0, vy = vy0;
    let t = 0;
    
    // Calculate trajectory
    const maxSteps = 20000;
    for (let i = 0; i < maxSteps; i++) {
        const r = Math.sqrt(x * x + y * y);
        simulationData.push({ t, x, y, vx, vy, r });
        
        const result = rungeKutta4(x, y, vx, vy, dt);
        x = result.x;
        y = result.y;
        vx = result.vx;
        vy = result.vy;
        t += dt;
        
        // Stop if object goes too far
        if (r > 50e6) break;
    }
}

// Draw scene
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const scale = 4e-5; // Scale factor for visualization
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = -10; i <= 10; i++) {
        const offset = i * 5e6 * scale;
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(centerX + offset, 0);
        ctx.lineTo(centerX + offset, canvas.height);
        ctx.stroke();
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, centerY + offset);
        ctx.lineTo(canvas.width, centerY + offset);
        ctx.stroke();
    }
    
    // Draw Earth
    const earthRadius = 6.371e6 * scale;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, earthRadius);
    gradient.addColorStop(0, '#4dabf7');
    gradient.addColorStop(0.7, '#1971c2');
    gradient.addColorStop(1, '#0c408c');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw Earth outline
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw trajectory
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= Math.min(currentStep, simulationData.length - 1); i++) {
        const data = simulationData[i];
        const px = centerX + data.x * scale;
        const py = centerY - data.y * scale; // Invert Y for screen coordinates
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.stroke();
    
    // Draw spacecraft
    if (currentStep < simulationData.length) {
        const data = simulationData[currentStep];
        const px = centerX + data.x * scale;
        const py = centerY - data.y * scale;
        
        // Spacecraft glow
        const glowGradient = ctx.createRadialGradient(px, py, 0, px, py, 15);
        glowGradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
        glowGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(px, py, 15, 0, 2 * Math.PI);
        ctx.fill();
        
        // Spacecraft body
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    // Draw labels
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Earth', centerX, centerY);
}

// Update info panel
function updateInfo() {
    if (currentStep < simulationData.length) {
        const data = simulationData[currentStep];
        document.getElementById('timeValue').textContent = data.t.toFixed(1) + ' s';
        document.getElementById('xValue').textContent = (data.x / 1e6).toFixed(3) + ' ×10⁶ m';
        document.getElementById('yValue').textContent = (data.y / 1e6).toFixed(3) + ' ×10⁶ m';
        document.getElementById('vxValue').textContent = data.vx.toFixed(1) + ' m/s';
        document.getElementById('vyValue').textContent = data.vy.toFixed(1) + ' m/s';
        document.getElementById('rValue').textContent = (data.r / 1e6).toFixed(3) + ' ×10⁶ m';
    }
}

// Animation loop
function animate() {
    if (!isRunning) return;
    
    const speed = parseInt(document.getElementById('speed').value);
    
    for (let i = 0; i < speed; i++) {
        if (currentStep < simulationData.length - 1) {
            currentStep++;
        } else {
            pauseSimulation();
            return;
        }
    }
    
    draw();
    updateInfo();
    
    animationId = requestAnimationFrame(animate);
}

// Control functions
function startSimulation() {
    if (!isRunning) {
        if (currentStep === 0 || currentStep >= simulationData.length - 1) {
            initializeSimulation();
            currentStep = 0;
        }
        isRunning = true;
        animate();
    }
}

function pauseSimulation() {
    isRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function resetSimulation() {
    pauseSimulation();
    currentStep = 0;
    initializeSimulation();
    draw();
    updateInfo();
}

function downloadCSV() {
    if (simulationData.length === 0) {
        initializeSimulation();
    }
    
    let csv = 'i,t,x,y,vx,vy\n';
    simulationData.forEach((data, i) => {
        csv += `${i},${data.t},${data.x},${data.y},${data.vx},${data.vy}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'swingby.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// Initialize on load
window.addEventListener('load', () => {
    initializeSimulation();
    draw();
    updateInfo();
});
