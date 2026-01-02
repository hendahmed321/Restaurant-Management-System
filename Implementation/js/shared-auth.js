// js/shared-auth.js
document.addEventListener('DOMContentLoaded', function() {
    const authButton = document.getElementById('authButton');
    if (!authButton) return;
    
    // Check login status
    const user = JSON.parse(localStorage.getItem('user')) || null;
    
    if (user) {
        authButton.textContent = "ACCOUNT";
        authButton.onclick = function() {
            window.location.href = 'auth.html';
        };
    } else {
        authButton.textContent = "SIGN IN";
        authButton.onclick = function() {
            window.location.href = 'auth.html';
        };
    }
});