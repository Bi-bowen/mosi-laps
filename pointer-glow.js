(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (reducedMotion.matches || !finePointer.matches) return;

  const glow = document.createElement('div');
  glow.className = 'global-pointer-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.append(glow);
  document.documentElement.dataset.pointerGlow = 'enabled';

  const targetSelector = 'a, button, input, select, textarea, [role="button"], .platform.wechat';
  document.querySelectorAll(targetSelector).forEach((target) => {
    target.dataset.pointerGlowTarget = '';
  });

  let frame = 0;
  let x = -1000;
  let y = -1000;

  const render = () => {
    frame = 0;
    glow.style.setProperty('--glow-x', `${x}px`);
    glow.style.setProperty('--glow-y', `${y}px`);
  };

  document.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    x = event.clientX;
    y = event.clientY;
    glow.classList.add('is-visible');
    if (!frame) frame = window.requestAnimationFrame(render);
  }, { passive: true });

  document.addEventListener('pointerover', (event) => {
    const target = event.target.closest(targetSelector);
    glow.classList.toggle('is-over-control', Boolean(target));
  });

  document.addEventListener('pointerout', (event) => {
    if (event.relatedTarget) return;
    glow.classList.remove('is-visible', 'is-over-control');
  });

  window.addEventListener('blur', () => glow.classList.remove('is-visible'));
})();