// js/level-select.js
function initLevelSelectPage(levelsData) {
  let lastVisitedLevel = parseInt(localStorage.getItem('last_visited_level')) || 1;
  
  const maxAvailableLevel = levelsData.length;

  const levelGrid = document.getElementById('levelGrid');
  if (!levelGrid) {
    console.error("Elemen #levelGrid tidak ditemukan.");
    return;
  }
  levelGrid.innerHTML = ''; // Pastikan grid bersih sebelum menambahkan tombol

  // Buat tombol untuk setiap level yang tersedia
  for (let i = 1; i <= maxAvailableLevel; i++) {
    const btn = document.createElement('button');
    btn.innerText = ` ${i}`;
    btn.className = 'level-btn';

    // Logika untuk menandai dan menonaktifkan level
    // Level yang lebih kecil dari 'lastVisitedLevel' dianggap sudah dilewati/selesai
    if (i < lastVisitedLevel) {
      btn.classList.add('completed'); // Tandai sebagai selesai (untuk warna abu-abu)
      btn.disabled = true;           // Nonaktifkan agar tidak dapat dimainkan ulang
    } 
    // Level yang sama dengan 'lastVisitedLevel' adalah level yang sedang aktif/belum selesai.
    // Ini tetap aktif dan berwarna biru (default .level-btn).
    // Level yang lebih besar dari 'lastVisitedLevel' terkunci dan dinonaktifkan (warna orange).
    else if (i > lastVisitedLevel) {
      btn.disabled = true;           // Nonaktifkan tombol untuk level yang belum terbuka (warna orange)
    }
    // Jika i === lastVisitedLevel, tombol tetap aktif dan mengambil gaya default (.level-btn) yaitu biru

    btn.onclick = () => {
      // Saat level diklik, simpan sebagai level terakhir yang dikunjungi
      // Ini hanya akan tereksekusi untuk tombol yang TIDAK disabled
      localStorage.setItem('last_visited_level', i);
      window.location.hash = '#game';
    };

    levelGrid.appendChild(btn);
  }
}