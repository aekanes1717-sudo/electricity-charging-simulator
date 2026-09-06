// ===== ADVANCED PREMIUM ELECTRICITY SIMULATOR =====

class Particle {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = 1;
        this.size = Math.random() * 4 + 2;
        this.color = ['#ec4899', '#6366f1', '#f59e0b'][Math.floor(Math.random() * 3)];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15;
        this.life -= 0.02;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Electron {
    constructor(angle, radius, chargeLevel) {
        this.angle = angle;
        this.radius = radius;
        this.baseRadius = radius;
        this.chargeLevel = chargeLevel;
        this.speed = 0.05 + chargeLevel * 0.1;
    }

    update(time, chargeLevel) {
        this.angle += this.speed;
        this.radius = this.baseRadius + Math.sin(time) * 5 * chargeLevel;
    }

    getPosition(cx, cy) {
        return {
            x: cx + Math.cos(this.angle) * this.radius,
            y: cy + Math.sin(this.angle) * this.radius
        };
    }
}

// ===== FRICTION SIMULATION =====
class FrictionSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.electrons = 0;
        this.maxElectrons = 100;
        this.particles = [];
        this.electrons_list = [];
        this.friction = 0;
        this.energy = 0;

        this.canvas.addEventListener('mousemove', (e) => this.handleDrag(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleDrag(e));
        this.canvas.addEventListener('mouseleave', () => this.friction = 0);
        this.canvas.addEventListener('touchend', () => this.friction = 0);
    }

    handleDrag(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        const ballX = this.canvas.width / 2;
        const ballY = this.canvas.height / 2;
        const distance = Math.sqrt((x - ballX) ** 2 + (y - ballY) ** 2);

        if (distance < 60) {
            this.friction = Math.min(1, distance / 60);
            if (this.electrons < this.maxElectrons) {
                this.electrons += 1.5;
                this.energy += 2;
            }

            for (let i = 0; i < 5; i++) {
                this.particles.push(new Particle(
                    ballX + (Math.random() - 0.5) * 80,
                    ballY + (Math.random() - 0.5) * 80,
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 8
                ));
            }

            if (this.electrons_list.length < Math.floor(this.electrons)) {
                this.electrons_list.push(new Electron(
                    Math.random() * Math.PI * 2,
                    65,
                    this.electrons / this.maxElectrons
                ));
            }
        }
    }

    update() {
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => p.update());
        this.electrons_list.forEach(e => e.update(Date.now() / 500, this.electrons / this.maxElectrons));
    }

    draw() {
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const ballX = this.canvas.width / 2;
        const ballY = this.canvas.height / 2;
        const chargeLevel = this.electrons / this.maxElectrons;
        const hue = 200 + chargeLevel * 60;

        // Draw glow
        this.ctx.shadowColor = `hsl(${hue}, 70%, 50%)`;
        this.ctx.shadowBlur = 40 * chargeLevel;

        this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        this.ctx.beginPath();
        this.ctx.arc(ballX, ballY, 45, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Draw electrons
        this.electrons_list.forEach(e => {
            const pos = e.getPosition(ballX, ballY);
            this.ctx.fillStyle = '#ec4899';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw particles
        this.particles.forEach(p => p.draw(this.ctx));

        // Draw text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        if (this.electrons > 20) {
            this.ctx.fillText('⚡ مكهرب', ballX, ballY);
        }
    }

    reset() {
        this.electrons = 0;
        this.particles = [];
        this.electrons_list = [];
        this.energy = 0;
        this.friction = 0;
    }

    getInfo() {
        return {
            charge: this.electrons === 0 ? 'محايد' : this.electrons < 30 ? 'مكهرب قليلاً 🔋' : this.electrons < 70 ? 'مكهرب ⚡' : 'مكهرب جداً ⚡⚡⚡',
            electrons: Math.floor(this.electrons),
            energy: Math.floor(this.energy),
            meter: (this.electrons / this.maxElectrons) * 100
        };
    }
}

// ===== CONTACT SIMULATION =====
class ContactSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.ball1Charge = 0;
        this.ball2Charge = 0;
        this.particles = [];
        this.touching = false;
        this.electrons1 = [];
        this.electrons2 = [];
    }

    charge() {
        this.ball1Charge = 80;
        this.electrons1 = [];
        for (let i = 0; i < 20; i++) {
            this.electrons1.push(new Electron(Math.random() * Math.PI * 2, 60, 1));
        }
    }

    touch() {
        if (this.ball1Charge > 0 && !this.touching) {
            this.touching = true;
            const total = this.ball1Charge + this.ball2Charge;
            this.ball1Charge = total / 2;
            this.ball2Charge = total / 2;

            this.electrons1 = [];
            this.electrons2 = [];
            for (let i = 0; i < Math.floor(this.ball1Charge / 4); i++) {
                this.electrons1.push(new Electron(Math.random() * Math.PI * 2, 60, 0.5));
                this.electrons2.push(new Electron(Math.random() * Math.PI * 2, 60, 0.5));
            }

            for (let i = 0; i < 30; i++) {
                this.particles.push(new Particle(
                    this.canvas.width / 2,
                    this.canvas.height / 2,
                    (Math.random() - 0.5) * 12,
                    (Math.random() - 0.5) * 12
                ));
            }

            setTimeout(() => this.touching = false, 800);
        }
    }

    update() {
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => p.update());
        this.electrons1.forEach(e => e.update(Date.now() / 500, this.ball1Charge / 80));
        this.electrons2.forEach(e => e.update(Date.now() / 500, this.ball2Charge / 80));
    }

    draw() {
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const ball1X = this.canvas.width * 0.33;
        const ball1Y = this.canvas.height / 2;
        const ball2X = this.canvas.width * 0.67;
        const ball2Y = this.canvas.height / 2;

        this.drawBall(ball1X, ball1Y, this.ball1Charge, '1', this.electrons1);
        this.drawBall(ball2X, ball2Y, this.ball2Charge, '2', this.electrons2);

        if (this.touching) {
            this.ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(ball1X + 50, ball1Y);
            this.ctx.lineTo(ball2X - 50, ball2Y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        this.particles.forEach(p => p.draw(this.ctx));
    }

    drawBall(x, y, charge, label, electrons) {
        const hue = 200 + (charge / 80) * 60;
        this.ctx.shadowColor = `hsl(${hue}, 70%, 50%)`;
        this.ctx.shadowBlur = 30 * (charge / 80);
        this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 40, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        electrons.forEach(e => {
            const pos = e.getPosition(x, y);
            this.ctx.fillStyle = '#ec4899';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, x, y - 65);
    }

    reset() {
        this.ball1Charge = 0;
        this.ball2Charge = 0;
        this.particles = [];
        this.electrons1 = [];
        this.electrons2 = [];
        this.touching = false;
    }

    getInfo() {
        return {
            ball1: this.ball1Charge === 0 ? 'محايد' : this.ball1Charge > 40 ? 'مكهرب ⚡' : 'مكهرب قليلاً 🔋',
            ball2: this.ball2Charge === 0 ? 'محايد' : this.ball2Charge > 40 ? 'مكهرب ⚡' : 'مكهرب قليلاً 🔋',
            meter: (Math.max(this.ball1Charge, this.ball2Charge) / 80) * 100
        };
    }
}

// ===== INDUCTION SIMULATION =====
class InductionSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chargedBallX = 100;
        this.chargedBallCharge = 0;
        this.neutralBallX = this.canvas.width - 100;
        this.distance = this.canvas.width - 200;
        this.isDragging = false;
        this.electrons = [];
        this.inducedElectrons = [];

        this.canvas.addEventListener('mousedown', () => this.isDragging = true);
        this.canvas.addEventListener('mouseup', () => this.isDragging = false);
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
    }

    handleMove(e) {
        if (!this.isDragging || this.chargedBallCharge === 0) return;
        const rect = this.canvas.getBoundingClientRect();
        this.chargedBallX = Math.max(50, Math.min((e.clientX - rect.left), this.canvas.width - 50));
        this.distance = Math.abs(this.neutralBallX - this.chargedBallX);
    }

    charge() {
        this.chargedBallCharge = 80;
        this.electrons = [];
        for (let i = 0; i < 15; i++) {
            this.electrons.push(new Electron(Math.random() * Math.PI * 2, 60, 1));
        }
    }

    update() {
        this.electrons.forEach(e => e.update(Date.now() / 500, 1));
        const inducedLevel = Math.max(0, 1 - this.distance / 250);
        if (inducedLevel > 0) {
            if (this.inducedElectrons.length < Math.floor(inducedLevel * 10)) {
                this.inducedElectrons.push(new Electron(Math.random() * Math.PI * 2, 50, inducedLevel));
            }
        } else {
            this.inducedElectrons = [];
        }
        this.inducedElectrons.forEach(e => e.update(Date.now() / 500, 0.5));
    }

    draw() {
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const ballY = this.canvas.height / 2;

        if (this.chargedBallCharge > 0) {
            this.drawElectricField(this.chargedBallX, ballY);
        }

        if (this.chargedBallCharge > 0) {
            this.drawChargedBall(this.chargedBallX, ballY);
        }

        this.drawNeutralBall(this.neutralBallX, ballY);

        this.ctx.fillStyle = '#cbd5e1';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        if (this.chargedBallCharge > 0) this.ctx.fillText('مكهربة', this.chargedBallX, ballY - 75);
        this.ctx.fillText('محايدة', this.neutralBallX, ballY - 75);
    }

    drawElectricField(x, y) {
        const strength = Math.max(0, 1 - this.distance / 300);
        this.ctx.strokeStyle = `rgba(99, 102, 241, ${0.3 * strength})`;
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const length = 100 + this.distance / 3;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            this.ctx.stroke();
        }
    }

    drawChargedBall(x, y) {
        this.ctx.shadowColor = '#ef4444';
        this.ctx.shadowBlur = 40;
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 40, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.electrons.forEach(e => {
            const pos = e.getPosition(x, y);
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawNeutralBall(x, y) {
        const inducedLevel = Math.max(0, 1 - this.distance / 250);
        const hue = 200 + inducedLevel * 60;
        this.ctx.shadowColor = `hsl(${hue}, 70%, 50%)`;
        this.ctx.shadowBlur = 30 * inducedLevel;
        this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 40, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        if (inducedLevel > 0) {
            this.ctx.fillStyle = '#ef4444';
            this.ctx.beginPath();
            this.ctx.arc(x - 18, y, 6, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#3b82f6';
            this.ctx.beginPath();
            this.ctx.arc(x + 18, y, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    reset() {
        this.chargedBallCharge = 0;
        this.chargedBallX = 100;
        this.distance = this.canvas.width - 200;
        this.electrons = [];
        this.inducedElectrons = [];
    }

    getInfo() {
        let distance = 'بعيدة';
        let meter = 0;
        if (this.chargedBallCharge > 0) {
            if (this.distance < 100) {
                distance = 'قريبة جداً';
                meter = 100;
            } else if (this.distance < 150) {
                distance = 'قريبة';
                meter = 70;
            } else if (this.distance < 200) {
                distance = 'متوسطة';
                meter = 40;
            }
        }
        return {
            distance: distance,
            status: this.chargedBallCharge > 0 && this.distance < 200 ? 'متأثر بالمجال ⚡' : 'محايد',
            meter: meter
        };
    }
}

// ===== MAIN CONTROLLER =====
let frictionSim, contactSim, inductionSim;

window.addEventListener('DOMContentLoaded', () => {
    frictionSim = new FrictionSimulation('frictionCanvas');
    contactSim = new ContactSimulation('contactCanvas');
    inductionSim = new InductionSimulation('inductionCanvas');

    function animate() {
        frictionSim.update();
        frictionSim.draw();
        updateFrictionUI();

        contactSim.update();
        contactSim.draw();
        updateContactUI();

        inductionSim.update();
        inductionSim.draw();
        updateInductionUI();

        requestAnimationFrame(animate);
    }
    animate();

    // Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.method-section').forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.method + '-section').classList.add('active');
        });
    });

    // Friction Controls
    document.getElementById('frictionReset').addEventListener('click', () => frictionSim.reset());

    // Contact Controls
    document.getElementById('contactCharge').addEventListener('click', () => {
        contactSim.charge();
        document.getElementById('contactTouch').disabled = false;
    });
    document.getElementById('contactTouch').addEventListener('click', () => contactSim.touch());
    document.getElementById('contactReset').addEventListener('click', () => {
        contactSim.reset();
        document.getElementById('contactTouch').disabled = true;
    });

    // Induction Controls
    document.getElementById('inductionCharge').addEventListener('click', () => inductionSim.charge());
    document.getElementById('inductionReset').addEventListener('click', () => inductionSim.reset());
});

function updateFrictionUI() {
    const info = frictionSim.getInfo();
    document.getElementById('frictionChargeStatus').textContent = info.charge;
    document.getElementById('frictionChargeDetail').textContent = `${info.electrons} إلكترون`;
    document.getElementById('frictionElectronCount').textContent = info.electrons;
    document.getElementById('frictionEnergy').textContent = info.energy;
    document.getElementById('frictionMeter').style.width = info.meter + '%';
    document.getElementById('frictionMeterValue').textContent = Math.round(info.meter) + '%';
}

function updateContactUI() {
    const info = contactSim.getInfo();
    document.getElementById('contactBall1Charge').textContent = info.ball1;
    document.getElementById('contactBall2Charge').textContent = info.ball2;
    document.getElementById('contactBall1Detail').textContent = Math.floor(contactSim.ball1Charge) + ' شحنة';
    document.getElementById('contactBall2Detail').textContent = Math.floor(contactSim.ball2Charge) + ' شحنة';
    document.getElementById('contactMeter').style.width = info.meter + '%';
    document.getElementById('contactMeterValue').textContent = Math.round(info.meter) + '%';
}

function updateInductionUI() {
    const info = inductionSim.getInfo();
    document.getElementById('inductionDistance').textContent = info.distance;
    document.getElementById('inductionNeutralStatus').textContent = info.status;
    document.getElementById('inductionDistanceVal').textContent = Math.round(inductionSim.distance) + ' بكسل';
    document.getElementById('inductionChargedStatus').textContent = inductionSim.chargedBallCharge > 0 ? 'مكهربة ⚡' : 'غير مشحونة';
    document.getElementById('inductionMeter').style.width = info.meter + '%';
    document.getElementById('inductionMeterValue').textContent = Math.round(info.meter) + '%';
}