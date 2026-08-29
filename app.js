const nav = document.getElementById("nav"), dock = document.getElementById("dock");
const onScroll = () => {
  nav.classList.toggle("solid", scrollY > 50);
  dock.classList.toggle("up", scrollY > innerHeight * .6);
};
addEventListener("scroll", onScroll, {passive:true}); onScroll();

/* Reveal: observer + scroll sweep + 3s failsafe.
   Nothing here is allowed to stay invisible because a script hiccuped. */
const rvs = [...document.querySelectorAll(".rv")];
const show = el => el.classList.add("in");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
  }), {threshold:.08, rootMargin:"0px 0px -6% 0px"});
  rvs.forEach(el => io.observe(el));
} else { rvs.forEach(show); }
const sweep = () => rvs.forEach(el => {
  if (el.classList.contains("in")) return;
  const r = el.getBoundingClientRect();
  if (r.top < innerHeight * .94 && r.bottom > 0) show(el);
});
addEventListener("scroll", sweep, {passive:true});
addEventListener("resize", sweep, {passive:true});
addEventListener("load", sweep); sweep();
setTimeout(() => rvs.forEach(show), 3000);

/* Lightbox */
const lb = document.getElementById("lb"), lbImg = document.getElementById("lbImg");
const figs = [...document.querySelectorAll("#gal figure")];
let last = null;
const open = f => {
  last = document.activeElement;
  const i = f.querySelector("img");
  lbImg.hidden = false;
  lbImg.src = i.src.replace(/w=\d+/, "w=1500");
  lbImg.alt = i.alt;
  lb.classList.add("open");
  document.body.style.overflow = "hidden";
  document.getElementById("lbX").focus();
};
const close = () => {
  lb.classList.remove("open");
  document.body.style.overflow = "";
  if (last) last.focus();
};
figs.forEach(f => {
  f.addEventListener("click", () => open(f));
  f.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(f); }
  });
});
document.getElementById("lbX").addEventListener("click", close);
lb.addEventListener("click", e => { if (e.target === lb) close(); });
addEventListener("keydown", e => { if (e.key === "Escape" && lb.classList.contains("open")) close(); });
