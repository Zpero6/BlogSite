const initializeSpotlights = () => {
  document.querySelectorAll<HTMLElement>('.card-spotlight').forEach((card) => {
    if (card.dataset.spotlightBound) return;
    card.dataset.spotlightBound = 'true';
    let frame = 0;
    let x = 0;
    let y = 0;
    const update = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const rect = card.getBoundingClientRect();
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
      card.classList.add('is-spotlit');
      if (frame) return;
      frame = requestAnimationFrame(() => {
        card.style.setProperty('--spot-x', `${x}px`);
        card.style.setProperty('--spot-y', `${y}px`);
        frame = 0;
      });
    };
    card.addEventListener('pointerenter', update);
    card.addEventListener('pointermove', update);
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-spotlit');
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    });
  });
};
initializeSpotlights();
document.addEventListener('astro:page-load', initializeSpotlights);

