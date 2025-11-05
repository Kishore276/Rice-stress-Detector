// =====================================================
// Rice Stress Detector - Authentication JavaScript
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Starting initialization...');
    
    // Initialize farmer fields as visible, researcher as hidden
    const farmerFields = document.getElementById('farmer-fields');
    const researcherFields = document.getElementById('researcher-fields');
    
    if (farmerFields && researcherFields) {
        // Make sure farmer fields are required by default
        farmerFields.querySelectorAll('input, textarea').forEach(field => {
            if (field.id !== 'register-farm-size' && field.id !== 'register-postal-code') {
                field.setAttribute('required', '');
            }
        });
        
        // Make sure researcher fields are NOT required by default
        researcherFields.querySelectorAll('input, textarea').forEach(field => {
            field.removeAttribute('required');
        });
        
        console.log('Field requirements initialized');
    }
    
    setupTabNavigation();
    setupUserTypeSelection();
    setupFormValidation();
    setupSwitchTabs();
    
    // Add direct button click handler as backup
    const createAccountBtn = document.querySelector('#register-form button[type="submit"]');
    if (createAccountBtn) {
        console.log('Found Create Account button, adding direct click listener');
        createAccountBtn.addEventListener('click', function(e) {
            console.log('Create Account button clicked!');
        });
    } else {
        console.error('Create Account button NOT FOUND');
    }
    
    console.log('Initialization complete');
});

// =====================================================
// TAB NAVIGATION
// =====================================================
function setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-navigation .tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;

            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            document.getElementById(tabName + '-tab').classList.add('active');

            // Reset forms when switching tabs
            resetFormFields();
        });
    });
}

// =====================================================
// USER TYPE SELECTION
// =====================================================
function setupUserTypeSelection() {
    // Login tab
    const loginUserTypeBtns = document.querySelectorAll('#login-tab .user-type-btn');
    loginUserTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const userType = this.dataset.type;
            updateLoginUserType(userType);
        });
    });

    // Register tab
    const registerUserTypeBtns = document.querySelectorAll('#register-tab .user-type-btn');
    registerUserTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const userType = this.dataset.type;
            updateRegisterUserType(userType);
        });
    });
}

function updateLoginUserType(userType) {
    // Update hidden input
    document.getElementById('login-user-type').value = userType;

    // Update button styling
    document.querySelectorAll('#login-tab .user-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.user-type-btn').classList.add('active');

    // Update placeholder text
    const placeholderText = userType === 'farmer' 
        ? 'Enter your username' 
        : 'Enter your email/username';
    document.getElementById('login-username').placeholder = placeholderText;
}

function updateRegisterUserType(userType) {
    console.log('Updating register user type to:', userType);
    
    // Update hidden input
    document.getElementById('register-user-type').value = userType;

    // Update button styling
    document.querySelectorAll('#register-tab .user-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.user-type-btn').classList.add('active');

    // Show/hide user-specific fields
    const farmerFields = document.getElementById('farmer-fields');
    const researcherFields = document.getElementById('researcher-fields');

    if (userType === 'farmer') {
        farmerFields.style.display = 'block';
        researcherFields.style.display = 'none';
        
        // Make farmer fields required, researcher fields NOT required
        farmerFields.querySelectorAll('input, textarea').forEach(field => {
            if (field.id !== 'register-farm-size' && field.id !== 'register-postal-code') {
                field.setAttribute('required', '');
            }
        });
        researcherFields.querySelectorAll('input, textarea').forEach(field => {
            field.removeAttribute('required');
        });
    } else {
        farmerFields.style.display = 'none';
        researcherFields.style.display = 'block';
        
        // Make researcher fields required, farmer fields NOT required
        researcherFields.querySelectorAll('input, textarea').forEach(field => {
            if (field.id !== 'register-department' && field.id !== 'register-research-focus') {
                field.setAttribute('required', '');
            }
        });
        farmerFields.querySelectorAll('input, textarea').forEach(field => {
            field.removeAttribute('required');
        });
    }
    
    console.log('User type updated successfully');
}

function setFieldsRequired(container, isRequired) {
    const inputs = container.querySelectorAll('input[required], textarea[required]');
    inputs.forEach(input => {
        if (isRequired) {
            input.setAttribute('required', '');
        } else {
            input.removeAttribute('required');
        }
    });
}

// =====================================================
// FORM VALIDATION
// =====================================================
function setupFormValidation() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    console.log('Setting up form validation...');
    console.log('Login form:', loginForm);
    console.log('Register form:', registerForm);

    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
        console.log('Login form listener added');
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
        console.log('Register form listener added');
    } else {
        console.error('Register form NOT FOUND!');
    }
}

function handleLoginSubmit(e) {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    // Validation
    if (!username) {
        e.preventDefault();
        showAlert('Please enter your username', 'error');
        return false;
    }

    if (!password || password.length < 6) {
        e.preventDefault();
        showAlert('Password must be at least 6 characters', 'error');
        return false;
    }

    console.log('Login attempt:', { username });
    showAlert('Logging in...', 'success');
    
    // Let the form submit normally (don't prevent default)
    return true;
}

function handleRegisterSubmit(e) {
    console.log('=== REGISTER FORM SUBMIT HANDLER CALLED ===');
    
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const whatsapp = document.getElementById('register-whatsapp').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const userType = document.getElementById('register-user-type').value;
    const agreeTerms = document.querySelector('input[name="agree-terms"]').checked;

    console.log('Form data:', { username, email, whatsapp, userType, agreeTerms });

    // Basic validation
    if (!username || username.length < 3) {
        e.preventDefault();
        alert('Username must be at least 3 characters');
        return false;
    }

    if (!email || !email.includes('@')) {
        e.preventDefault();
        alert('Please enter a valid email address');
        return false;
    }

    if (!whatsapp || whatsapp.length < 10) {
        e.preventDefault();
        alert('Please enter a valid 10-digit WhatsApp number');
        return false;
    }

    if (!password || password.length < 8) {
        e.preventDefault();
        alert('Password must be at least 8 characters');
        return false;
    }

    if (password !== confirmPassword) {
        e.preventDefault();
        alert('Passwords do not match');
        return false;
    }

    if (userType === 'farmer') {
        const fullName = document.getElementById('register-full-name').value.trim();
        const city = document.getElementById('register-city').value.trim();
        const state = document.getElementById('register-state').value.trim();
        const address = document.getElementById('register-address').value.trim();

        if (!fullName) {
            e.preventDefault();
            alert('Please enter your full name');
            return false;
        }
        if (!city) {
            e.preventDefault();
            alert('Please enter your city');
            return false;
        }
        if (!state) {
            e.preventDefault();
            alert('Please enter your state');
            return false;
        }
        if (!address) {
            e.preventDefault();
            alert('Please enter your address');
            return false;
        }
    } else {
        const fullName = document.getElementById('register-full-name-researcher').value.trim();
        const organization = document.getElementById('register-organization').value.trim();

        if (!fullName) {
            e.preventDefault();
            alert('Please enter your full name');
            return false;
        }
        if (!organization) {
            e.preventDefault();
            alert('Please enter your organization');
            return false;
        }
    }

    if (!agreeTerms) {
        e.preventDefault();
        alert('Please agree to Terms & Conditions');
        return false;
    }

    console.log('All validations passed! Submitting form...');
    alert('Registration in progress...');
    
    // Let the form submit normally (don't prevent default)
    return true;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhoneNumber(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
}

function resetFormFields() {
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();

    // Reset user type selections
    document.querySelectorAll('.user-type-btn').forEach((btn, index) => {
        if (index % 2 === 0) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    
    // Remove existing alerts
    const existingAlerts = alertContainer.querySelectorAll('.alert');
    existingAlerts.forEach(alert => {
        alert.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => alert.remove(), 300);
    });

    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    alertContainer.appendChild(alert);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        alert.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

// =====================================================
// SWITCH TAB FROM FOOTER
// =====================================================
function setupSwitchTabs() {
    const switchTabLinks = document.querySelectorAll('.switch-tab');
    switchTabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.dataset.tab;
            const tabBtn = document.querySelector(`.tab-navigation .tab-btn[data-tab="${tabName}"]`);
            if (tabBtn) {
                tabBtn.click();
            }
        });
    });
}

// =====================================================
// WHATSAPP LOGIN (Placeholder)
// =====================================================
function handleWhatsAppLogin() {
    showAlert('WhatsApp login is being set up', 'info');
    // TODO: Implement WhatsApp OAuth integration
}

document.querySelectorAll('.btn-social').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        handleWhatsAppLogin();
    });
});

// =====================================================
// DYNAMIC FIELD REQUIREMENTS
// =====================================================
document.addEventListener('change', function(e) {
    // Update farmer fields visibility
    const farmerBtns = document.querySelectorAll('#register-tab .user-type-btn[data-type="farmer"]');
    const researcherBtns = document.querySelectorAll('#register-tab .user-type-btn[data-type="researcher"]');

    farmerBtns.forEach(btn => {
        if (btn.classList.contains('active')) {
            document.getElementById('farmer-fields').style.display = 'block';
            document.getElementById('researcher-fields').style.display = 'none';
        }
    });

    researcherBtns.forEach(btn => {
        if (btn.classList.contains('active')) {
            document.getElementById('farmer-fields').style.display = 'none';
            document.getElementById('researcher-fields').style.display = 'block';
        }
    });
});
