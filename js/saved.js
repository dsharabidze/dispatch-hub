import { getSaved, setSaved } from './api.js';

// თუ მომხმარებელი არ არის ავტორიზებული — login.html-ზე გადამისამართება
if (!localStorage.getItem('user')) {
  window.location.href = 'login.html';
}

document.getElementById('nav-user').textContent = localStorage.getItem('user') || '';

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('user');
  document.cookie = 'authorized=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
  window.location.href = 'login.html';
});

function renderSaved() {
  const items = getSaved();
  const grid = document.getElementById('saved-grid');
  const empty = document.getElementById('saved-empty');

  grid.innerHTML = '';

  if (!items.length) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  items.forEach(item => {
    const card = document.createElement('article');
    // ბარათის შიგთავსი აქ

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'წაშლა';
    removeBtn.addEventListener('click', () => {
      const updated = getSaved().filter(saved => saved.id !== item.id);
      setSaved(updated);
      renderSaved();
    });

    card.appendChild(removeBtn);
    grid.appendChild(card);
  });
}

renderSaved();
