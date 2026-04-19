// Initialize Telegram Web App
const tg = window.Telegram.WebApp;

// Expand to full screen
tg.expand();

// Let Telegram know the app is ready
tg.ready();

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
    
    // Haptic feedback for selection
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
    
    startAnalysis();
});

function startAnalysis() {
    // Reset UI
    isShowingSignal = false;
    signalContainer.classList.add('hidden');
    statusText.innerText = `Анализ: ${currentAsset}`;
    waitingScreen.classList.remove('hidden');
    
    // Clear previous interval if any
    if (analysisInterval) {
        clearInterval(analysisInterval);
    }

    // Start 5-second interval
    analysisInterval = setInterval(() => {
        analyzeMarket();
    }, 5000);
}

function analyzeMarket() {
    if (isShowingSignal) return;

    // Simulate analysis with rare signals (7% chance)
    const isSignalTime = Math.random() < 0.07; 
    
    if (!isSignalTime) return;

    // Determine confidence level between 95 and 99
    const confidence = Math.floor(Math.random() * 5) + 95;

    // Show signal only if confidence >= 95%
    if (confidence >= 95) {
        const direction = Math.random() > 0.5 ? 'UP' : 'DOWN';
        showSignal(direction, confidence);
    }
}

function showSignal(direction, confidence) {
    isShowingSignal = true;

    // Haptic feedback for signal
    if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }

    // Hide waiting screen
    waitingScreen.classList.add('hidden');
    signalContainer.classList.remove('hidden');

    let signalText = '';

    if (direction === 'UP') {
        signalText = `🔼 ВВЕРХ на 1 минуту — ${confidence}%`;
        signalContainer.classList.add('signal-up');
        signalContainer.classList.remove('signal-down');
        signalDirection.className = 'signal-up';
        signalDirection.innerText = 'ВВЕРХ';
        signalDetails.innerText = `🔼 на 1 минуту — ${confidence}%`;
    } else {
        signalText = `🔽 ВНИЗ на 1 минуту — ${confidence}%`;
        signalContainer.classList.add('signal-down');
        signalContainer.classList.remove('signal-up');
        signalDirection.className = 'signal-down';
        signalDirection.innerText = 'ВНИЗ';
        signalDetails.innerText = `🔽 на 1 минуту — ${confidence}%`;
    }

    // Send the signal to the backend
    sendSignalToBot(signalText);

    // After 15 seconds, hide signal and go back to waiting
    setTimeout(() => {
        signalContainer.classList.add('hidden');
        signalContainer.classList.remove('signal-up', 'signal-down');
        waitingScreen.classList.remove('hidden');
        isShowingSignal = false;
    }, 15000);
}

async function sendSignalToBot(signalText) {
    const userId = tg.initDataUnsafe?.user?.id;

    if (!userId) {
        console.warn('User ID not found.');
        return;
    }

    try {
        await fetch('/api/signal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                signalText: signalText
            })
        });
    } catch (error) {
        console.error('Error contacting backend:', error);
    }
}
