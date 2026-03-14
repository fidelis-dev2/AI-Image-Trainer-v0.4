const sessionUsers = attachCommonUi();
if (!sessionUsers || sessionUsers.role !== 'admin') {
  Swal.fire({ icon: 'error', title: 'Access denied' }).then(() => location.href = 'dashboard.html');
} else {
  const body = document.getElementById('usersTableBody');
  function renderUsers() {
    const users = getUsers();
    body.innerHTML = users.map(u => `
      <tr>
        <td>${u.fullName}</td>
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td><span class="badge text-bg-primary">${u.role}</span></td>
        <td>${u.role === 'admin' ? '' : `<button class="btn btn-sm btn-outline-danger" data-id="${u.id}">Remove</button>`}</td>
      </tr>`).join('');

    body.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        Swal.fire({ icon: 'question', title: 'Remove user?', showCancelButton: true }).then(res => {
          if (!res.isConfirmed) return;
          saveUsers(getUsers().filter(u => u.id !== id));
          renderUsers();
        });
      });
    });
  }
  renderUsers();
}
