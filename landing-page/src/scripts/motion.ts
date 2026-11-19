import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
const media = gsap.matchMedia();
media.add({ desktop: '(min-width: 1000px) and (min-height: 700px)', motion: '(prefers-reduced-motion: no-preference)' }, (context) => {
  if (!context.conditions?.motion) return;
  const desktop = context.conditions.desktop;
  const scene = document.querySelector<HTMLElement>('.change-section')!;
  scene.classList.add('motion-scene');
  gsap.from('.hero-copy > *', { y: 45, opacity: 0, duration: .9, stagger: .1, ease: 'power3.out', clearProps: 'all' });
  gsap.from('.hero-product', { y: 70, rotation: 3, opacity: 0, duration: 1.2, ease: 'power3.out', clearProps: 'all' });
  gsap.to('.scroll-progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .2 } });
  gsap.to('.hero h1', { y: desktop ? -90 : -25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
  gsap.to('.hero-product .product-window', { y: desktop ? -100 : -25, rotation: desktop ? -3 : 0, scale: desktop ? .94 : 1, ease: 'none', scrollTrigger: { trigger: '.hero-product', start: 'top 20%', end: 'bottom top', scrub: 1 } });
  gsap.to('.orbit-label', { rotation: 100, y: -60, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
  gsap.utils.toArray<HTMLElement>('.pain-grid article').forEach((element, i) => {
    gsap.from(element, { x: (i - 1) * 70, y: 80, rotation: (i - 1) * 5, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.pain-grid', start: 'top 95%', end: 'top 45%', scrub: .7 } });
  });
  // Pin the outer section, animate only its children. Scrolling backwards reverses the story.
  const transformation = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: {
    trigger: scene, start: desktop ? 'top top' : 'top 30%', end: desktop ? '+=1200' : 'bottom 65%', pin: desktop, scrub: .65, invalidateOnRefresh: true,
  } });
  transformation
    .from('.scattered-tools > span', { x: (i) => i % 2 ? 70 : -70, y: (i) => i < 2 ? -35 : 35, rotation: (i) => i % 2 ? 14 : -14, stagger: .08, duration: .6 })
    .to('.scene-meter span', { scaleX: 1, duration: 2.6, ease: 'none' }, 0)
    .to('.scattered-tools > span', { x: 0, y: 55, rotation: 0, scale: .6, opacity: 0, stagger: .06, duration: .65 }, .8)
    .to('.before-flow', { opacity: .15, scale: .9, duration: .6 }, 1)
    .from('.after-flow', { y: 130, scale: .8, rotation: -8, opacity: 0, duration: .85 }, 1.2)
    .from('.context-tags span', { y: 25, opacity: 0, scale: .7, stagger: .12, duration: .4 }, 1.8)
    .from('.after-flow .status-pill', { scale: .6, opacity: 0, duration: .4 }, 2.2);
  gsap.utils.toArray<HTMLElement>('.section-intro, .feature-card, .integration-copy, .pricing-card, .faq-layout').forEach((element) => {
    gsap.from(element, { y: 65, opacity: 0, duration: .85, ease: 'power3.out', clearProps: 'all', scrollTrigger: { trigger: element, start: 'top 90%', once: true } });
  });
  const workflow = gsap.timeline({ scrollTrigger: { trigger: '.workflow', start: 'top 85%', end: desktop ? 'bottom 35%' : 'bottom 75%', scrub: .5 } });
  gsap.utils.toArray<HTMLElement>('.workflow li').forEach((element) => {
    workflow.from(element, { y: 45, opacity: .25, duration: .4 })
      .from(element.querySelector('.workflow-icon'), { scale: .65, rotation: -35, duration: .35 }, '<')
      .to(element.querySelector('.workflow-icon'), { backgroundColor: '#ff6a16', color: '#14100e', duration: .2 }, '<.15');
  });
  gsap.from('.integration-tile', { y: 65, scale: .7, rotation: (i) => i % 2 ? 10 : -10, opacity: 0, stagger: .12, ease: 'none', scrollTrigger: { trigger: '.integration-board', start: 'top 90%', end: 'bottom 65%', scrub: .7 } });
  gsap.from('.final-cta h2', { x: -70, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.final-cta', start: 'top 95%', end: 'top 45%', scrub: .6 } });
  gsap.to('.cta-symbol', { rotation: 180, ease: 'none', scrollTrigger: { trigger: '.final-cta', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  return () => scene.classList.remove('motion-scene');
});
void document.fonts.ready.then(() => ScrollTrigger.refresh());
document.querySelectorAll('details').forEach((item) => item.addEventListener('toggle', () => ScrollTrigger.refresh()));
document.querySelector('.menu-toggle')?.addEventListener('click', () => ScrollTrigger.refresh());
document.addEventListener('astro:before-swap', () => media.revert(), { once: true });
