// Constants (same as C program)
const G = 6.67430e-11;  // m^3/kg/s^2
const M = 5.972e24;     // kg (Earth mass)
const GM = G * M;
const EARTH_RADIUS = 6.371e6; // m

// Simulation state - memory efficient (no pre-calculation)
let trailPoints = []; // Only store recent trail points
const MAX_TRAIL_POINTS = 2000; // Limit trail length to save memory
let currentState = { t: 0, x: 0, y: 0, vx: 0, vy: 0, r: 0 };
let isRunning = false;
let animationId = null;

// Initial conditions
let x0, y0, vx0, vy0, dt;

// Camera state for dynamic viewport
let camera = {
    x: 0,
    y: 0,
    scale: 4e-5,
    targetScale: 4e-5,
    smoothing: 0.08
};

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
    
    currentState = {
        t: 0,
        x: x0,
        y: y0,
        vx: vx0,
        vy: vy0,
        r: Math.sqrt(x0 * x0 + y0 * y0)
    };
    
    trailPoints = [{ x: x0, y: y0 }];
}

// Update camera to keep both Earth and spacecraft in view
function updateCamera() {
    const padding = 1.3; // Add 30% padding
    
    // Calculate bounding box for Earth and spacecraft
    const earthRadius = EARTH_RADIUS;
    const minX = Math.min(-earthRadius, currentState.x) * padding;
    const maxX = Math.max(earthRadius, currentState.x) * padding;
    const minY = Math.min(-earthRadius, currentState.y) * padding;
    const maxY = Math.max(earthRadius, currentState.y) * padding;
    
    // Calculate required scale to fit everything
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    const maxRange = Math.max(rangeX, rangeY);
    
    // Target scale to fit the scene
    camera.targetScale = Math.min(canvas.width, canvas.height) / maxRange;
    
    // Smooth camera transition
    camera.scale += (camera.targetScale - camera.scale) * camera.smoothing;
    
    // Center camera between Earth and spacecraft
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const targetCameraX = centerX;
    const targetCameraY = centerY;
    
    camera.x += (targetCameraX - camera.x) * camera.smoothing;
    camera.y += (targetCameraY - camera.y) * camera.smoothing;
}

// Convert world coordinates to screen coordinates
function worldToScreen(worldX, worldY) {
    const screenX = canvas.width / 2 + (worldX - camera.x) * camera.scale;
    const screenY = canvas.height / 2 - (worldY - camera.y) * camera.scale;
    return { x: screenX, y: screenY };
}

// Draw scene
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerScreen = worldToScreen(0, 0);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const gridSpacing = 5e6; // 5 million meters
    const gridRange = 50e6;
    
    for (let i = -gridRange; i <= gridRange; i += gridSpacing) {
        // Vertical lines
        const start1 = worldToScreen(i, -gridRange);
        const end1 = worldToScreen(i, gridRange);
        ctx.beginPath();
        ctx.moveTo(start1.x, start1.y);
        ctx.lineTo(end1.x, end1.y);
        ctx.stroke();
        
        // Horizontal lines
        const start2 = worldToScreen(-gridRange, i);
        const end2 = worldToScreen(gridRange, i);
        ctx.beginPath();
        ctx.moveTo(start2.x, start2.y);
        ctx.lineTo(end2.x, end2.y);
        ctx.stroke();
    }
    
    // Draw Earth
    const earthScreenRadius = EARTH_RADIUS * camera.scale;
    const gradient = ctx.createRadialGradient(
        centerScreen.x, centerScreen.y, 0, 
        centerScreen.x, centerScreen.y, earthScreenRadius
    );
    gradient.addColorStop(0, '#4dabf7');
    gradient.addColorStop(0.7, '#1971c2');
    gradient.addColorStop(1, '#0c408c');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerScreen.x, centerScreen.y, earthScreenRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw Earth outline
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerScreen.x, centerScreen.y, earthScreenRadius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw trajectory trail with gradient
    if (trailPoints.length > 1) {
        ctx.lineWidth = 2;
        for (let i = 1; i < trailPoints.length; i++) {
            const alpha = i / trailPoints.length; // Fade older points
            ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.6})`;
            ctx.beginPath();
            const p1 = worldToScreen(trailPoints[i - 1].x, trailPoints[i - 1].y);
            const p2 = worldToScreen(trailPoints[i].x, trailPoints[i].y);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }
    
    // Draw spacecraft
    const spacecraftPos = worldToScreen(currentState.x, currentState.y);
    
    // Spacecraft glow
    const glowGradient = ctx.createRadialGradient(
        spacecraftPos.x, spacecraftPos.y, 0, 
        spacecraftPos.x, spacecraftPos.y, 15
    );
    glowGradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
    glowGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(spacecraftPos.x, spacecraftPos.y, 15, 0, 2 * Math.PI);
    ctx.fill();
    
    // Spacecraft body
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(spacecraftPos.x, spacecraftPos.y, 5, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(spacecraftPos.x, spacecraftPos.y, 5, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw velocity vector
    const velocityScale = 5000;
    const velEnd = worldToScreen(
        currentState.x + currentState.vx * velocityScale,
        currentState.y + currentState.vy * velocityScale
    );
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(spacecraftPos.x, spacecraftPos.y);
    ctx.lineTo(velEnd.x, velEnd.y);
    ctx.stroke();
    
    // Draw arrowhead
    const angle = Math.atan2(velEnd.y - spacecraftPos.y, velEnd.x - spacecraftPos.x);
    const arrowSize = 8;
    ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
    ctx.beginPath();
    ctx.moveTo(velEnd.x, velEnd.y);
    ctx.lineTo(
        velEnd.x - arrowSize * Math.cos(angle - Math.PI / 6),
        velEnd.y - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        velEnd.x - arrowSize * Math.cos(angle + Math.PI / 6),
        velEnd.y - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    
    // Draw labels
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Earth', centerScreen.x, centerScreen.y + earthScreenRadius + 20);
    
    // Draw scale indicator
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px Arial';
    const scaleInfo = `Scale: ${(1 / camera.scale / 1e6).toFixed(2)} million m/px`;
    ctx.fillText(scaleInfo, 10, canvas.height - 10);
}

// Update info panel
function updateInfo() {
    document.getElementById('timeValue').textContent = currentState.t.toFixed(1) + ' s';
    document.getElementById('xValue').textContent = (currentState.x / 1e6).toFixed(3) + ' ×10⁶ m';
    document.getElementById('yValue').textContent = (currentState.y / 1e6).toFixed(3) + ' ×10⁶ m';
    document.getElementById('vxValue').textContent = currentState.vx.toFixed(1) + ' m/s';
    document.getElementById('vyValue').textContent = currentState.vy.toFixed(1) + ' m/s';
    document.getElementById('rValue').textContent = (currentState.r / 1e6).toFixed(3) + ' ×10⁶ m';
}

// Step simulation forward
function stepSimulation() {
    const result = rungeKutta4(currentState.x, currentState.y, currentState.vx, currentState.vy, dt);
    
    currentState.x = result.x;
    currentState.y = result.y;
    currentState.vx = result.vx;
    currentState.vy = result.vy;
    currentState.r = Math.sqrt(result.x * result.x + result.y * result.y);
    currentState.t += dt;
    
    // Add to trail (with memory limit)
    trailPoints.push({ x: currentState.x, y: currentState.y });
    if (trailPoints.length > MAX_TRAIL_POINTS) {
        trailPoints.shift(); // Remove oldest point
    }
}

// Animation loop - continuous simulation
function animate() {
    if (!isRunning) return;
    
    const speed = parseInt(document.getElementById('speed').value);
    
    // Step simulation multiple times per frame for speed
    for (let i = 0; i < speed; i++) {
        stepSimulation();
    }
    
    updateCamera();
    draw();
    updateInfo();
    
    animationId = requestAnimationFrame(animate);
}

// Control functions
function startSimulation() {
    if (!isRunning) {
        if (currentState.t === 0) {
            initializeSimulation();
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
    initializeSimulation();
    updateCamera();
    draw();
    updateInfo();
}

function downloadCSV() {
    // Generate CSV from trail points
    let csv = 'i,t,x,y,vx,vy\n';
    
    // For download, we need to recalculate or use stored trail
    // For now, we'll use the current trail points
    alert('CSV download will contain the visible trail points. For full simulation data, let it run longer!');
    
    trailPoints.forEach((point, i) => {
        // Approximate time based on trail index
        const t = i * dt * parseInt(document.getElementById('speed').value);
        csv += `${i},${t.toFixed(2)},${point.x},${point.y},0,0\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'swingby_trail.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// Initialize on load
window.addEventListener('load', () => {
    initializeSimulation();
    updateCamera();
    draw();
    updateInfo();
});
