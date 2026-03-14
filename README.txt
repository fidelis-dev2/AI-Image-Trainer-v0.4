PoultryVision AI - Lightweight Static Version
============================================

What changed:
- Removed MobileNet completely
- No heavy model loading
- Fast browser-only training using centroid classifier
- HTML + CSS + JS only
- Bootstrap 5 + SweetAlert2
- Login, register, admin users, dashboard, training, prediction
- Training image previews appear below each class uploader

Demo accounts:
- admin / admin123
- analyst / analyst123
- user / user123

How to run:
1. Open this folder with a local server.
2. Example:
   python -m http.server 8080
3. Then open:
   http://localhost:8080/

Notes:
- Data is stored in browser localStorage.
- If you want a fresh start, clear browser site data.
- This classifier is lightweight and fast, but less accurate than deep learning models.
- Best results come from using clear images with consistent classes.
