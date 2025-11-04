// Tab switching
function showTab(tab) {
    const tabs = document.querySelectorAll('.tab');
    const forms = document.querySelectorAll('.form-container');
    
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
        tabs[0].classList.add('active');
        document.getElementById('login-form').classList.add('active');
    } else {
        tabs[1].classList.add('active');
        document.getElementById('register-form').classList.add('active');
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password'),
        user_type: formData.get('user_type')
    };
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(loginData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store user data with consistent key name
            const userData = {
                user_id: data.user.id,
                user_name: data.user.name,
                user_type: data.user.type,
                email: data.user.email,
                phone: data.user.phone
            };
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Redirect based on user type
            if (data.user.type === 'farmer') {
                window.location.href = 'farmer-dashboard.html';
            } else {
                window.location.href = 'research-dashboard.html';
            }
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

// Handle registration
async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const registerData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password'),
        location: {
            address: formData.get('address')
        }
    };
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Registration successful! Please login.');
            showTab('login');
            form.reset();
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
}
