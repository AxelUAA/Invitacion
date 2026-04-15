// assets/app.js

const playBtn = document.getElementById('playBtn');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const audioEl = document.getElementById('partySound');

let audioCtx;
let analyser;
let source;
let isPlaying = false;

// Variables de audio que no deberian re-crearse cada cuadro (Optimización)
let dataArray;
let bufferLength;

// Ajustar tamaño del canvas a la ventana
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ============================================
// VISUALIZADOR DE AUDIO AVANZADO (CANVAS)
// ============================================

// Partículas reactivas
let particles = [];
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 4 + 1;
        this.color = `hsl(${Math.random() * 25 + 35}, 100%, 55%)`; // Oro/Arenoso
    }

    update(audioLoudness) {
        // La música las hace flotar más rápido
        this.y -= (1 + audioLoudness * 0.05);
        if (this.y < 0) {
            this.y = canvas.height;
            this.x = Math.random() * canvas.width;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }
}

for (let i = 0; i < 150; i++) {
    particles.push(new Particle());
}

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);

    let average = 0;

    if (analyser && dataArray && isPlaying) {
        analyser.getByteFrequencyData(dataArray); // Obtener frecuencias en tiempo real

        // Loudness para las partículas
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        average = sum / bufferLength;
    }

    // Efecto trailing (deja una estela semi transparente)
    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Barras Neon musicales
    if (bufferLength) {
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray && isPlaying) ? (dataArray[i] * 1.5) : 10; // 10 de alto en reposo

            // Mapeo dinámico de colores reactivo al audio (Tono Oro Egipcio)
            const r = 255;
            const g = 170 + (barHeight * 0.4); // Fluctúa entre dorado oscuro a amarillo brillante
            const b = 50;

            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }

    // Dibujar partículas
    particles.forEach(p => {
        p.update(average);
        p.draw();
    });
}


// ============================================
// CONTROLADOR DE AUDIO Y AUTOPLAY
// ============================================

function startParty() {
    // Inicializar audio contexto si no existe
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;

        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        // Conectar la canción al analizador visual
        source = audioCtx.createMediaElementSource(audioEl);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
    }

    // Si el navegador suspendió el estado de audio, lo reanudamos (muy normal por seguridad)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    if (audioEl.paused) {
        audioEl.play().then(() => {
            if (!isPlaying) {
                isPlaying = true;
                playBtn.classList.add('active');
            }
        }).catch(err => {
            console.warn("Autoplay bloqueado por el navegador. Esperando click del usuario:", err);
        });
    }
}

// Iniciar las animaciones inmediatamente
drawVisualizer();

// Intentar reproducir de forma automática al cargar
window.addEventListener('load', () => {
    startParty();
});

// Cuando el usuario hace click, aseguramos la música y disparamos el SweetAlert
playBtn.addEventListener('click', () => {
    // startParty valida si está pausado y si hay contexto de audio bloqueado
    startParty();

    // Mostrar Alerta interactiva de confirmación
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: '¡Reserva Confirmada!',
            text: '¡Nos vemos en la Casa de Maldo! ',
            icon: 'success',
            confirmButtonText: '¡Ahí estaré!',
            background: '#0c0904',
            color: '#FFF8E7',
            confirmButtonColor: '#FFD700',
            iconColor: '#FFD700'
        });
    } else {
        alert("¡Nos vemos en la Casa de Maldo!");
    }
});
