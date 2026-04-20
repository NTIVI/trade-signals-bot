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
const analysisSteps = document.getElementById('analysis-steps');

let analysisInterval = null;
let currentAsset = null;
let isShowingSignal = false;
let isAnalyzing = false;

const ASSET_MAP = {
    'Bitcoin': 'BTCUSD',
    'Ethereum': 'ETHUSD',
    'Litecoin': 'LTCUSD',
    'Solana': 'SOLUSD',
    'Ripple': 'XRPUSD',
    'Cardano': 'ADAUSD'
};

const STEPS = [
    'Подключение к серверу аналитики...',
    'Сбор котировок в реальном времени...',
    'Вычисление индикаторов (RSI, SMA)...',
    'Фильтрация рыночного шума...',
    'Генерация высокоточного сигнала...'
];

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
    isAnalyzing = false;
    signalContainer.classList.add('hidden');
    statusText.innerText = `Анализ: ${currentAsset}`;
    waitingScreen.classList.remove('hidden');
    analysisSteps.innerHTML = '';
    
    // Clear previous interval if any
    if (analysisInterval) {
        clearInterval(analysisInterval);
    }

    // Start 10-second interval for real analysis
    analysisInterval = setInterval(() => {
        analyzeMarket();
    }, 10000);
    
    // Initial analysis
    analyzeMarket();
}

async function updateStepsUI(stepIndex) {
    const step = document.createElement('div');
    step.className = 'step-item active';
    step.innerHTML = `<span class="step-dot"></span><span>${STEPS[stepIndex]}</span>`;
    analysisSteps.appendChild(step);
    
    // Auto scroll to bottom
    analysisSteps.scrollTop = analysisSteps.scrollHeight;
    
    return new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
}

async function analyzeMarket() {
    if (isShowingSignal || isAnalyzing) return;
    isAnalyzing = true;
    
    analysisSteps.innerHTML = '';
    const symbol = ASSET_MAP[currentAsset];
    
    try {
        await updateStepsUI(0);
        await updateStepsUI(1);
        
        // Fetch real signal from our API
        const response = await fetch(`/api/latest-signal?asset=${symbol}`);
        const data = await response.json();
        
        await updateStepsUI(2);
        await updateStepsUI(3);
        await updateStepsUI(4);
        
        if (data && data.signal) {
            // We have a real signal!
            showSignal(data.signal.direction, data.signal.confidence);
        } else {
            // Если сигнала нет, просто сбрасываем состояние и ждем следующего цикла
            // Бот будет молчать, пока не появится реальный сигнал
            waitingScreen.classList.remove('hidden');
            analysisSteps.innerHTML = '';
            statusText.innerText = `Ожидание идеального сигнала: ${currentAsset}...`;
        }

    } catch (error) {
        console.error('Analysis failed:', error);
    } finally {
        isAnalyzing = false;
    }
}

function showSignal(direction, confidence) {
    isShowingSignal = true;

    if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }

    waitingScreen.classList.add('hidden');
    signalContainer.classList.remove('hidden');

    let signalText = '';

    if (direction === 'UP') {
        signalText = `🔼 ВВЕРХ на 1 минуту — ${confidence}%`;
        signalContainer.classList.add('signal-up');
        signalContainer.classList.remove('signal-down');
        signalDirection.className = 'signal-up';
        signalDirection.innerText = signalText;
    } else {
        signalText = `🔽 ВНИЗ на 1 минуту — ${confidence}%`;
        signalContainer.classList.add('signal-down');
        signalContainer.classList.remove('signal-up');
        signalDirection.className = 'signal-down';
        signalDirection.innerText = signalText;
    }
    
    // Скрываем вторую строку с деталями, чтобы текст был крупным и сфокусированным
    signalDetails.style.display = 'none';

    sendSignalToBot(signalText);

    setTimeout(() => {
        signalContainer.classList.add('hidden');
        signalContainer.classList.remove('signal-up', 'signal-down');
        waitingScreen.classList.remove('hidden');
        analysisSteps.innerHTML = '';
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
