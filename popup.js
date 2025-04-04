class StopwatchCounterPro {
    constructor() {
        this.stopwatchTime = 0;
        this.stopwatchRunning = false;
        this.counters = new Map();
        this.startTime = null;
        this.chart = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadData();
        this.setupChart();
    }

    initializeElements() {
        this.stopwatchDisplay = document.getElementById('stopwatch');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.counterNameInput = document.getElementById('counterName');
        this.addCounterBtn = document.getElementById('addCounter');
        this.countersList = document.getElementById('countersList');
        this.chartTypeSelect = document.getElementById('chartType');
        this.saveSessionBtn = document.getElementById('saveSession');
        this.loadSessionBtn = document.getElementById('loadSession');
        this.exportDataBtn = document.getElementById('exportData');
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.startStopwatch());
        this.stopBtn.addEventListener('click', () => this.stopStopwatch());
        this.resetBtn.addEventListener('click', () => this.resetStopwatch());
        this.addCounterBtn.addEventListener('click', () => this.addCounter());
        this.chartTypeSelect.addEventListener('change', () => this.updateChart());
        this.saveSessionBtn.addEventListener('click', () => this.saveSession());
        this.loadSessionBtn.addEventListener('click', () => this.loadSessionHistory());
        this.exportDataBtn.addEventListener('click', () => this.exportData());
    }

    startStopwatch() {
        if (!this.stopwatchRunning) {
            this.stopwatchRunning = true;
            this.startTime = Date.now() - this.stopwatchTime;
            this.updateStopwatch();
        }
    }

    stopStopwatch() {
        this.stopwatchRunning = false;
    }

    resetStopwatch() {
        this.stopwatchRunning = false;
        this.stopwatchTime = 0;
        this.updateStopwatchDisplay();
    }

    updateStopwatch() {
        if (this.stopwatchRunning) {
            this.stopwatchTime = Date.now() - this.startTime;
            this.updateStopwatchDisplay();
            requestAnimationFrame(() => this.updateStopwatch());
        }
    }

    updateStopwatchDisplay() {
        const ms = this.stopwatchTime % 1000;
        const s = Math.floor(this.stopwatchTime / 1000) % 60;
        const m = Math.floor(this.stopwatchTime / (1000 * 60)) % 60;
        const h = Math.floor(this.stopwatchTime / (1000 * 60 * 60));
        
        this.stopwatchDisplay.textContent = 
            `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }

    addCounter() {
        const name = this.counterNameInput.value.trim();
        if (name && !this.counters.has(name)) {
            this.counters.set(name, 0);
            this.renderCounter(name);
            this.counterNameInput.value = '';
            this.updateChart();
        }
    }

    renderCounter(name) {
        const counterDiv = document.createElement('div');
        counterDiv.className = 'counter-item';
        counterDiv.innerHTML = `
            <span>${name}: <span class="counter-value">${this.counters.get(name)}</span></span>
            <div class="counter-controls">
                <button class="increment">+</button>
                <button class="decrement">-</button>
                <button class="delete">🗑️</button>
            </div>
        `;

        counterDiv.querySelector('.increment').addEventListener('click', () => {
            this.counters.set(name, this.counters.get(name) + 1);
            counterDiv.querySelector('.counter-value').textContent = this.counters.get(name);
            this.updateChart();
        });

        counterDiv.querySelector('.decrement').addEventListener('click', () => {
            this.counters.set(name, Math.max(0, this.counters.get(name) - 1));
            counterDiv.querySelector('.counter-value').textContent = this.counters.get(name);
            this.updateChart();
        });

        counterDiv.querySelector('.delete').addEventListener('click', () => {
            this.counters.delete(name);
            counterDiv.remove();
            this.updateChart();
        });

        this.countersList.appendChild(counterDiv);
    }

    setupChart() {
        const ctx = document.getElementById('dataChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: this.chartTypeSelect.value,
            data: {
                labels: [],
                datasets: [{
                    label: 'Counter Values',
                    data: [],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    updateChart() {
        const labels = Array.from(this.counters.keys());
        const data = Array.from(this.counters.values());

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.config.type = this.chartTypeSelect.value;
        this.chart.update();
    }

    saveSession() {
        const session = {
            timestamp: Date.now(),
            stopwatchTime: this.stopwatchTime,
            counters: Object.fromEntries(this.counters)
        };

        chrome.storage.local.get(['sessions'], (result) => {
            const sessions = result.sessions || [];
            sessions.push(session);
            chrome.storage.local.set({ sessions });
        });
    }

    loadSessionHistory() {
        chrome.storage.local.get(['sessions'], (result) => {
            const sessions = result.sessions || [];
            // Implementation for displaying session history
            console.log(sessions);
        });
    }

    exportData() {
        const data = Array.from(this.counters.entries())
            .map(([name, value]) => `${name},${value}`)
            .join('\n');
        
        const blob = new Blob([`Counter Name,Value\n${data}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stopwatch-counter-data.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    loadData() {
        chrome.storage.local.get(['stopwatchTime', 'counters'], (result) => {
            if (result.stopwatchTime) {
                this.stopwatchTime = result.stopwatchTime;
                this.updateStopwatchDisplay();
            }
            if (result.counters) {
                this.counters = new Map(Object.entries(result.counters));
                this.counters.forEach((_, name) => this.renderCounter(name));
                this.updateChart();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new StopwatchCounterPro();
});