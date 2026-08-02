// ui/app.js
let currentInvoiceData = null;
let currentInvoicePath = null;
let api = window.pywebview ? window.pywebview.api : null;

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    document.querySelectorAll('.sidebar li').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            switchTab(tabId);
        });
    });

    // Load configs
    loadConfigs();
    loadInvoiceHistory();

    // Set default due date
    setDefaultDueDate();

    // Event listeners
    setupEventListeners();
});

function switchTab(tabId) {
    // Update sidebar
    document.querySelectorAll('.sidebar li').forEach(t => t.classList.remove('active'));
    document.querySelector(`.sidebar li[data-tab="${tabId}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    // Refresh history when switching to history tab
    if (tabId === 'history') {
        loadInvoiceHistory();
    }
}

function setupEventListeners() {
    // Add item
    document.getElementById('addItem').addEventListener('click', addItemRow);

    // Due date presets
    document.querySelectorAll('.due-preset').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.due-preset').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            const days = parseInt(this.dataset.days);
            const date = new Date();
            date.setDate(date.getDate() + days);
            document.getElementById('dueDate').value = date.toISOString().split('T')[0];
        });
    });

    // Custom date input
    document.getElementById('dueDate').addEventListener('change', function() {
        document.querySelectorAll('.due-preset').forEach(b => b.classList.remove('selected'));
    });

    // Generate invoice
    document.getElementById('invoiceForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await generateInvoice(true);
    });

    // Preview invoice
    document.getElementById('previewInvoice').addEventListener('click', async function() {
        await generateInvoice(false);
    });

    // Send email
    document.getElementById('sendEmailBtn').addEventListener('click', sendInvoiceEmail);

    // Open invoice
    document.getElementById('openInvoiceBtn').addEventListener('click', function() {
        if (currentInvoicePath) {
            window.pywebview.api.open_file(currentInvoicePath);
        }
    });

    // Payment form
    document.getElementById('paymentForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await savePaymentSettings();
    });

    // Business form
    document.getElementById('businessForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveBusinessSettings();
    });

    // Open folder
    document.getElementById('openFolderBtn').addEventListener('click', function() {
        if (window.pywebview) {
            window.pywebview.api.open_invoice_folder();
        }
    });

    // Refresh history
    document.getElementById('refreshHistory').addEventListener('click', loadInvoiceHistory);
}

function setDefaultDueDate() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    document.getElementById('dueDate').value = date.toISOString().split('T')[0];
    document.querySelector('.due-preset[data-days="30"]').classList.add('selected');
}

function addItemRow() {
    const container = document.getElementById('itemsContainer');
    const rows = container.querySelectorAll('.item-row');
    const newRow = rows[0].cloneNode(true);

    // Clear inputs
    newRow.querySelector('.item-name').value = '';
    newRow.querySelector('.item-price').value = '';

    // Show remove button
    const removeBtn = newRow.querySelector('.remove-item');
    removeBtn.style.display = 'block';
    removeBtn.addEventListener('click', function() {
        this.parentElement.remove();
    });

    container.appendChild(newRow);
}

function getInvoiceData() {
    // Get customer details
    const customer = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        postcode: document.getElementById('postcode').value
    };

    // Get items
    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        const name = row.querySelector('.item-name').value;
        const price = parseFloat(row.querySelector('.item-price').value);
        if (name && !isNaN(price) && price > 0) {
            items.push({ name, price });
        }
    });

    // Get due date
    const dueDate = document.getElementById('dueDate').value;

    return { customer, items, due_date: dueDate };
}

async function generateInvoice(sendEmail) {
    const data = getInvoiceData();

    // Validate
    if (!data.customer.name || !data.customer.email) {
        showToast('Please fill in customer name and email', 'error');
        return;
    }

    if (data.items.length === 0) {
        showToast('Please add at least one item', 'error');
        return;
    }

    // Check if running in pywebview
    if (!window.pywebview) {
        showToast('This feature is only available in the desktop app', 'error');
        return;
    }

    try {
        const result = await window.pywebview.api.generate_invoice(data);

        if (result.success) {
            currentInvoiceData = data;
            currentInvoicePath = result.path;

            // Show preview
            const preview = document.getElementById('invoicePreview');
            preview.style.display = 'block';
            const total = data.items.reduce((sum, item) => sum + item.price, 0);
            document.getElementById('previewMessage').textContent =
                `Invoice generated successfully! Total: $${total.toFixed(2)}`;

            if (sendEmail) {
                await sendInvoiceEmail();
            } else {
                showToast('Invoice generated successfully!', 'success');
            }
        } else {
            showToast('Failed to generate invoice: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

async function sendInvoiceEmail() {
    if (!currentInvoiceData || !currentInvoicePath) {
        showToast('Please generate an invoice first', 'error');
        return;
    }

    if (!window.pywebview) {
        showToast('Email sending only available in desktop app', 'error');
        return;
    }

    try {
        showToast('Sending email...', 'info');
        const result = await window.pywebview.api.send_email(currentInvoicePath, currentInvoiceData);

        if (result.success) {
            showToast('Email sent successfully!', 'success');
        } else {
            showToast('Failed to send email: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

async function loadConfigs() {
    if (!window.pywebview) return;

    try {
        const config = await window.pywebview.api.get_config();

        // Load payment settings
        document.getElementById('bankName').value = config.payment.bank_name || '';
        document.getElementById('accountName').value = config.payment.account_name || '';
        document.getElementById('bsb').value = config.payment.bsb || '';
        document.getElementById('accountNumber').value = config.payment.account_number || '';
        document.getElementById('bpayCode').value = config.payment.bpay_biller_code || '';
        document.getElementById('bpayRef').value = config.payment.bpay_ref || '';

        // Load business & SMTP settings
        document.getElementById('companyName').value = config.company.name || '';
        document.getElementById('companyEmail').value = config.company.email || '';
        document.getElementById('companyPhone').value = config.company.phone || '';
        document.getElementById('smtpServer').value = config.smtp.server || 'smtp.gmail.com';
        document.getElementById('smtpPort').value = config.smtp.port || 587;
        document.getElementById('smtpUsername').value = config.smtp.username || '';
        document.getElementById('smtpPassword').value = config.smtp.password || '';
        document.getElementById('emailSubject').value = config.smtp.email_subject || 'Invoice from {company}';
        document.getElementById('emailBody').value = config.smtp.email_body || '';
    } catch (error) {
        console.error('Error loading configs:', error);
    }
}

async function savePaymentSettings() {
    if (!window.pywebview) return;

    try {
        const config = await window.pywebview.api.get_config();
        config.payment = {
            bank_name: document.getElementById('bankName').value,
            account_name: document.getElementById('accountName').value,
            bsb: document.getElementById('bsb').value,
            account_number: document.getElementById('accountNumber').value,
            bpay_biller_code: document.getElementById('bpayCode').value,
            bpay_ref: document.getElementById('bpayRef').value
        };

        const result = await window.pywebview.api.save_config(config);
        if (result.success) {
            showToast('Payment settings saved!', 'success');
        } else {
            showToast('Failed to save: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

async function saveBusinessSettings() {
    if (!window.pywebview) return;

    try {
        const config = await window.pywebview.api.get_config();
        config.company = {
            name: document.getElementById('companyName').value,
            email: document.getElementById('companyEmail').value,
            phone: document.getElementById('companyPhone').value
        };
        config.smtp = {
            server: document.getElementById('smtpServer').value,
            port: parseInt(document.getElementById('smtpPort').value),
            username: document.getElementById('smtpUsername').value,
            password: document.getElementById('smtpPassword').value,
            email_subject: document.getElementById('emailSubject').value,
            email_body: document.getElementById('emailBody').value
        };

        const result = await window.pywebview.api.save_config(config);
        if (result.success) {
            showToast('Business settings saved!', 'success');
        } else {
            showToast('Failed to save: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

async function loadInvoiceHistory() {
    if (!window.pywebview) return;

    try {
        // This would require a new API method to list files
        // For now, just show a placeholder
        const list = document.getElementById('invoiceList');
        list.innerHTML = `
            <div class="invoice-item">
                <div class="info">
                    <div class="filename">Invoice_20240101_Customer.pdf</div>
                    <div class="date">Generated: 2024-01-01</div>
                </div>
                <div class="actions">
                    <button class="btn-secondary" onclick="window.pywebview.api.open_file('Invoice_20240101_Customer.pdf')">Open</button>
                </div>
            </div>
            <div class="invoice-item">
                <div class="info">
                    <div class="filename">Invoice_20240102_Client.pdf</div>
                    <div class="date">Generated: 2024-01-02</div>
                </div>
                <div class="actions">
                    <button class="btn-secondary" onclick="window.pywebview.api.open_file('Invoice_20240102_Client.pdf')">Open</button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

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
    }, 3000);
}

// Check if running in pywebview
if (!window.pywebview) {
    document.querySelector('.container').innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <h1>⚠️ Invoice Generator</h1>
            <p>This application requires pywebview to run as a desktop app.</p>
            <p>Please install dependencies and run: <code>python main.py</code></p>
        </div>
    `;
}