// ===== طريقة الدلك (Friction) =====
class FrictionSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.electrons = 0;
        this.maxElectrons = 100;
        this.isCharging = false;
        this.particles = [];
        
        this.canvas.addEventListener('mousemove', (e) => this.handleDrag(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleDrag(e));
        this.canvas.addEventListener('mouseleave', () => this.isCharging = false);
        this.canvas.addEventListener('touchend', () => this.isCharging = false);
    }

    handleDrag(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        // التحقق من أن المؤشر فوق الكرة
        const ballX = this.canvas.width / 2;
        const ballY = this.canvas.height / 2;
        const distance = Math.sqrt((x - ballX) ** 2 + (y - ballY) ** 2);

        if (distance < 50) {
            this.isCharging = true;
            if (this.electrons < this.maxElectrons) {
                this.electrons += 2;
            }

            // إنشاء جزيئات احتكاك
            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: ballX,
                    y: ballY,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    life: 1,
                    size: Math.random() * 3 + 2
                });
            }
        }
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // الجاذبية
            p.life -= 0.02;
            return p.life > 0;
        });
    }

    draw() {
        // مسح الكانفاس
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // رسم شبكة خلفية
        this.ctx.strokeStyle = '#e9ecef';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.canvas.width; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }

        // الكرة الرئيسية
        const ballX = this.canvas.width / 2;
        const ballY = this.canvas.height / 2;
        const chargeLevel = this.electrons / this.maxElectrons;

        // لون الكرة يتغير حسب الشحنة
        const hue = 200 + chargeLevel * 60; // من الأزرق إلى الأحمر
        this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        this.ctx.beginPath();
        this.ctx.arc(ballX, ballY, 40, 0, Math.PI * 2);
        this.ctx.fill();

        // ظل الكرة
        this.ctx.shadowColor = `hsl(${hue}, 70%, 50%)`;
        this.ctx.shadowBlur = 20 * chargeLevel;
        this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        this.ctx.beginPath();
        this.ctx.arc(ballX, ballY, 40, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // رسم الإلكترونات حول الكرة
        for (let i = 0; i < this.electrons; i++) {
            const angle = (i / this.maxElectrons) * Math.PI * 2 + Date.now() / 1000;
            const radius = 60 + Math.sin(i) * 10;
            const ex = ballX + Math.cos(angle) * radius;
            const ey = ballY + Math.sin(angle) * radius;

            this.ctx.fillStyle = '#e74c3c';
            this.ctx.beginPath();
            this.ctx.arc(ex, ey, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // رسم جزيئات الاحتكاك
        this.particles.forEach(p => {
            this.ctx.fillStyle = `rgba(230, 126, 34, ${p.life})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // النص التوضيحي
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        if (this.electrons === 0) {
            this.ctx.fillText('ابدأ الدلك!', ballX, ballY);
        } else {
            this.ctx.fillText(`مكهرب ⚡`, ballX, ballY);
        }
    }

    reset() {
        this.electrons = 0;
        this.particles = [];
    }

    getCharge() {
        if (this.electrons === 0) return 'محايد';
        if (this.electrons < 30) return 'مكهرب قليلاً 🔋';
        if (this.electrons < 70) return 'مكهرب ⚡';
        return 'مكهرب جداً ⚡⚡⚡';
    }

    getElectrons() {
        return this.electrons;
    }
}

// ===== طريقة اللمس (Contact) =====
class ContactSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.ball1Charge = 0;
        this.ball2Charge = 0;
        this.isCharging = false;
        this.isTouching = false;
        this.particles = [];
    }

    charge() {
        this.ball1Charge = 80;
        this.isCharging = true;
    }

    touch() {
        if (this.ball1Charge > 0 && !this.isTouching) {
            this.isTouching = true;
            // توزيع الشحنة بالتساوي
            const total = this.ball1Charge + this.ball2Charge;
            this.ball1Charge = total / 2;
            this.ball2Charge = total / 2;

            // إنشاء جزيئات عند اللمس
            for (let i = 0; i < 20; i++) {
                this.particles.push({
                    x: this.canvas.width / 2,
                    y: this.canvas.height / 2,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 1
                });
            }

            setTimeout(() => this.isTouching = false, 1000);
        }
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= 0.02;
            return p.life > 0;
        });
    }

    draw() {
        // مسح
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const ball1X = this.canvas.width / 3;
        const ball1Y = this.canvas.height / 2;
        const ball2X = (this.canvas.width * 2) / 3;
        const ball2Y = this.canvas.height / 2;

        this.drawBall(ball1X, ball1Y, this.ball1Charge, '1');
        this.drawBall(ball2X, ball2Y, this.ball2Charge, '2');

        // سهم
        this.ctx.strokeStyle = '#999';
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(ball1X + 50, ball1Y);
        this.ctx.lineTo(ball2X - 50, ball2Y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // جزيئات
        this.particles.forEach(p => {
            this.ctx.fillStyle = `rgba(230, 126, 34, ${p.life})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawBall(x, y, charge, label) {
        const hue = 200 + (charge / 80) * 60;
        this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 40, 0, Math.PI * 2);
        this.ctx.fill();

        // الإلكترونات
        for (let i = 0; i < charge / 80 * 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const radius = 55;
            const ex = x + Math.cos(angle) * radius;
            const ey = y + Math.sin(angle) * radius;
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.beginPath();
            this.ctx.arc(ex, ey, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // التسمية
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, x, y - 60);
    }

    reset() {
        this.ball1Charge = 0;
        this.ball2Charge = 0;
        this.particles = [];
    }

    getCharge1() {
        if (this.ball1Charge === 0) return 'محايد';
        return this.ball1Charge > 40 ? 'مكهرب ⚡' : 'مكهرب قليلاً 🔋';
    }

    getCharge2() {
        if (this.ball2Charge === 0) return 'محايد';
        return this.ball2Charge > 40 ? 'مكهرب ⚡' : 'مكهرب قليلاً 🔋';
    }
}

// ===== طريقة التأثير (Induction) =====
class InductionSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chargedBallX = 100;
        this.chargedBallCharge = 0;
        this.neutralBallX = this.canvas.width - 100;
        this.distance = this.canvas.width - 200;
        this.isDragging = false;

        this.canvas.addEventListener('mousedown', () => this.isDragging = true);
        this.canvas.addEventListener('mouseup', () => this.isDragging = false);
        this.canvas.addEventListener('touchstart', () => this.isDragging = true);
        this.canvas.addEventListener('touchend', () => this.isDragging = false);
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleMove(e));
    }

    handleMove(e) {
        if (!this.isDragging || this.chargedBallCharge === 0) return;

        const rect = this.canvas.getBoundingClientRect();
        this.chargedBallX = (e.clientX || e.touches[0].clientX) - rect.left;
        this.distance = Math.abs(this.neutralBallX - this.chargedBallX);
    }

    charge() {
        this.chargedBallCharge = 80;
    }

    draw() {
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const ballY = this.canvas.height / 2;

        // المجال الكهربائي
        if (this.chargedBallCharge > 0) {
            this.drawElectricField(this.chargedBallX, ballY);
        }

        // الكرة المكهربة
        if (this.chargedBallCharge > 0) {
            this.drawChargedBall(this.chargedBallX, ballY);
        }

        // الكرة المحايدة
        const inducedCharge = this.chargedBallCharge > 0 && this.distance < 200 ? 
                             50 * (1 - this.distance / 200) : 0;
        this.drawNeutralBall(this.neutralBallX, ballY, inducedCharge);

        // النص
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('مكهربة', this.chargedBallX, ballY - 70);
        this.ctx.fillText('محايدة', this.neutralBallX, ballY - 70);
    }

    drawElectricField(x, y) {
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.2)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const length = Math.min(this.distance / 2, 150);
            this.ctx.beginPath();
            this.ctx.moveTo(x + Math.cos(angle) * 50, y + Math.sin(angle) * 50);
            this.ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            this.ctx.stroke();
        }
    }

    drawChargedBall(x, y) {
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 40, 0, Math.PI * 2);
        this.ctx.fill();

        // إلكترونات
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            const radius = 55;
            const ex = x + Math.cos(angle) * radius;
            const ey = y + Math.sin(angle) * radius;
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(ex, ey, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawNeutralBall(x, y, induced) {
        const hue = induced > 0 ? 200 + induced / 50 * 60 : 200;
        this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 40, 0, Math.PI * 2);
        this.ctx.fill();

        if (induced > 0) {
            // تفريغ الشحنات المحفز
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.beginPath();
            this.ctx.arc(x - 20, y, 5, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#3498db';
            this.ctx.beginPath();
            this.ctx.arc(x + 20, y, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    reset() {
        this.chargedBallCharge = 0;
        this.distance = this.canvas.width - 200;
        this.chargedBallX = 100;
    }

    getDistance() {
        if (this.chargedBallCharge === 0) return 'بعيدة';
        if (this.distance > 150) return 'بعيدة';
        if (this.distance > 100) return 'متوسطة';
        return 'قريبة جداً';
    }

    getNeutralStatus() {
        if (this.chargedBallCharge === 0) return 'محايد';
        if (this.distance < 200) return 'متأثر بالمجال ⚡';
        return 'محايد';
    }
}

// ===== تهيئة المحاكيات =====
let frictionSim, contactSim, inductionSim;

window.addEventListener('DOMContentLoaded', () => {
    // إنشاء المحاكيات
    frictionSim = new FrictionSimulation('frictionCanvas');
    contactSim = new ContactSimulation('contactCanvas');
    inductionSim = new InductionSimulation('inductionCanvas');

    // حلقة الرسم
    function animate() {
        frictionSim.update();
        frictionSim.draw();
        updateFrictionInfo();

        contactSim.update();
        contactSim.draw();
        updateContactInfo();

        inductionSim.draw();
        updateInductionInfo();

        requestAnimationFrame(animate);
    }
    animate();

    // أزرار الطرق
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.method-section').forEach(s => s.classList.remove('active'));
            
            btn.classList.add('active');
            const methodId = btn.dataset.method + '-section';
            document.getElementById(methodId).classList.add('active');
        });
    });

    // أزرار الدلك
    document.getElementById('frictionReset').addEventListener('click', () => {
        frictionSim.reset();
    });

    // أزرار اللمس
    document.getElementById('contactCharge').addEventListener('click', () => {
        contactSim.charge();
        document.getElementById('contactTouch').disabled = false;
    });

    document.getElementById('contactTouch').addEventListener('click', () => {
        contactSim.touch();
    });

    document.getElementById('contactReset').addEventListener('click', () => {
        contactSim.reset();
        document.getElementById('contactTouch').disabled = true;
    });

    // أزرار التأثير
    document.getElementById('inductionCharge').addEventListener('click', () => {
        inductionSim.charge();
    });

    document.getElementById('inductionReset').addEventListener('click', () => {
        inductionSim.reset();
    });
});

function updateFrictionInfo() {
    document.getElementById('frictionElectrons').textContent = frictionSim.getElectrons();
    document.getElementById('frictionCharge').textContent = frictionSim.getCharge();
}

function updateContactInfo() {
    document.getElementById('contactBall1').textContent = contactSim.getCharge1();
    document.getElementById('contactBall2').textContent = contactSim.getCharge2();
}

function updateInductionInfo() {
    document.getElementById('inductionDistance').textContent = inductionSim.getDistance();
    document.getElementById('inductionNeutral').textContent = inductionSim.getNeutralStatus();
}