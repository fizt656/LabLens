const { ipcRenderer } = require('electron');

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const removeFile = document.getElementById('removeFile');
const analysisSection = document.getElementById('analysisSection');
const labResults = document.getElementById('labResults');
const generatePatientMsg = document.getElementById('generatePatientMsg');
const generateStaffMsg = document.getElementById('generateStaffMsg');
const messagesSection = document.getElementById('messagesSection');
const patientMessage = document.getElementById('patientMessage');
const staffMessage = document.getElementById('staffMessage');
const patientMessageContent = document.getElementById('patientMessageContent');
const staffMessageContent = document.getElementById('staffMessageContent');
const copyPatientMsg = document.getElementById('copyPatientMsg');
const copyStaffMsg = document.getElementById('copyStaffMsg');
const loading = document.getElementById('loading');

// Global variables
let currentFile = null;
let currentAnalysis = null;
let availableModels = [];

// Settings management
const settings = {
    provider: 'openai',
    model: 'openai/gpt-4o'
};

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('lablens-settings');
    if (saved) {
        Object.assign(settings, JSON.parse(saved));
    }
    updateSettingsUI();
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('lablens-settings', JSON.stringify(settings));
}

// Update settings UI
function updateSettingsUI() {
    document.getElementById('providerOpenAI').checked = settings.provider === 'openai';
    document.getElementById('providerOpenRouter').checked = settings.provider === 'openrouter';
    
    const modelSelection = document.getElementById('modelSelection');
    const modelSelect = document.getElementById('modelSelect');
    
    if (settings.provider === 'openrouter') {
        modelSelection.style.display = 'block';
        // Populate model dropdown
        modelSelect.innerHTML = '';
        availableModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            option.selected = model.id === settings.model;
            modelSelect.appendChild(option);
        });
    } else {
        modelSelection.style.display = 'none';
    }
}

// File upload handling
uploadArea.addEventListener('click', async () => {
    const result = await ipcRenderer.invoke('select-file');
    if (result.success) {
        handleFileSelection(result);
    }
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        
        if (validTypes.includes(file.type)) {
            // Convert file to base64 for processing
            const reader = new FileReader();
            reader.onload = (event) => {
                const fileData = event.target.result.split(',')[1]; // Remove data URL prefix
                const fileType = file.name.split('.').pop().toLowerCase();
                
                handleFileSelection({
                    success: true,
                    fileName: file.name,
                    fileData: fileData,
                    fileType: '.' + fileType
                });
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid file type (PNG, JPG, or PDF)');
        }
    }
});

function handleFileSelection(result) {
    currentFile = result;
    
    // Show file info
    fileName.textContent = result.fileName;
    fileInfo.style.display = 'block';
    uploadArea.style.display = 'none';
    
    // Analyze the file
    analyzeFile();
}

removeFile.addEventListener('click', () => {
    currentFile = null;
    currentAnalysis = null;
    
    // Reset UI
    fileInfo.style.display = 'none';
    uploadArea.style.display = 'block';
    analysisSection.style.display = 'none';
    messagesSection.style.display = 'none';
    patientMessage.style.display = 'none';
    staffMessage.style.display = 'none';
});

async function analyzeFile() {
    if (!currentFile) return;
    
    // Show loading
    loading.style.display = 'block';
    analysisSection.style.display = 'none';
    messagesSection.style.display = 'none';
    
    try {
        const result = await ipcRenderer.invoke('analyze-lab-results', currentFile.fileData, currentFile.fileType);
        
        if (result.success) {
            currentAnalysis = result.analysis;
            displayLabResults(result.analysis);
            
            // Hide loading and show analysis
            loading.style.display = 'none';
            analysisSection.style.display = 'block';
        } else {
            throw new Error('Failed to analyze lab results');
        }
    } catch (error) {
        console.error('Error analyzing file:', error);
        loading.style.display = 'none';
        alert('Error analyzing lab results. Please try again.');
    }
}

function displayLabResults(analysis) {
    const { labType, timePeriods, results } = analysis;
    
    let html = `<h3>${labType}</h3>`;
    
    // Handle new timePeriods structure or fallback to old results structure
    if (timePeriods && timePeriods.length > 0) {
        // New structure with multiple time periods
        const currentPeriod = timePeriods[0]; // Most recent period
        const previousPeriod = timePeriods.length > 1 ? timePeriods[1] : null;
        
        // Display time period headers if multiple periods
        if (timePeriods.length > 1) {
            html += `<div class="time-periods-header">`;
            html += `<span class="current-period">${currentPeriod.label}</span>`;
            if (previousPeriod) {
                html += `<span class="previous-period">${previousPeriod.label}</span>`;
            }
            html += `</div>`;
        }
        
        // Get all test names from current period
        const testNames = Object.keys(currentPeriod.results);
        
        for (const testName of testNames) {
            const displayName = formatLabName(testName);
            const currentResult = currentPeriod.results[testName];
            const previousResult = previousPeriod?.results[testName];
            
            html += `<div class="result-item">`;
            html += `<span class="result-name">${displayName}</span>`;
            html += `<div class="result-value">`;
            
            // Current value
            html += `<span class="value">${currentResult.value} ${currentResult.unit}</span>`;
            html += `<span class="status ${currentResult.status}">${currentResult.status}</span>`;
            
            // Trend indicator if we have previous data
            if (previousResult) {
                const trend = calculateTrend(currentResult.value, previousResult.value);
                html += `<span class="trend ${trend.direction}">${trend.symbol} ${trend.change}</span>`;
            }
            
            html += `<span class="reference">Ref: ${currentResult.reference}</span>`;
            html += `</div>`;
            html += `</div>`;
        }
    } else if (results) {
        // Fallback to old structure for backward compatibility
        for (const [key, result] of Object.entries(results)) {
            const displayName = formatLabName(key);
            html += `
                <div class="result-item">
                    <span class="result-name">${displayName}</span>
                    <div class="result-value">
                        <span class="value">${result.value} ${result.unit}</span>
                        <span class="status ${result.status}">${result.status}</span>
                        <span class="reference">Ref: ${result.reference}</span>
                    </div>
                </div>
            `;
        }
    }
    
    labResults.innerHTML = html;
}

function calculateTrend(currentValue, previousValue) {
    const change = currentValue - previousValue;
    const percentChange = Math.abs((change / previousValue) * 100).toFixed(1);
    
    if (Math.abs(change) < 0.1) {
        return { direction: 'stable', symbol: '→', change: 'stable' };
    } else if (change > 0) {
        return { direction: 'increased', symbol: '↑', change: `+${percentChange}%` };
    } else {
        return { direction: 'decreased', symbol: '↓', change: `-${percentChange}%` };
    }
}

function formatLabName(key) {
    const nameMap = {
        totalCholesterol: 'Total Cholesterol',
        ldlCholesterol: 'LDL Cholesterol',
        hdlCholesterol: 'HDL Cholesterol',
        triglycerides: 'Triglycerides',
        cholesterolRatio: 'Cholesterol Ratio'
    };
    
    return nameMap[key] || key;
}

// Message generation
generatePatientMsg.addEventListener('click', async () => {
    if (currentAnalysis) {
        // Show loading state
        generatePatientMsg.disabled = true;
        generatePatientMsg.textContent = 'Generating...';
        
        try {
            const result = await ipcRenderer.invoke('generate-patient-message', currentAnalysis);
            
            if (result.success) {
                patientMessageContent.innerHTML = `<p>${result.message.replace(/\n/g, '</p><p>')}</p>`;
                patientMessage.style.display = 'block';
                messagesSection.style.display = 'block';
            } else {
                // Fallback to rule-based message
                const message = generatePatientMessage(currentAnalysis);
                patientMessageContent.innerHTML = message;
                patientMessage.style.display = 'block';
                messagesSection.style.display = 'block';
            }
        } catch (error) {
            console.error('Error generating patient message:', error);
            // Fallback to rule-based message
            const message = generatePatientMessage(currentAnalysis);
            patientMessageContent.innerHTML = message;
            patientMessage.style.display = 'block';
            messagesSection.style.display = 'block';
        } finally {
            // Reset button state
            generatePatientMsg.disabled = false;
            generatePatientMsg.textContent = 'Generate Patient Message';
        }
    }
});

generateStaffMsg.addEventListener('click', async () => {
    if (currentAnalysis) {
        // Show loading state
        generateStaffMsg.disabled = true;
        generateStaffMsg.textContent = 'Generating...';
        
        try {
            const result = await ipcRenderer.invoke('generate-staff-message', currentAnalysis);
            
            if (result.success) {
                staffMessageContent.innerHTML = result.message;
                staffMessage.style.display = 'block';
                messagesSection.style.display = 'block';
            } else {
                // Fallback to rule-based message
                const message = generateStaffMessage(currentAnalysis);
                staffMessageContent.innerHTML = message;
                staffMessage.style.display = 'block';
                messagesSection.style.display = 'block';
            }
        } catch (error) {
            console.error('Error generating staff message:', error);
            // Fallback to rule-based message
            const message = generateStaffMessage(currentAnalysis);
            staffMessageContent.innerHTML = message;
            staffMessage.style.display = 'block';
            messagesSection.style.display = 'block';
        } finally {
            // Reset button state
            generateStaffMsg.disabled = false;
            generateStaffMsg.textContent = 'Generate Staff Message';
        }
    }
});

function generatePatientMessage(analysis) {
    const { timePeriods, results } = analysis;
    
    // Handle new timePeriods structure or fallback to old results structure
    let currentResults, previousResults, currentLabel, previousLabel;
    
    if (timePeriods && timePeriods.length > 0) {
        currentResults = timePeriods[0].results;
        currentLabel = timePeriods[0].label;
        if (timePeriods.length > 1) {
            previousResults = timePeriods[1].results;
            previousLabel = timePeriods[1].label;
        }
    } else {
        currentResults = results;
    }
    
    // Determine overall status
    const hasHigh = Object.values(currentResults).some(r => r.status === 'high');
    const hasBorderline = Object.values(currentResults).some(r => r.status === 'borderline');
    
    let message = '<p>';
    
    if (hasHigh) {
        message += 'Your recent cholesterol test shows some levels that are higher than we would like to see. ';
    } else if (hasBorderline) {
        message += 'Your recent cholesterol test shows some levels that are borderline. ';
    } else {
        message += 'Your recent cholesterol test results look good overall. ';
    }
    
    message += '</p>';
    
    // Specific findings with trends
    if (currentResults.totalCholesterol) {
        if (currentResults.totalCholesterol.status === 'high') {
            message += '<p>Your total cholesterol is elevated at ' + currentResults.totalCholesterol.value + ' mg/dL. We recommend keeping this below 200 mg/dL.';
            
            if (previousResults?.totalCholesterol) {
                const trend = calculateTrend(currentResults.totalCholesterol.value, previousResults.totalCholesterol.value);
                if (trend.direction === 'decreased') {
                    message += ' The good news is it has decreased since your last test.';
                } else if (trend.direction === 'increased') {
                    message += ' This has increased since your last test, so we need to work on bringing it down.';
                }
            }
            message += '</p>';
        }
    }
    
    if (currentResults.ldlCholesterol) {
        if (currentResults.ldlCholesterol.status === 'high') {
            message += '<p>Your LDL (bad) cholesterol is high at ' + currentResults.ldlCholesterol.value + ' mg/dL. This is the type of cholesterol that can build up in your arteries.';
            
            if (previousResults?.ldlCholesterol) {
                const trend = calculateTrend(currentResults.ldlCholesterol.value, previousResults.ldlCholesterol.value);
                if (trend.direction === 'decreased') {
                    message += ' It has improved since your last test, which is encouraging.';
                } else if (trend.direction === 'increased') {
                    message += ' This has gotten worse since your last test.';
                }
            }
            message += '</p>';
        }
    }
    
    if (currentResults.hdlCholesterol) {
        if (currentResults.hdlCholesterol.status === 'normal') {
            message += '<p>The good news is your HDL (good) cholesterol is at a healthy level of ' + currentResults.hdlCholesterol.value + ' mg/dL.';
            
            if (previousResults?.hdlCholesterol) {
                const trend = calculateTrend(currentResults.hdlCholesterol.value, previousResults.hdlCholesterol.value);
                if (trend.direction === 'increased') {
                    message += ' This has improved since your last test!';
                }
            }
            message += '</p>';
        }
    }
    
    // Add trend summary if we have previous data
    if (previousResults) {
        message += '<p><strong>Changes since ' + previousLabel + ':</strong> ';
        const trends = [];
        
        Object.keys(currentResults).forEach(testName => {
            if (previousResults[testName]) {
                const trend = calculateTrend(currentResults[testName].value, previousResults[testName].value);
                const displayName = formatLabName(testName);
                trends.push(`${displayName} ${trend.symbol} ${trend.change}`);
            }
        });
        
        message += trends.join(', ') + '</p>';
    }
    
    // Recommendations
    if (hasHigh || hasBorderline) {
        message += '<p><strong>What you can do:</strong></p>';
        message += '<ul>';
        message += '<li>Eat more fruits, vegetables, and whole grains</li>';
        message += '<li>Choose lean proteins like fish and chicken</li>';
        message += '<li>Limit foods high in saturated fat and cholesterol</li>';
        message += '<li>Exercise regularly - aim for 30 minutes most days</li>';
        message += '<li>Maintain a healthy weight</li>';
        message += '</ul>';
        
        message += '<p>We will recheck your cholesterol in 6-8 weeks to see how you are doing. Please call if you have any questions.</p>';
    } else {
        message += '<p>Keep up the good work with your healthy lifestyle. We will check your cholesterol again at your next annual visit.</p>';
    }
    
    return message;
}

function generateStaffMessage(analysis) {
    const { labType, timePeriods, results } = analysis;
    
    // Handle new timePeriods structure or fallback to old results structure
    let currentResults, previousResults, currentLabel, previousLabel;
    
    if (timePeriods && timePeriods.length > 0) {
        currentResults = timePeriods[0].results;
        currentLabel = timePeriods[0].label;
        if (timePeriods.length > 1) {
            previousResults = timePeriods[1].results;
            previousLabel = timePeriods[1].label;
        }
    } else {
        currentResults = results;
    }
    
    let message = `<p><strong>${labType} Results (${currentLabel || 'Current'}):</strong></p><ul>`;
    
    // List all current results
    for (const [key, result] of Object.entries(currentResults)) {
        const displayName = formatLabName(key);
        const statusIndicator = result.status !== 'normal' ? ` (${result.status.toUpperCase()})` : '';
        message += `<li>${displayName}: ${result.value} ${result.unit}${statusIndicator} [Ref: ${result.reference}]</li>`;
    }
    
    message += '</ul>';
    
    // Add trend analysis if previous data available
    if (previousResults) {
        message += `<p><strong>Trends since ${previousLabel}:</strong></p><ul>`;
        
        Object.keys(currentResults).forEach(testName => {
            if (previousResults[testName]) {
                const current = currentResults[testName];
                const previous = previousResults[testName];
                const trend = calculateTrend(current.value, previous.value);
                const displayName = formatLabName(testName);
                
                let trendDescription = '';
                if (trend.direction === 'increased') {
                    trendDescription = `increased by ${trend.change}`;
                } else if (trend.direction === 'decreased') {
                    trendDescription = `decreased by ${trend.change}`;
                } else {
                    trendDescription = 'stable';
                }
                
                message += `<li>${displayName}: ${previous.value} → ${current.value} ${current.unit} (${trendDescription})</li>`;
            }
        });
        
        message += '</ul>';
    }
    
    // Clinical significance
    const hasHigh = Object.values(currentResults).some(r => r.status === 'high');
    const hasBorderline = Object.values(currentResults).some(r => r.status === 'borderline');
    
    if (hasHigh || hasBorderline) {
        message += '<p><strong>Clinical Significance:</strong></p><ul>';
        
        if (currentResults.ldlCholesterol?.status === 'high') {
            message += '<li>Elevated LDL-C increases cardiovascular risk</li>';
        }
        
        if (currentResults.totalCholesterol?.status === 'high') {
            message += '<li>Total cholesterol >200 mg/dL associated with increased CHD risk</li>';
        }
        
        // Add trend-based clinical notes
        if (previousResults) {
            const ldlTrend = currentResults.ldlCholesterol && previousResults.ldlCholesterol ? 
                calculateTrend(currentResults.ldlCholesterol.value, previousResults.ldlCholesterol.value) : null;
            
            if (ldlTrend?.direction === 'increased') {
                message += '<li>Worsening LDL trend indicates need for intervention escalation</li>';
            } else if (ldlTrend?.direction === 'decreased') {
                message += '<li>Improving LDL trend suggests current interventions are effective</li>';
            }
        }
        
        message += '</ul>';
        
        message += '<p><strong>Recommendations:</strong></p><ul>';
        message += '<li>Lifestyle modifications: diet, exercise, weight management</li>';
        message += '<li>Recheck lipid panel in 6-8 weeks</li>';
        
        if (currentResults.ldlCholesterol?.value > 160) {
            message += '<li>Consider statin therapy if lifestyle changes insufficient</li>';
        }
        
        message += '<li>Assess other cardiovascular risk factors</li>';
        
        if (previousResults) {
            message += '<li>Monitor trends to assess intervention effectiveness</li>';
        }
        
        message += '</ul>';
    } else {
        message += '<p><strong>Assessment:</strong> Lipid levels within normal limits</p>';
        
        if (previousResults) {
            message += '<p><strong>Trend Assessment:</strong> Stable/improving lipid profile</p>';
        }
        
        message += '<p><strong>Plan:</strong> Continue current lifestyle, recheck annually</p>';
    }
    
    return message;
}

// Copy functionality
copyPatientMsg.addEventListener('click', () => {
    copyToClipboard(patientMessageContent.textContent, copyPatientMsg);
});

copyStaffMsg.addEventListener('click', () => {
    copyToClipboard(staffMessageContent.textContent, copyStaffMsg);
});

function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy to clipboard');
    });
}

// Settings event handlers
document.getElementById('settingsBtn').addEventListener('click', () => {
    const panel = document.getElementById('settingsPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('providerOpenAI').addEventListener('change', (e) => {
    if (e.target.checked) {
        settings.provider = 'openai';
        saveSettings();
        updateSettingsUI();
        // Update analyzer configuration
        ipcRenderer.invoke('update-analyzer-config', { provider: 'openai' });
    }
});

document.getElementById('providerOpenRouter').addEventListener('change', (e) => {
    if (e.target.checked) {
        settings.provider = 'openrouter';
        settings.model = availableModels[0]?.id || 'openai/gpt-4o';
        saveSettings();
        updateSettingsUI();
        // Update analyzer configuration
        ipcRenderer.invoke('update-analyzer-config', { 
            provider: 'openrouter', 
            model: settings.model 
        });
    }
});

document.getElementById('modelSelect').addEventListener('change', (e) => {
    settings.model = e.target.value;
    saveSettings();
    // Update analyzer configuration
    ipcRenderer.invoke('update-analyzer-config', { 
        provider: 'openrouter', 
        model: settings.model 
    });
});

// Initialize settings on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Get available models from main process
    try {
        availableModels = await ipcRenderer.invoke('get-available-models');
    } catch (error) {
        console.error('Failed to get available models:', error);
        // Fallback models
        availableModels = [
            { id: 'openai/gpt-4o', name: 'GPT-4o (OpenAI)' },
            { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
            { id: 'google/gemini-pro-vision', name: 'Gemini Pro Vision' },
            { id: 'meta-llama/llama-3.2-90b-vision-instruct', name: 'Llama 3.2 90B Vision' }
        ];
    }
    
    // Load and apply settings
    loadSettings();
    
    // Apply initial configuration to analyzer
    ipcRenderer.invoke('update-analyzer-config', {
        provider: settings.provider,
        model: settings.model
    });
});
