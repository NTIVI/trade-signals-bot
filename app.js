const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Elements
const powerBtn = document.getElementById('power-btn');
const scanner = document.getElementById('scanner');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const assetSelect = document.getElementById('asset-select');
const logContainer = document.getElementById('log-container');
const signalDisplay = document.getElementById('signal-display');
const directionText = document.getElementById('direction-text');
const signalIcon = document.getElementById('signal-icon');
const confidenceFill = document.getElementById('confidence-fill');
const confidenceText = document.getElementById('confidence-text');
const closeSignalBtn = document.getElementById('close-signal');

let isActive = false;
const TOPIC_CONTROL = 'ntivistudio_control_v1';
const TOPIC_SIGNALS = 'ntivistudio_signals_v1';

// Audio Context for Alarm
let audioCtx = null;
let alarmOsc = null;

function addLog(msg) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const time = new Date().toLocaleTimeString();
    entry.innerText = `[${time}] ${msg}`;
    logContainer.prepend(entry);
}

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playAlarm() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    alarmOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    alarmOsc.type = 'triangle';
    alarmOsc.frequency.setValueAtTime(880, audioCtx.currentTime);
    alarmOsc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    alarmOsc.connect(gain);
    gain.connect(audioCtx.destination);
    
    alarmOsc.start();
    alarmOsc.stop(audioCtx.currentTime + 0.5);
}

// Power Toggle
powerBtn.addEventListener('click', () => {
    isActive = !isActive;
    
    if (isActive) {
        powerBtn.classList.add('active');
        scanner.classList.add('scanner-active');
        statusDot.classList.add('active');
        statusText.innerText = 'АГЕНТ АКТИВЕН';
        powerBtn.querySelector('span').innerText = 'ВЫКЛЮЧИТЬ';
        addLog(`Запуск анализа: ${assetSelect.value}`);
        tg.HapticFeedback.notificationOccurred('success');
        sendControlMessage('START', assetSelect.value);
    } else {
        powerBtn.classList.remove('active');
        scanner.classList.remove('scanner-active');
        statusDot.classList.remove('active');
        statusText.innerText = 'АГЕНТ ВЫКЛЮЧЕН';
        powerBtn.querySelector('span').innerText = 'ВКЛЮЧИТЬ';
        addLog('Агент остановлен');
        tg.HapticFeedback.impactOccurred('medium');
        sendControlMessage('STOP', '');
    }
});

// Send message to local agent via ntfy
async function sendControlMessage(action, asset) {
    try {
        await fetch(`https://ntfy.sh/${TOPIC_CONTROL}`, {
            method: 'POST',
            body: JSON.stringify({ action, asset, userId: tg.initDataUnsafe?.user?.id })
        });
    } catch (e) {
        console.error('Ntfy error:', e);
    }
}

// Listen for signals and heartbeats from local agent
function listenForSignals() {
    const eventSource = new EventSource(`https://ntfy.sh/${TOPIC_SIGNALS}/sse`);
    
    // UI Elements for Vision
    const rsiFill = document.getElementById('rsi-fill');
    const rsiVal = document.getElementById('rsi-val');
    const candleInd = document.getElementById('candle-indicator');
    const candleVal = document.getElementById('candle-val');

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.message) {
            try {
                const msg = JSON.parse(data.message);
                
                if (msg.action === 'HEARTBEAT' && isActive) {
                    // Update RSI
                    rsiFill.style.width = `${msg.rsi}%`;
                    rsiVal.innerText = msg.rsi;
                    
                    // Update Candle
                    candleInd.className = `candle-indicator ${msg.candle}`;
                    candleVal.innerText = msg.candle;
                    candleVal.style.color = msg.candle === 'GREEN' ? 'var(--accent-green)' : (msg.candle === 'RED' ? 'var(--accent-red)' : 'var(--text-secondary)');
                } else if (msg.action === 'SIGNAL' && isActive) {
                    showSignal(msg);
                }
            } catch (e) {}
        }
    };
}

function showSignal(signal) {
    directionText.innerText = signal.direction === 'UP' ? 'ВВЕРХ' : 'ВНИЗ';
    directionText.className = `direction-text ${signal.direction === 'UP' ? 'direction-up' : 'direction-down'}`;
    signalIcon.innerText = signal.direction === 'UP' ? '🔼' : '🔽';
    confidenceText.innerText = `ТОЧНОСТЬ: ${signal.confidence}%`;
    confidenceFill.style.width = `${signal.confidence}%`;
    
    signalDisplay.classList.remove('hidden');
    playAlarm();
    tg.HapticFeedback.notificationOccurred('warning');
}

closeSignalBtn.addEventListener('click', () => {
    signalDisplay.classList.add('hidden');
});

// Start listening on load
listenForSignals();
addLog('Система NTIVISTUDIO инициализирована');
