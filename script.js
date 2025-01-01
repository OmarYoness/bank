// Enhanced user database with two users
const users = {
    'eng123': {
        password: 'test123',
        name: 'John Engineer',
        balance: 5000.00,
        transactions: [],
        accountCreated: '2024-01-01',
        lastLogin: null
    },
    'eng456': {
        password: 'test456',
        name: 'Sarah Engineer',
        balance: 3000.00,
        transactions: [],
        accountCreated: '2024-01-01',
        lastLogin: null
    }
};

// Enhanced security token generation
function generateToken() {
    const array = new Uint32Array(8);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}

let currentSession = null;
let currentFilter = 'all';

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const icon = document.querySelector('.password-toggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    console.log('Login attempt:', username);
    
    if (users[username] && users[username].password === password) {
        currentSession = {
            token: generateToken(),
            username: username,
            timestamp: Date.now()
        };
        
        users[username].lastLogin = new Date().toISOString();
        localStorage.setItem('session', JSON.stringify(currentSession));
        saveUserData(); // Save login time
        
        showDashboard(username);
        showNotification('Login successful', 'success');
    } else {
        showNotification('Invalid credentials. Please use eng123/test123', 'error');
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showModal(type) {
    const modal = document.getElementById('transactionModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubmit = document.getElementById('modalSubmit');
    
    // Set modal content based on type
    if (type === 'deposit') {
        modalTitle.textContent = 'Make a Deposit';
        modalSubmit.textContent = 'Deposit Funds';
        modalSubmit.dataset.type = 'deposit';
        modalSubmit.className = 'deposit-button';
    } else {
        modalTitle.textContent = 'Make a Withdrawal';
        modalSubmit.textContent = 'Withdraw Funds';
        modalSubmit.dataset.type = 'withdraw';
        modalSubmit.className = 'withdraw-button';
    }
    
    // Reset form
    document.getElementById('modalAmount').value = '';
    
    // Show modal with proper animation
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

function closeModal() {
    const modal = document.getElementById('transactionModal');
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300); // Match the CSS transition duration
}

function handleTransaction(event) {
    event.preventDefault();
    
    if (!currentSession) {
        showNotification('Please log in first', 'error');
        return false;
    }
    
    const amount = parseFloat(document.getElementById('modalAmount').value);
    const type = event.target.querySelector('button').dataset.type;
    
    if (isNaN(amount) || amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return false;
    }
    
    const user = users[currentSession.username];
    
    if (type === 'withdraw' && amount > user.balance) {
        showNotification('Insufficient funds', 'error');
        return false;
    }
    
    // Process transaction
    if (type === 'deposit') {
        user.balance += amount;
    } else {
        user.balance -= amount;
    }
    
    // Record transaction
    user.transactions.unshift({
        type: type,
        amount: amount,
        date: new Date().toISOString(),
        id: generateToken()
    });
    
    // Update UI
    updateDashboard();
    closeModal();
    showNotification(`Successfully ${type}ed $${amount.toFixed(2)}`, 'success');
    
    return false;
}

function filterTransactions(filter) {
    currentFilter = filter;
    updateTransactionList(currentSession.username);
    
    // Update active filter button
    document.querySelectorAll('.transaction-filters button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function updateTransactionList(username) {
    const transactions = users[username].transactions
        .filter(t => currentFilter === 'all' || t.type === currentFilter);
    
    const listElement = document.getElementById('transactionList');
    
    listElement.innerHTML = transactions.map(t => `
        <div class="transaction ${t.type}">
            <div class="transaction-info">
                <strong>${t.type.charAt(0).toUpperCase() + t.type.slice(1)}</strong>
                <small>${new Date(t.date).toLocaleString()}</small>
                ${t.note ? `<p>${t.note}</p>` : ''}
            </div>
            <div class="transaction-amount ${t.type === 'deposit' ? 'positive' : t.type === 'withdraw' ? 'negative' : ''}">
                ${t.type === 'deposit' ? '+' : t.type === 'withdraw' ? '-' : ''}$${t.amount.toFixed(2)}
            </div>
        </div>
    `).join('');
}

function updateDashboard() {
    const user = users[currentSession.username];
    document.getElementById('balanceDisplay').textContent = `$${user.balance.toFixed(2)}`;
    updateTransactionList(currentSession.username);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('transactionModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Initialize dashboard
window.onload = function() {
    initializeData();
    const savedSession = localStorage.getItem('session');
    if (savedSession) {
        currentSession = JSON.parse(savedSession);
        if (Date.now() - currentSession.timestamp < 30 * 60 * 1000) {
            showDashboard(currentSession.username);
        } else {
            logout();
        }
    }
};

function showDashboard(username) {
    const user = users[username];
    document.getElementById('userDisplay').textContent = user.name;
    document.getElementById('balanceDisplay').textContent = `$${user.balance.toFixed(2)}`;
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    
    // Initialize navigation after showing dashboard
    initializeNavigation();
    
    updateTransactionList(username);
}

function logout() {
    currentSession = null;
    localStorage.removeItem('session');
    
    // Reset form fields
    document.getElementById('loginForm').reset();
    
    // Hide dashboard and show login
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'block';
    
    // Clear any displayed data
    document.getElementById('userDisplay').textContent = '';
    document.getElementById('balanceDisplay').textContent = '$0.00';
    document.getElementById('transactionList').innerHTML = '';
    
    showNotification('Logged out successfully', 'success');
}

// Also ensure the logout button in HTML is properly connected
document.querySelector('.user-info button').addEventListener('click', function(e) {
    e.preventDefault();
    logout();
});

// Update the transfer handling function
function handleTransfer(event) {
    event.preventDefault();
    
    if (!currentSession) {
        showNotification('Session expired. Please login again.', 'error');
        logout();
        return false;
    }
    
    const recipientId = document.getElementById('recipientId').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const note = document.getElementById('transferNote').value.trim();
    
    // Validation checks
    if (!users[recipientId]) {
        showNotification('Recipient not found. Try eng456', 'error');
        return false;
    }
    
    if (recipientId === currentSession.username) {
        showNotification('Cannot transfer to yourself', 'error');
        return false;
    }
    
    if (amount <= 0) {
        showNotification('Invalid amount', 'error');
        return false;
    }
    
    const sender = users[currentSession.username];
    
    if (sender.balance < amount) {
        showNotification('Insufficient funds', 'error');
        return false;
    }
    
    // Process transfer
    sender.balance -= amount;
    users[recipientId].balance += amount;
    
    // Record transaction for sender
    const senderTransaction = {
        type: 'transfer',
        amount: amount,
        recipient: recipientId,
        date: new Date().toISOString(),
        note: note || `Transfer to ${users[recipientId].name}`,
        transactionId: generateToken()
    };
    
    // Record transaction for recipient
    const recipientTransaction = {
        type: 'receive',
        amount: amount,
        sender: currentSession.username,
        date: new Date().toISOString(),
        note: note || `Received from ${sender.name}`,
        transactionId: senderTransaction.transactionId
    };
    
    sender.transactions.unshift(senderTransaction);
    users[recipientId].transactions.unshift(recipientTransaction);
    
    // Update UI
    updateDashboard();
    document.getElementById('transferForm').reset();
    
    showNotification(`Successfully transferred $${amount.toFixed(2)} to ${users[recipientId].name}`, 'success');
    return false;
}

// Initialize or load saved data when the page loads
function initializeData() {
    const savedUsers = localStorage.getItem('bankUsers');
    if (savedUsers) {
        Object.assign(users, JSON.parse(savedUsers));
    } else {
        // Initial users if no saved data exists
        const defaultUsers = {
            'eng123': {
                password: 'test123',
                name: 'John Engineer',
                balance: 5000.00,
                transactions: [],
                accountCreated: '2024-01-01',
                lastLogin: null
            },
            'eng456': {
                password: 'test456',
                name: 'Sarah Engineer',
                balance: 3000.00,
                transactions: [],
                accountCreated: '2024-01-01',
                lastLogin: null
            }
        };
        localStorage.setItem('bankUsers', JSON.stringify(defaultUsers));
        Object.assign(users, defaultUsers);
    }
}

// Save user data after each transaction
function saveUserData() {
    localStorage.setItem('bankUsers', JSON.stringify(users));
}

// Update handleTransfer function
function handleTransfer(event) {
    event.preventDefault();
    
    if (!currentSession) {
        showNotification('Session expired. Please login again.', 'error');
        logout();
        return false;
    }
    
    const recipientId = document.getElementById('recipientId').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const note = document.getElementById('transferNote').value.trim();
    
    if (!users[recipientId]) {
        showNotification('Recipient not found. Try eng456', 'error');
        return false;
    }
    
    if (recipientId === currentSession.username) {
        showNotification('Cannot transfer to yourself', 'error');
        return false;
    }
    
    if (amount <= 0) {
        showNotification('Invalid amount', 'error');
        return false;
    }
    
    const sender = users[currentSession.username];
    
    if (sender.balance < amount) {
        showNotification('Insufficient funds', 'error');
        return false;
    }
    
    sender.balance -= amount;
    users[recipientId].balance += amount;
    
    const transactionId = generateToken();
    
    const senderTransaction = {
        type: 'transfer',
        amount: amount,
        recipient: recipientId,
        date: new Date().toISOString(),
        note: note || `Transfer to ${users[recipientId].name}`,
        transactionId: transactionId
    };
    
    const recipientTransaction = {
        type: 'receive',
        amount: amount,
        sender: currentSession.username,
        date: new Date().toISOString(),
        note: note || `Received from ${sender.name}`,
        transactionId: transactionId
    };
    
    sender.transactions.unshift(senderTransaction);
    users[recipientId].transactions.unshift(recipientTransaction);
    
    saveUserData(); // Save after transfer
    
    updateDashboard();
    document.getElementById('transferForm').reset();
    
    showNotification(`Successfully transferred $${amount.toFixed(2)} to ${users[recipientId].name}`, 'success');
    return false;
}

// Add these functions to handle navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(sectionId).style.display = 'block';
    
    // Update active nav link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
}

// Add analytics data
function updateAnalytics() {
    const currentUser = users[currentSession.username];
    const transactions = currentUser.transactions;

    // Calculate total income and expenses
    const totals = transactions.reduce((acc, trans) => {
        if (trans.type === 'deposit' || trans.type === 'receive') {
            acc.income += trans.amount;
        } else if (trans.type === 'withdraw' || trans.type === 'transfer') {
            acc.expenses += trans.amount;
        }
        return acc;
    }, { income: 0, expenses: 0 });

    // Update displays
    document.getElementById('totalIncome').textContent = `$${totals.income.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${totals.expenses.toFixed(2)}`;
    
    // Monthly transaction chart data
    const monthlyData = getMonthlyTransactionData(transactions);
    updateTransactionChart(monthlyData);
}

function getMonthlyTransactionData(transactions) {
    const months = {};
    
    transactions.forEach(trans => {
        const date = new Date(trans.date);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        
        if (!months[monthYear]) {
            months[monthYear] = { income: 0, expenses: 0 };
        }
        
        if (trans.type === 'deposit' || trans.type === 'receive') {
            months[monthYear].income += trans.amount;
        } else {
            months[monthYear].expenses += trans.amount;
        }
    });
    
    return months;
}

// Settings functions
function updateUserSettings(event) {
    event.preventDefault();
    const user = users[currentSession.username];
    
    const newEmail = document.getElementById('settingsEmail').value;
    const newNotifications = document.getElementById('settingsNotifications').checked;
    
    user.settings = {
        ...user.settings,
        email: newEmail,
        notifications: newNotifications
    };
    
    saveUserData();
    showNotification('Settings updated successfully', 'success');
}

function updatePassword(event) {
    event.preventDefault();
    const user = users[currentSession.username];
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (currentPassword !== user.password) {
        showNotification('Current password is incorrect', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    user.password = newPassword;
    saveUserData();
    showNotification('Password updated successfully', 'success');
    document.getElementById('passwordForm').reset();
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Navigation event listeners
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.closest('a').dataset.section;
            showSection(section);
            
            if (section === 'analyticsSection') {
                updateAnalytics();
            }
        });
    });
    
    // Settings form listeners
    document.getElementById('settingsForm')?.addEventListener('submit', updateUserSettings);
    document.getElementById('passwordForm')?.addEventListener('submit', updatePassword);
});

// Navigation System
let currentSection = 'dashboardMain';

function initializeNavigation() {
    // Add click handlers to navigation links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('data-section');
            navigateToSection(targetSection);
        });
    });

    // Set initial section
    navigateToSection('dashboardMain');
}

function navigateToSection(sectionId) {
    console.log('Navigating to:', sectionId); // Debug log

    // First hide all sections
    const allSections = document.querySelectorAll('.dashboard-section');
    allSections.forEach(section => {
        section.style.display = 'none';
    });

    // Remove active class from all nav links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });

    // Show the selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        currentSection = sectionId;
    }

    // Add active class to the current nav link
    const activeLink = document.querySelector(`.nav-links a[data-section="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Update analytics if necessary
    if (sectionId === 'analyticsSection') {
        updateAnalytics();
    }
}

// Make sure navigation is initialized when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing navigation'); // Debug log
    initializeNavigation();
}); 