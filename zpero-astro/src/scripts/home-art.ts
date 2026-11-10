const home = document.querySelector<HTMLElement>('.journal-home');
const hero = home?.querySelector<HTMLElement>('.journal-hero');

if (home && hero) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let visible = false;
  let frame = 0;
  let pointer: { x: number; y: number } | null = null;
  const entrances = new Set<Animation>();

  const paint = () => {
    frame = 0;
    if (reducedMotion.matches || !visible || document.hidden) return;
    const rect = hero.getBoundingClientRect();
    // Stay inside the image's existing breathing overscan, preserving its crop.
    const travel = Math.min(4, Math.max(-4, -rect.top * .012));
    hero.style.setProperty('--art-scroll', `${travel.toFixed(2)}px`);
    if (pointer) {
      hero.style.setProperty('--art-x', `${pointer.x - rect.left}px`);
      hero.style.setProperty('--art-y', `${pointer.y - rect.top}px`);
    }
  };
  const schedule = () => {
    if (!frame && visible && !reducedMotion.matches && !document.hidden) {
      frame = requestAnimationFrame(paint);
    }
  };

  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    const img = hero.querySelector('img');
    if (img) img.style.animationPlayState = visible && !document.hidden ? 'running' : 'paused';
    schedule();
  });
  visibility.observe(hero);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('visibilitychange', () => {
    const img = hero.querySelector('img');
    if (img) img.style.animationPlayState = visible && !document.hidden ? 'running' : 'paused';
    schedule();
  });
  hero.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || reducedMotion.matches || event.pointerType === 'touch') return;
    pointer = { x: event.clientX, y: event.clientY };
    hero.classList.add('is-art-lit');
    schedule();
  });
  hero.addEventListener('pointerleave', () => {
    pointer = null;
    hero.classList.remove('is-art-lit');
  });

  // Animate each existing section once, without hiding content before JS loads.
  const reveal = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      reveal.unobserve(entry.target);
      if (reducedMotion.matches) continue;
      const animation = entry.target.animate(
        [{ opacity: .65, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 650, easing: 'cubic-bezier(.22, 1, .36, 1)' },
      );
      entrances.add(animation);
      animation.finished.then(() => entrances.delete(animation)).catch(() => entrances.delete(animation));
    }
  }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
  home.querySelectorAll(':scope > section:not(.journal-hero)').forEach((section) => reveal.observe(section));

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      entrances.forEach((animation) => animation.cancel());
      hero.style.removeProperty('--art-scroll');
      hero.classList.remove('is-art-lit');
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    } else schedule();
  });
}
