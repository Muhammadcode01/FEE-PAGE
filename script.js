/**
 * VitalSwap Fee Page Application Script
 * Author: World-Class Developer (Hackathon Submission)
 * Date: 29 October 2025
 * Description: Handles all interactive elements for the VitalSwap fee page,
 * including a real-time swap calculator, animated tabs, and a live FX rate chart.
 */

// Encapsulate all logic in an App object to avoid polluting the global scope
const App = {
    // --- CONFIGURATION ---
    config: {
        feePercentage: 0.0025, // 0.25%
        exchangeRates: {
            'USD': { 'EUR': 0.9215, 'GBP': 0.7950, 'NGN': 1455.00, 'USD': 1 },
            'EUR': { 'USD': 1.0852, 'GBP': 0.8628, 'NGN': 1579.50, 'EUR': 1 },
            'GBP': { 'USD': 1.2579, 'EUR': 1.1590, 'NGN': 1829.80, 'GBP': 1 },
            'NGN': { 'USD': 0.00068, 'EUR': 0.00063, 'GBP': 0.00054, 'NGN': 1 }
        }
    },

    // --- DOM ELEMENTS ---
    elements: {
        sendAmount: document.getElementById('send-amount'),
        sendCurrency: document.getElementById('send-currency'),
        receiveAmount: document.getElementById('receive-amount'),
        receiveCurrency: document.getElementById('receive-currency'),
        feeDisplay: document.getElementById('fee-display'),
        rateDisplay: document.getElementById('rate-display'),
        swapBtn: document.getElementById('swap-currencies-btn'),
        tabs: document.querySelectorAll('.tab-link'),
        tabContents: document.querySelectorAll('.tab-content'),
        chartCanvas: document.getElementById('fxRateChart')
    },

    // --- INITIALIZATION ---
    init() {
        if (!this.elements.sendAmount || !this.elements.chartCanvas) {
            console.error("Essential DOM elements not found. App initialization aborted.");
            return;
        }
        this.initCalculator();
        this.initTabs();
        this.initChart();
    },

    // --- CALCULATOR MODULE ---
    initCalculator() {
        const els = this.elements;
        ['input', 'change'].forEach(event => {
            els.sendAmount.addEventListener(event, () => this.calculateSwap());
            els.sendCurrency.addEventListener(event, () => this.calculateSwap());
            els.receiveCurrency.addEventListener(event, () => this.calculateSwap());
        });
        els.swapBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.swapCurrencies();
        });
        this.calculateSwap();
    },

    calculateSwap() {
        const els = this.elements;
        const sendAmount = parseFloat(els.sendAmount.value.replace(/,/g, '')) || 0;
        const sendCurrency = els.sendCurrency.value;
        const receiveCurrency = els.receiveCurrency.value;

        const rate = this.config.exchangeRates[sendCurrency][receiveCurrency];
        const fee = sendAmount * this.config.feePercentage;
        const amountAfterFee = sendAmount - fee;
        const receiveAmount = amountAfterFee * rate;

        const feeFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: sendCurrency });
        
        els.feeDisplay.textContent = `${feeFormatter.format(fee)} (${this.config.feePercentage * 100}%)`;
        els.rateDisplay.textContent = `1 ${sendCurrency} = ${rate.toFixed(4)} ${receiveCurrency}`;
        els.receiveAmount.value = receiveAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        this.flashElement(els.receiveAmount);
    },

    swapCurrencies() {
        const els = this.elements;
        const tempCurrency = els.sendCurrency.value;
        els.sendCurrency.value = els.receiveCurrency.value;
        els.receiveCurrency.value = tempCurrency;
        this.calculateSwap();
    },



    flashElement(el) {
        el.classList.add('value-updated');
        setTimeout(() => el.classList.remove('value-updated'), 500);
    },

    // --- TABS MODULE ---
    initTabs() {
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.getAttribute('aria-controls');
                const targetContent = document.getElementById(targetId);

                this.elements.tabs.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                this.elements.tabContents.forEach(tc => tc.classList.remove('active'));
                
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    },

    // --- CHART MODULE ---
    initChart() {
        const ctx = this.elements.chartCanvas.getContext('2d');
        
        const labels = ['-6d', '-5d', '-4d', '-3d', '-2d', 'Yesterday', 'Today'];
        const chartData = {
            labels: labels,
            datasets: [{
                label: 'USD to EUR Exchange Rate',
                data: [0.915, 0.918, 0.917, 0.921, 0.919, 0.922, 0.920],
                fill: true,
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                borderColor: '#FFC107',
                tension: 0.4,
                pointBackgroundColor: '#FFC107',
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        };

        const chartConfig = {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#0A2540',
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 12 },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                    },
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            drawBorder: false,
                        },
                        ticks: {
                            callback: function(value) {
                                return '€' + value.toFixed(3);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
            }
        };

        new Chart(ctx, chartConfig);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());