seedApp();
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const togglePassword = document.getElementById('togglePassword');

if (togglePassword) {
  togglePassword.addEventListener('click', () => {
    const input = document.getElementById('password');
    input.type = input.type === 'password' ? 'text' : 'password';
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const user = getUsers().find(u => u.username === username && u.password === password);
    if (!user) {
      Swal.fire({ icon: 'error', title: 'Login failed', text: 'Invalid username or password.' });
      return;
    }
    saveSession({ id: user.id, fullName: user.fullName, username: user.username, role: user.role });
    Swal.fire({ icon: 'success', title: 'Welcome', text: `Hello ${user.fullName}` }).then(() => location.href = 'dashboard.html');
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value.trim();
    const username = document.getElementById('newUsername').value.trim();
    const email = document.getElementById('email').value.trim();
    const role = document.getElementById('role').value;
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (password !== confirmPassword) {
      Swal.fire({ icon: 'warning', title: 'Passwords do not match' });
      return;
    }
    const users = getUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      Swal.fire({ icon: 'warning', title: 'Username already exists' });
      return;
    }
    users.push({ id: crypto.randomUUID(), fullName, username, email, password, role });
    saveUsers(users);
    Swal.fire({ icon: 'success', title: 'Account created successfully' }).then(() => location.href = 'index.html');
  });
}
