// Fix Anchor Routing (Ensures links scroll on the 1st click with Lenis active)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
anchor.addEventListener('click', function (e) {
const targetId = this.getAttribute('href');
if (targetId === '#' || !targetId) return;

const targetElement = document.querySelector(targetId);
if (targetElement) {
e.preventDefault();
targetElement.scrollIntoView({ behavior: 'smooth' });
history.pushState(null, '', targetId); // Update URL safely
}
});
});
