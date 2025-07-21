// js/index.js
function initIndexPage() {
  const kata = "TEMUKANAKU";
  const container = document.getElementById('letterContainer');
  // Pastikan container bersih sebelum menambahkan huruf baru (jika halaman dimuat ulang)
  if (container) {
      container.innerHTML = '';
  }
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  // Mengurangi jumlah floating-letters untuk meningkatkan performa di APK
  const numberOfLetters = 10; // Mengurangi dari 30 menjadi 10

  for (let i = 0; i < numberOfLetters; i++) {
    const box = document.createElement('div');
    box.className = 'letter-box';
    box.innerText = kata[Math.floor(Math.random() * kata.length)];

    const x = Math.random() * screenW;
    const y = Math.random() * screenH;
    const delay = Math.random() * 5;

    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    box.style.animationDelay = `${delay}s`;
    box.style.animationDuration = `${6 + Math.random() * 4}s`;

    if (container) {
        container.appendChild(box);
    }
  }
}