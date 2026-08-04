// ============================================
// INVOICE GENERATOR v3 - Flask Version
// ============================================

// ---------- State ----------
let currentInvoiceData = null;
let currentInvoicePath = null;

// ---------- DOM Ready ----------
document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    loadConfigs();
    loadInvoiceHistory();
    setDefaultDueDate();
    setupEventListeners();
    initThemeToggle();
    console.log('✅ Invoice Generator ready!');
    console.log('📍 API endpoint: /api/');
});

// ---------- Tabs ----------
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            console.log('Switching to tab:', tabId);

            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            contents.forEach(c => c.classList.remove('active'));
            const target = document.getElementById(tabId);
            if (target) {
                target.classList.add('active');
            }

            if (tabId === 'history') loadInvoiceHistory();
        });
    });

    // Make sure first tab is active
    const firstTab = document.querySelector('.tab-btn.active');
    if (!firstTab) {
        const first = document.querySelector('.tab-btn');
        if (first) first.click();
    }
}

// ---------- Event Listeners ----------
function setupEventListeners() {
    // Add item
    const addBtn = document.getElementById('addItem');
    if (addBtn) addBtn.addEventListener('click', addItemRow);

    // Due date presets
    document.querySelectorAll('.due-preset').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.due-preset').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            const days = parseInt(this.dataset.days);
            const date = new Date();
            date.setDate(date.getDate() + days);
            const input = document.getElementById('dueDate');
            if (input) input.value = date.toISOString().split('T')[0];
        });
    });

    // Custom date
    const dueDateInput = document.getElementById('dueDate');
    if (dueDateInput) {
        dueDateInput.addEventListener('change', function() {
            document.querySelectorAll('.due-preset').forEach(b => b.classList.remove('selected'));
        });
    }

    // Forms
    const invoiceForm = document.getElementById('invoiceForm');
    if (invoiceForm) {
        invoiceForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await generateInvoice(true);
        });
    }

    const previewBtn = document.getElementById('previewInvoice');
    if (previewBtn) {
        previewBtn.addEventListener('click', async function() {
            await generateInvoice(false);
        });
    }

    const sendBtn = document.getElementById('sendEmailBtn');
    if (sendBtn) sendBtn.addEventListener('click', sendInvoiceEmail);

    const openBtn = document.getElementById('openInvoiceBtn');
    if (openBtn) {
        openBtn.addEventListener('click', function() {
            if (currentInvoicePath) {
                window.open('/invoices/' + currentInvoicePath.split('/').pop(), '_blank');
            }
        });
    }

    // Payment form
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await savePaymentSettings();
        });
    }

    // Business form
    const businessForm = document.getElementById('businessForm');
    if (businessForm) {
        businessForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveBusinessSettings();
        });
    }

    // Open folder
    const folderBtn = document.getElementById('openFolderBtn');
    if (folderBtn) {
        folderBtn.addEventListener('click', function() {
            showToast('📂 Open your invoices folder manually at: ./invoices/', 'info');
        });
    }

    // Refresh history
    const refreshBtn = document.getElementById('refreshHistory');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadInvoiceHistory);
    }
}

// ---------- Due Date ----------
function setDefaultDueDate() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    const input = document.getElementById('dueDate');
    if (input) input.value = date.toISOString().split('T')[0];
    const preset = document.querySelector('.due-preset[data-days="30"]');
    if (preset) preset.classList.add('selected');
}

// ---------- Items ----------
function addItemRow() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;

    const rows = container.querySelectorAll('.item-row');
    const newRow = rows[0].cloneNode(true);

    const nameInput = newRow.querySelector('.item-name');
    const priceInput = newRow.querySelector('.item-price');
    if (nameInput) nameInput.value = '';
    if (priceInput) priceInput.value = '';

    const removeBtn = newRow.querySelector('.remove-item');
    if (removeBtn) {
        removeBtn.style.display = 'block';
        removeBtn.addEventListener('click', function() {
            this.parentElement.remove();
        });
    }

    container.appendChild(newRow);
}

// ---------- Get Data ----------
function getInvoiceData() {
    const customer = {
        name: document.getElementById('name')?.value || '',
        email: document.getElementById('email')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        address: document.getElementById('address')?.value || '',
        city: document.getElementById('city')?.value || '',
        state: document.getElementById('state')?.value || '',
        postcode: document.getElementById('postcode')?.value || ''
    };

    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        const nameInput = row.querySelector('.item-name');
        const priceInput = row.querySelector('.item-price');
        if (nameInput && priceInput) {
            const name = nameInput.value;
            const price = parseFloat(priceInput.value);
            if (name && !isNaN(price) && price > 0) {
                items.push({ name, price });
            }
        }
    });

    const dueDate = document.getElementById('dueDate')?.value || '';
    const invoiceName = document.getElementById('invoiceName')?.value || '';

    return {
        customer,
        items,
        due_date: dueDate,
        invoice_name: invoiceName  // ✅ NEW
    };
}
// ---------- API Helpers ----------
async function apiCall(endpoint, data = null) {
    const options = {
        method: data ? 'POST' : 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    const response = await fetch(`/api/${endpoint}`, options);
    return await response.json();
}

// ---------- Generate Invoice ----------
async function generateInvoice(sendEmail) {
    const data = getInvoiceData();

    if (!data.customer.name || !data.customer.email) {
        showToast('Please fill in customer name and email', 'error');
        return;
    }

    if (data.items.length === 0) {
        showToast('Please add at least one item', 'error');
        return;
    }

    try {
        const result = await apiCall('generate_invoice', data);

        if (result.success) {
            currentInvoiceData = data;
            currentInvoicePath = result.path;

            const preview = document.getElementById('invoicePreview');
            if (preview) preview.style.display = 'block';

            const total = data.items.reduce((sum, item) => sum + item.price, 0);
            const msg = document.getElementById('previewMessage');
            if (msg) msg.textContent = `✅ Invoice generated successfully! Total: $${total.toFixed(2)}`;

            if (sendEmail) {
                await sendInvoiceEmail();
            } else {
                showToast(`✅ Invoice generated! Total: $${total.toFixed(2)}`, 'success');
            }
        } else {
            showToast('❌ Failed to generate invoice: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('❌ Error: ' + error.message, 'error');
        console.error(error);
    }
}

// ---------- Send Email ----------
async function sendInvoiceEmail() {
    if (!currentInvoiceData || !currentInvoicePath) {
        showToast('Please generate an invoice first', 'error');
        return;
    }

    try {
        showToast('📧 Sending email...', 'info');
        const result = await apiCall('send_email', {
            pdf_path: currentInvoicePath,
            invoice_data: currentInvoiceData
        });

        if (result.success) {
            showToast('✅ Email sent successfully!', 'success');
        } else {
            showToast('❌ Failed to send email: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('❌ Error: ' + error.message, 'error');
        console.error(error);
    }
}

// ---------- Load Configs ----------
async function loadConfigs() {
    try {
        const config = await apiCall('get_config');

        setVal('bankName', config.payment?.bank_name);
        setVal('accountName', config.payment?.account_name);
        setVal('bsb', config.payment?.bsb);
        setVal('accountNumber', config.payment?.account_number);
        setVal('bpayCode', config.payment?.bpay_biller_code);
        setVal('bpayRef', config.payment?.bpay_ref);

        setVal('companyName', config.company?.name);
        setVal('companyEmail', config.company?.email);
        setVal('companyPhone', config.company?.phone);

        setVal('smtpServer', config.smtp?.server || 'smtp.gmail.com');
        setVal('smtpPort', config.smtp?.port || 587);
        setVal('smtpUsername', config.smtp?.username);
        setVal('smtpPassword', config.smtp?.password);
        setVal('emailSubject', config.smtp?.email_subject || 'Invoice from {company}');
        setVal('emailBody', config.smtp?.email_body || '');
    } catch (error) {
        console.error('Error loading configs:', error);
    }
}

function setVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
}

// ---------- Save Payment ----------
async function savePaymentSettings() {
    try {
        const config = await apiCall('get_config');
        config.payment = {
            bank_name: document.getElementById('bankName')?.value || '',
            account_name: document.getElementById('accountName')?.value || '',
            bsb: document.getElementById('bsb')?.value || '',
            account_number: document.getElementById('accountNumber')?.value || '',
            bpay_biller_code: document.getElementById('bpayCode')?.value || '',
            bpay_ref: document.getElementById('bpayRef')?.value || ''
        };

        const result = await apiCall('save_config', config);
        if (result.success) {
            showToast('✅ Payment settings saved!', 'success');
        } else {
            showToast('❌ Failed to save: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('❌ Error: ' + error.message, 'error');
        console.error(error);
    }
}

// ---------- Save Business ----------
async function saveBusinessSettings() {
    try {
        const config = await apiCall('get_config');
        config.company = {
            name: document.getElementById('companyName')?.value || '',
            email: document.getElementById('companyEmail')?.value || '',
            phone: document.getElementById('companyPhone')?.value || ''
        };
        config.smtp = {
            server: document.getElementById('smtpServer')?.value || '',
            port: parseInt(document.getElementById('smtpPort')?.value || '587'),
            username: document.getElementById('smtpUsername')?.value || '',
            password: document.getElementById('smtpPassword')?.value || '',
            email_subject: document.getElementById('emailSubject')?.value || '',
            email_body: document.getElementById('emailBody')?.value || ''
        };

        const result = await apiCall('save_config', config);
        if (result.success) {
            showToast('✅ Business settings saved!', 'success');
        } else {
            showToast('❌ Failed to save: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('❌ Error: ' + error.message, 'error');
        console.error(error);
    }
}

// ---------- Invoice History ----------
async function loadInvoiceHistory() {
    const list = document.getElementById('invoiceList');
    if (!list) return;

    list.innerHTML = `
        <div class="empty-state">
            <span class="empty-icon">📭</span>
            <p>No invoices found</p>
            <small>Generate your first invoice to see it here</small>
        </div>
    `;
}

// ---------- Toast ----------
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ---------- THEME TOGGLE (FIXED - FINAL) ----------
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) {
        console.warn('Theme toggle element not found!');
        return;
    }

    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('invoice-theme');
    console.log('Saved theme:', savedTheme);

    // Apply theme and set toggle state
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.checked = true;  // ✅ TOGGLE MATCHES DARK
        console.log('Dark mode applied, toggle ON');
    } else {
        document.body.classList.remove('dark-theme');
        themeToggle.checked = false;  // ✅ TOGGLE MATCHES LIGHT
        console.log('Light mode applied, toggle OFF');
    }

    // Listen for toggle changes
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('invoice-theme', 'dark');
            console.log('Switched to dark mode');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('invoice-theme', 'light');
            console.log('Switched to light mode');
        }
    });
}

// ---------- NO FALLBACK — FLASK MODE ----------
// Fallback removed so Flask version renders properly.