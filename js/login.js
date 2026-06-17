// უკვე ავტორიზებული მომხმარებელი — მთავარ გვერდზე გადამისამართება
if (localStorage.getItem('user')) {
  window.location.href = 'index.html';
}

document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('name-input').value.trim();
  const errorEl = document.getElementById('login-error');

  if (!name) {
    errorEl.textContent = 'გთხოვთ შეიყვანოთ სახელი.';
    errorEl.hidden = false;
    return;
  }

  errorEl.hidden = true;

  // მომხმარებლის სახელი ინახება localStorage-ში, სეტდება სესიური cookie
  localStorage.setItem('user', name);
  document.cookie = 'authorized=true; path=/';

  window.location.href = 'index.html';
});
