// Copy buttons
document.addEventListener('click', (e) => {
  if (!e.target.classList.contains('copy-btn')) return;
  const code = e.target.nextElementSibling.textContent;
  navigator.clipboard.writeText(code).then(() => {
    e.target.textContent = 'Copied';
    e.target.classList.add('copied');
    setTimeout(() => { e.target.textContent = 'Copy'; e.target.classList.remove('copied'); }, 2000);
  });
});

// Sidebar active link on scroll
const sections = document.querySelectorAll('.doc-section');
const links = document.querySelectorAll('.sidebar-link');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      links.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.sidebar-link[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-20% 0px -70% 0px' });

sections.forEach(s => observer.observe(s));
