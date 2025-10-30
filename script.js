/**
 * VitalSwap Fee Page Application Script
 * Author: World-Class Developer (Hackathon Submission)
 * Date: 30 October 2025
 * Description: Handles all interactive elements for the VitalSwap fee page
 * AI-Assisted Integration: exchange rate data
 */

const App = {
    // Configuration
    config: {
        feePercentage: 0.0025,
        exchangeRates: {
            'USD': { 'EUR': 0.9215, 'GBP': 0.7950, 'NGN': 1480, 'USD': 1 },
            'EUR': { 'USD': 1.0852, 'GBP': 0.8628, 'NGN': 1579.50, 'EUR': 1 },
            'GBP': { 'USD': 1.2579, 'EUR': 1.1590, 'NGN': 1829.80, 'GBP': 1 },
            'NGN': { 'USD': 0.00068, 'EUR': 0.00063, 'GBP': 0.00054, 'NGN': 1 }
        },
        apiEndpoints: {
            fees: 'https://2kbbumlxz3.execute-api.us-east-1.amazonaws.com/default/fee',
            exchange: 'https://2kbbumlxz3.execute-api.us-east-1.amazonaws.com/default/exchange'
        }
    },

    // Initialize the application
    async init() {
        console.log('Initializing VitalSwap App...');
        
        // Initialize elements first
        this.initializeElements();
        
        // Set default currencies - NGN as receive currency
        this.setDefaultCurrencies();
        
        // Show loading state
        this.showLoading(true);
        
        try {
            // Try to load real data
            await this.loadRealTimeData();
        } catch (error) {
            console.warn('Using fallback data:', error);
            this.showError('Using fallback data - API temporarily unavailable');
            this.useFallbackData();
        } finally {
            this.showLoading(false);
            this.initializeCalculator();
            this.initializeTabs();
            this.initializeChart();
        }
    },

    // Initialize DOM elements
    initializeElements() {
        this.elements = {
            sendAmount: document.getElementById('send-amount'),
            sendCurrency: document.getElementById('send-currency'),
            receiveAmount: document.getElementById('receive-amount'),
            receiveCurrency: document.getElementById('receive-currency'),
            feeDisplay: document.getElementById('fee-display'),
            rateDisplay: document.getElementById('rate-display'),
            swapBtn: document.getElementById('swap-currencies-btn'),
            tabs: document.querySelectorAll('.tab-link'),
            tabContents: document.querySelectorAll('.tab-content'),
            chartCanvas: document.getElementById('fxRateChart'),
            loadingIndicator: document.getElementById('loading-indicator'),
            errorDisplay: document.getElementById('error-display'),
            standardFeesBody: document.getElementById('standard-fees-body'),
            premiumFeesBody: document.getElementById('premium-fees-body'),
            businessFeesBody: document.getElementById('business-fees-body'),
            feeTables: document.querySelectorAll('.tab-content table'),
            feeLoadings: document.querySelectorAll('.fee-loading')
        };
    },

    // NEW: Set default currencies with NGN as receive currency
    setDefaultCurrencies() {
        // Set send currency to USD (default)
        if (this.elements.sendCurrency) {
            this.elements.sendCurrency.value = 'USD';
        }
        
        // Set receive currency to NGN (your requirement)
        if (this.elements.receiveCurrency) {
            this.elements.receiveCurrency.value = 'NGN';
        }
        
        console.log('Default currencies set: Send = USD, Receive = NGN');
    },

    // Load real-time data from APIs
    async loadRealTimeData() {
        console.log('Loading real-time data from APIs...');
        
        try {
            // Fetch fees data
            const feesResponse = await fetch(this.config.apiEndpoints.fees);
            if (feesResponse.ok) {
                const feesData = await feesResponse.json();
                console.log('Fees API Response:', feesData);
                this.processFeesData(feesData);
                this.populateFeeTablesWithActualData(feesData);
            } else {
                throw new Error('Fees API response not OK');
            }

            // Fetch exchange rate data
            const exchangeResponse = await fetch(`${this.config.apiEndpoints.exchange}?from=USD&to=NGN`);
            if (exchangeResponse.ok) {
                const exchangeData = await exchangeResponse.json();
                console.log('Exchange API Response:', exchangeData);
                this.updateExchangeRates(exchangeData);
            }

            console.log('Real-time data loaded successfully');
        } catch (error) {
            console.error('Error loading real-time data:', error);
            throw error;
        }
    },

    // Process fees data from API - Updated for actual structure
    processFeesData(feesData) {
        console.log('Processing fees data from actual API structure...');
        
        // Extract fee percentage from the actual API structure
        // Look for typical fee structures in the response
        if (feesData.Customer && feesData.Customer['Wallet to Wallet Transfer']) {
            const walletTransfer = feesData.Customer['Wallet to Wallet Transfer'];
            if (walletTransfer.length > 0 && walletTransfer[0].Fee) {
                const feeText = walletTransfer[0].Fee;
                // Try to extract percentage from fee text (e.g., "2%" or "0.5%")
                const percentageMatch = feeText.match(/(\d+\.?\d*)%/);
                if (percentageMatch) {
                    this.config.feePercentage = parseFloat(percentageMatch[1]) / 100;
                    console.log('Updated fee percentage to:', this.config.feePercentage);
                }
            }
        }
    },

    // Update exchange rates from API
    updateExchangeRates(exchangeData) {
        if (exchangeData.rate) {
            console.log('Updating exchange rate:', exchangeData.rate);
            this.config.exchangeRates.USD.NGN = exchangeData.rate;
            this.config.exchangeRates.NGN.USD = 1 / exchangeData.rate;
        }
    },

    // Populate fee tables with the ACTUAL API data structure
    populateFeeTablesWithActualData(feesData) {
        console.log('Populating fee tables with ACTUAL API data structure...');
        
        // Hide loading messages and show tables
        this.elements.feeLoadings.forEach(loading => loading.style.display = 'none');
        this.elements.feeTables.forEach(table => table.style.display = 'table');

        // Clear existing table data
        this.elements.standardFeesBody.innerHTML = '';
        this.elements.premiumFeesBody.innerHTML = '';
        this.elements.businessFeesBody.innerHTML = '';

        let hasData = false;

        // Populate Standard tab with Customer services
        if (feesData.Customer) {
            console.log('Processing ACTUAL Customer data structure...');
            this.populateStandardFeesFromActualData(feesData.Customer);
            hasData = true;
        }

        // Populate Business tab with Business services
        if (feesData.Business) {
            console.log('Processing ACTUAL Business data structure...');
            this.populateBusinessFeesFromActualData(feesData.Business);
            hasData = true;
        }

        if (hasData) {
            console.log('Successfully populated tables with actual API data');
        } else {
            console.log('No data found in actual API structure, using fallback');
            this.useFallbackData();
        }
    },

    // Populate standard fees from ACTUAL Customer data structure
    populateStandardFeesFromActualData(customerData) {
        console.log('Populating standard fees from actual customer data:', customerData);
        
        const services = [];

        // Extract services from the actual API structure
        Object.entries(customerData).forEach(([category, items]) => {
            if (Array.isArray(items)) {
                items.forEach(item => {
                    services.push({
                        category: category,
                        service: item.Service || 'Unknown Service',
                        fee: item.Fee || 'N/A',
                        description: item.Description || ''
                    });
                });
            }
        });

        // Populate Standard tab with customer services (first 6 services)
        services.slice(0, 6).forEach(service => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${service.service}</td>
                <td>${service.fee}</td>
                <td>${service.description || '-'}</td>
                <td><span class="status-badge active">ACTIVE</span></td>
            `;
            this.elements.standardFeesBody.appendChild(row);
        });

        // Populate Premium tab with customer services (next 6 services) with "discounted" rates
        services.slice(6, 12).forEach(service => {
            const discountedFee = this.applyDiscountToFee(service.fee);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${service.service} (Premium)</td>
                <td>${discountedFee}</td>
                <td>${service.description || '-'}</td>
                <td><span class="status-badge active">ACTIVE</span></td>
            `;
            this.elements.premiumFeesBody.appendChild(row);
        });
    },

    // Populate business fees from ACTUAL Business data structure
    populateBusinessFeesFromActualData(businessData) {
        console.log('Populating business fees from actual business data:', businessData);
        
        const services = [];

        // Extract services from the actual API structure
        Object.entries(businessData).forEach(([category, items]) => {
            if (Array.isArray(items)) {
                items.forEach(item => {
                    services.push({
                        category: category,
                        service: item.Service || 'Unknown Service',
                        fee: item.Fee || 'N/A',
                        description: item.Description || ''
                    });
                });
            }
        });

        // Populate Business tab with business services
        services.forEach(service => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${service.service}</td>
                <td>${service.fee}</td>
                <td>${service.description || '-'}</td>
                <td><span class="status-badge active">ACTIVE</span></td>
            `;
            this.elements.businessFeesBody.appendChild(row);
        });
    },

    // Helper function to apply "discount" to fee text for premium tier
    applyDiscountToFee(feeText) {
        // Try to apply 30% discount to percentage fees
        const percentageMatch = feeText.match(/(\d+\.?\d*)%/);
        if (percentageMatch) {
            const originalPercent = parseFloat(percentageMatch[1]);
            const discountedPercent = (originalPercent * 0.7).toFixed(1);
            return feeText.replace(percentageMatch[0], `${discountedPercent}%`);
        }
        
        // Try to apply discount to fixed amount fees
        const amountMatch = feeText.match(/\$(\d+\.?\d*)/);
        if (amountMatch) {
            const originalAmount = parseFloat(amountMatch[1]);
            const discountedAmount = (originalAmount * 0.7).toFixed(2);
            return feeText.replace(amountMatch[0], `$${discountedAmount}`);
        }
        
        // If no numbers found, return original with "Premium" indicator
        return feeText.includes('FREE') ? 'FREE' : `${feeText} (Discounted)`;
    },

    // Use fallback data when APIs fail
    useFallbackData() {
        console.log('Using complete fallback data...');
        
        // Hide loading messages and show tables
        this.elements.feeLoadings.forEach(loading => loading.style.display = 'none');
        this.elements.feeTables.forEach(table => table.style.display = 'table');

        // Clear any existing data
        this.elements.standardFeesBody.innerHTML = '';
        this.elements.premiumFeesBody.innerHTML = '';
        this.elements.businessFeesBody.innerHTML = '';

        // Add fallback services to all tabs
        this.addFallbackStandardServices();
        this.addFallbackBusinessServices();
    },

    // Add fallback standard services
    addFallbackStandardServices() {
        const fallbackServices = [
            { service: 'Wallet to Wallet Transfer', fee: '0.25%', description: 'Instant transfers between wallets', status: 'ACTIVE' },
            { service: 'Virtual Card Creation', fee: '$1.50', description: 'One-time card creation fee', status: 'ACTIVE' },
            { service: 'Currency Conversion', fee: '0.5%', description: 'FX conversion fee', status: 'ACTIVE' },
            { service: 'NGN Bank Transfer', fee: '₦100', description: 'Local bank transfers', status: 'ACTIVE' },
            { service: 'USD Bank Transfer', fee: '$15', description: 'International wire transfer', status: 'ACTIVE' },
            { service: 'Card Funding', fee: '1.0%', description: 'Credit/debit card deposits', status: 'ACTIVE' }
        ];

        fallbackServices.forEach(service => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${service.service}</td>
                <td>${service.fee}</td>
                <td>${service.description}</td>
                <td><span class="status-badge ${service.status.toLowerCase()}">${service.status}</span></td>
            `;
            this.elements.standardFeesBody.appendChild(row);
        });

        // Premium versions (discounted)
        fallbackServices.forEach(service => {
            const discountedFee = this.applyDiscountToFee(service.fee);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${service.service} (Premium)</td>
                <td>${discountedFee}</td>
                <td>${service.description}</td>
                <td><span class="status-badge active">ACTIVE</span></td>
            `;
            this.elements.premiumFeesBody.appendChild(row);
        });
    },

    // Add fallback business services
    addFallbackBusinessServices() {
        const fallbackServices = [
            { service: 'Business API Access', fee: 'Custom', description: 'Volume-based pricing', status: 'ACTIVE' },
            { service: 'Batch Payments', fee: '$0.50 per payment', description: 'Bulk payment processing', status: 'ACTIVE' },
            { service: 'Priority Support', fee: '$99/month', description: '24/7 dedicated support', status: 'ACTIVE' },
            { service: 'Settlement Services', fee: '0.1%', description: 'High-volume settlement', status: 'ACTIVE' }
        ];

        fallbackServices.forEach(service => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${service.service}</td>
                <td>${service.fee}</td>
                <td>${service.description}</td>
                <td><span class="status-badge ${service.status.toLowerCase()}">${service.status}</span></td>
            `;
            this.elements.businessFeesBody.appendChild(row);
        });
    },

    // Initialize calculator functionality
    initializeCalculator() {
        const els = this.elements;
        
        // Add event listeners
        ['input', 'change'].forEach(event => {
            els.sendAmount.addEventListener(event, () => this.calculateSwap());
            els.sendCurrency.addEventListener(event, () => this.calculateSwap());
            els.receiveCurrency.addEventListener(event, () => this.calculateSwap());
        });
        
        els.swapBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.swapCurrencies();
        });

        // Initial calculation with NGN as default receive currency
        this.calculateSwap();
    },

    // Calculate swap amounts
    calculateSwap() {
        const els = this.elements;
        const sendAmount = parseFloat(els.sendAmount.value.replace(/,/g, '')) || 0;
        const sendCurrency = els.sendCurrency.value;
        const receiveCurrency = els.receiveCurrency.value;

        const rate = this.config.exchangeRates[sendCurrency]?.[receiveCurrency] || 1;
        const fee = sendAmount * this.config.feePercentage;
        const amountAfterFee = sendAmount - fee;
        const receiveAmount = amountAfterFee * rate;

        // Format and display results
        const feeFormatter = new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: sendCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        els.feeDisplay.textContent = `${feeFormatter.format(fee)} (${(this.config.feePercentage * 100).toFixed(2)}%)`;
        els.rateDisplay.innerHTML = `1 ${sendCurrency} = ${rate.toFixed(4)} ${receiveCurrency} <span class="real-time-badge">Live</span>`;
        
        els.receiveAmount.value = receiveAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        this.flashElement(els.receiveAmount);
    },

    // Swap currencies
    swapCurrencies() {
        const els = this.elements;
        const tempCurrency = els.sendCurrency.value;
        els.sendCurrency.value = els.receiveCurrency.value;
        els.receiveCurrency.value = tempCurrency;
        this.calculateSwap();
    },

    // Flash element to indicate update
    flashElement(el) {
        el.classList.add('value-updated');
        setTimeout(() => el.classList.remove('value-updated'), 500);
    },

    // Initialize tabs
    initializeTabs() {
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.getAttribute('aria-controls');
                const targetContent = document.getElementById(targetId);

                // Update tab states
                this.elements.tabs.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                this.elements.tabContents.forEach(tc => tc.classList.remove('active'));
                
                // Activate selected tab
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    },

    // Initialize chart
    initializeChart() {
        const ctx = this.elements.chartCanvas.getContext('2d');
        const currentRate = this.config.exchangeRates.USD.NGN;
        
        const chartData = {
            labels: ['-6d', '-5d', '-4d', '-3d', '-2d', 'Yesterday', 'Today'],
            datasets: [{
                label: 'USD to NGN Exchange Rate',
                data: [
                    currentRate * 0.98, 
                    currentRate * 0.99, 
                    currentRate * 0.995, 
                    currentRate * 1.0, 
                    currentRate * 1.005, 
                    currentRate * 1.01, 
                    currentRate
                ],
                fill: true,
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                borderColor: '#FFC107',
                tension: 0.4,
                pointBackgroundColor: '#FFC107',
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        };

        new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `₦${context.parsed.y.toLocaleString()}`
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: (value) => `₦${value.toLocaleString()}`
                        }
                    }
                }
            }
        });
    },

    // Show/hide loading indicator
    showLoading(show) {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = show ? 'block' : 'none';
        }
    },

    // Show error message
    showError(message) {
        if (this.elements.errorDisplay) {
            if (message) {
                this.elements.errorDisplay.textContent = message;
                this.elements.errorDisplay.style.display = 'block';
                setTimeout(() => {
                    this.elements.errorDisplay.style.display = 'none';
                }, 5000);
            } else {
                this.elements.errorDisplay.style.display = 'none';
            }
        }
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    App.init();
});