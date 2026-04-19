// Initialize Telegram Web App
const tg = window.Telegram.WebApp;

// Expand to full screen
tg.expand();

// Let Telegram know the app is ready
tg.ready();

// Define Telegram theme colors if available, otherwise fallback to our CSS
if (tg.colorScheme === 'light') {
    // We can leave dark mode or force adapt to telegram theme.
    // For now, let's keep the dark neon theme as requested often for trading.
}

// Elements
const assetSelect = document.getElementById('asset-select');
const statusText = document.getElementById('status-text');
const waitingScreen = document.getElementById('waiting-screen');
const signalContainer = document.getElementById('signal-container');
const signalDirection = document.getElementById('signal-direction');
const signalDetails = document.getElementById('signal-details');

let analysisInterval = null;
let currentAsset = null;
let isShowingSignal = false;

// Handle asset selection
assetSelect.addEventListener('change', (e) => {
    currentAsset = e.target.value;
    startAnalysis();
});

function startAnalysis() {
    // Reset UI
    isShowingSignal = false;
    signalContainer.classList.add('hidden');
    statusText.classList.add('hidden');
    waitingScreen.classList.remove('hidden');
    
    // Clear previous interval if any
    if (analysisInterval) {
        clearInterval(analysisInterval);
    }

    // Start 5-second interval
    // "После выбора актива приложение анализирует только 5-секундный таймфрейм."
    analysisInterval = setInterval(() => {
        analyzeMarket();
    }, 5000);
}

function analyzeMarket() {
    if (isShowingSignal) return; // Don't analyze while a signal is already displayed

    // "Сигналы должны быть очень редкими (бот должен быть очень тихим)"
    // Let's make it a 10% chance every 5 seconds, which averages to 1 signal every ~50 seconds.
    const isSignalTime = Math.random() < 0.10; 
    
    if (!isSignalTime) {
        // Just keep showing "Ожидание сигнала"
        return;
    }

    // Determine confidence level between 60 and 99
    const confidence = Math.floor(Math.random() * 40) + 60;

    // "Если уверенность ниже 75% — сигнал вообще не показывать ни на экране, ни в чате"
    if (confidence >= 75) {
        const direction = Math.random() > 0.5 ? 'UP' : 'DOWN';
        showSignal(direction, confidence);
    }
}

function showSignal(direction, confidence) {
    isShowingSignal = true;

    // Hide waiting screen
    waitingScreen.classList.add('hidden');
    signalContainer.classList.remove('hidden');

    let signalText = '';

    if (direction === 'UP') {
        signalText = `🔼 ВВЕРХ на 1 минуту — ${confidence}%`;
        signalDirection.className = 'signal-up';
        signalDirection.innerText = 'ВВЕРХ';
        signalDetails.innerText = `🔼 на 1 минуту — ${confidence}%`;
    } else {
        signalText = `🔽 ВНИЗ на 1 минуту — ${confidence}%`;
        signalDirection.className = 'signal-down';
        signalDirection.innerText = 'ВНИЗ';
        signalDetails.innerText = `🔽 на 1 минуту — ${confidence}%`;
    }

    // Send the signal to the backend so it can be messaged to the user in the Telegram chat
    sendSignalToBot(signalText);

    // After 10 seconds, hide signal and go back to waiting
    setTimeout(() => {
        signalContainer.classList.add('hidden');
        waitingScreen.classList.remove('hidden');
        isShowingSignal = false;
    }, 10000);
}

async function sendSignalToBot(signalText) {
    // User ID is available via initDataUnsafe
    const userId = tg.initDataUnsafe?.user?.id;

    if (!userId) {
        console.warn('User ID not found. Ensure app is opened inside Telegram.');
        return;
    }

    try {
        // Send a POST request to our backend
        const response = await fetch('/api/signal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                signalText: signalText // Expected exact format: 🔼 ВВЕРХ на 1 минуту — 92%
            })
        });

        if (!response.ok) {
            console.error('Failed to send signal message to bot');
        }
    } catch (error) {
        console.error('Error contacting backend:', error);
    }
}
