import { fetchData, getSaved, setSaved } from './api.js';

// თუ მომხმარებელი არ არის ავტორიზებული — გადამისამართება login.html-ზე
if (!localStorage.getItem('user')) {
  window.location.href = 'login.html';
}

document.getElementById('nav-user').textContent = localStorage.getItem('user') || '';

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('user');
  document.cookie = 'authorized=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
  window.location.href = 'login.html';
});

// --- სტეიტი ---
// შეინახე მდგომარეობა ობიექტების მასივში
let savedItems = getSaved();

function showLoading() {}

function showError(message) {}

function renderResults(items) {
  // თითოეული item-ისთვის შექმენი ბარათის ელემენტი
  // forEach-ის შიგნით handler ხურავს item-ზე — ეს შენი closure-ია
  items.forEach(item => {
    const card = document.createElement('article');
    // ბარათის შიგთავსი აქ
    document.getElementById('results-grid').appendChild(card);
  });
}

document.getElementById('search-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  // ვალიდაცია, showLoading/showError გამოძახება, fetchData, renderResults
});
