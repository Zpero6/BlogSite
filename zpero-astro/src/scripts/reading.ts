const root = document.querySelector<HTMLElement>('.reading-article');
if (root) {
  const content = document.getElementById('reading-content')!;
  const title = document.getElementById('reading-title')!;
  const normalize = (text: string) => text.replace(/\s/g, '').toLowerCase();
  const first = content.firstElementChild;
  if (first?.tagName === 'H1' && normalize(first.textContent ?? '') === normalize(title.textContent ?? '')) (first as HTMLElement).hidden = true;

  const tocDialog = document.querySelector<HTMLDialogElement>('#reading-toc-dialog');
  const tocOpen = document.getElementById('reading-toc-open');
  tocOpen?.addEventListener('click', () => { tocDialog?.showModal(); tocOpen.setAttribute('aria-expanded', 'true'); });
  tocDialog?.addEventListener('close', () => tocOpen?.setAttribute('aria-expanded', 'false'));
  document.querySelectorAll<HTMLDialogElement>('.reading-toc-dialog,.reading-lightbox').forEach((dialog) => {
    dialog.querySelector('[data-reading-close]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom || dialog.classList.contains('reading-lightbox')) dialog.close();
    });
  });
  tocDialog?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => tocDialog.close()));

  const links = [...document.querySelectorAll<HTMLElement>('[data-reading-toc]')];
  const headings = [...content.querySelectorAll<HTMLElement>('h1[id],h2[id],h3[id],h4[id]')].filter((heading) => !heading.hidden);
  const progress = document.querySelector<HTMLElement>('.reading-progress');
  const bar = progress?.querySelector<HTMLElement>('span');
  const top = document.getElementById('reading-top')!;
  const ring = document.querySelector<SVGCircleElement>('.reading-top__progress');
  let active = '';
  const update = () => {
    let id = headings[0]?.id ?? '';
    for (const heading of headings) if (heading.getBoundingClientRect().top <= 140) id = heading.id;
    if (id !== active) {
      active = id;
      links.forEach((link) => {
        const current = link.dataset.readingToc === id;
        if (current) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
        const container = link.closest<HTMLElement>('[data-reading-toc-scroll]');
        if (!current || !container || !container.getClientRects().length) return;
        const c = container.getBoundingClientRect();
        const l = link.getBoundingClientRect();
        if (l.top < c.top) container.scrollTop -= c.top - l.top + 8;
        else if (l.bottom > c.bottom) container.scrollTop += l.bottom - c.bottom + 8;
      });
    }
    const start = root.getBoundingClientRect().top + scrollY - 110;
    const end = content.getBoundingClientRect().bottom + scrollY - innerHeight;
    const value = Math.max(0, Math.min(1, (scrollY - start) / Math.max(1, end - start)));
    if (bar) bar.style.transform = `scaleX(${value})`;
    progress?.setAttribute('aria-valuenow', String(Math.round(value * 100)));
    if (ring) ring.style.strokeDashoffset = String(132 * (1 - value));
    top.hidden = scrollY < 300;
  };
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; update(); });
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('hashchange', schedule);
  document.addEventListener('load', schedule, true);
  top.addEventListener('click', () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));

  const lightbox = document.querySelector<HTMLDialogElement>('#reading-lightbox')!;
  const imageTarget = document.querySelector<HTMLImageElement>('#reading-lightbox-image')!;
  const caption = document.getElementById('reading-lightbox-caption')!;
  const zoom = document.getElementById('reading-zoom')!;
  const toggleZoom = () => {
    const expanded = lightbox.classList.toggle('is-zoomed');
    zoom.setAttribute('aria-pressed', String(expanded));
    zoom.textContent = expanded ? '适应屏幕' : '放大原图';
  };
  zoom.addEventListener('click', toggleZoom);
  imageTarget.addEventListener('click', toggleZoom);
  lightbox.addEventListener('close', () => {
    lightbox.classList.remove('is-zoomed');
    imageTarget.removeAttribute('src');
    caption.textContent = '';
    zoom.setAttribute('aria-pressed', 'false');
    zoom.textContent = '放大原图';
  });
  document.querySelectorAll<HTMLImageElement>('.markdown-prose img,.reading-cover img').forEach((image) => {
    if (image.closest('a')) return;
    const opener = document.createElement('button');
    opener.type = 'button';
    opener.className = 'reading-image-opener';
    opener.setAttribute('aria-label', `放大查看：${image.alt || '文章图片'}`);
    image.before(opener);
    opener.append(image);
    opener.addEventListener('click', () => {
      imageTarget.src = image.currentSrc || image.src;
      imageTarget.alt = image.alt;
      caption.textContent = /^image-|^Pasted/i.test(image.alt) ? '' : image.alt;
      lightbox.showModal();
    });
  });

  content.querySelectorAll<HTMLPreElement>('pre').forEach((pre, index) => {
    const code = pre.querySelector('code');
    if (!code) return;
    const text = code.textContent ?? '';
    const box = document.createElement('div');
    box.className = 'reading-codebox';
    pre.before(box);
    const toolbar = document.createElement('div');
    toolbar.className = 'reading-codebar';
    const language = document.createElement('span');
    language.textContent = pre.dataset.language || code.className.match(/language-([\w-]+)/)?.[1] || '代码';
    toolbar.append(language);
    const actions = document.createElement('div');
    actions.className = 'reading-code-actions';
    const wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.textContent = '自动换行';
    wrap.setAttribute('aria-pressed', 'false');
    wrap.addEventListener('click', () => wrap.setAttribute('aria-pressed', String(box.classList.toggle('is-wrapped'))));
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.textContent = '复制';
    copy.setAttribute('aria-label', `复制第 ${index + 1} 段代码`);
    copy.addEventListener('click', async () => {
      const status = document.getElementById('reading-status')!;
      try { await navigator.clipboard.writeText(text); copy.textContent = '已复制'; status.textContent = '代码已复制'; }
      catch { copy.textContent = '复制失败'; status.textContent = '复制失败，请手动选择代码'; }
      setTimeout(() => { copy.textContent = '复制'; }, 1800);
    });
    actions.append(wrap, copy);
    toolbar.append(actions);
    box.append(toolbar, pre);
    if (pre.scrollHeight > 400) {
      const expand = document.createElement('button');
      expand.type = 'button';
      expand.className = 'reading-code-expand';
      expand.textContent = '展开代码';
      expand.setAttribute('aria-expanded', 'false');
      expand.addEventListener('click', () => {
        const expanded = box.classList.toggle('is-expanded');
        expand.setAttribute('aria-expanded', String(expanded));
        expand.textContent = expanded ? '收起代码' : '展开代码';
      });
      box.append(expand);
    }
  });
  content.querySelectorAll('table').forEach((table) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'reading-table-wrap';
    wrapper.tabIndex = 0;
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', '文章表格，可横向滚动');
    table.before(wrapper);
    wrapper.append(table);
  });
  content.querySelectorAll('blockquote').forEach((quote) => {
    const firstText = quote.querySelector('p')?.firstChild;
    if (!firstText || firstText.nodeType !== Node.TEXT_NODE) return;
    const match = firstText.textContent?.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
    if (!match) return;
    firstText.textContent = (firstText.textContent ?? '').slice(match[0].length);
    quote.classList.add('reading-alert');
    const label = document.createElement('div');
    label.className = 'reading-alert__title';
    label.textContent = ({ NOTE: '说明', TIP: '提示', IMPORTANT: '重点', WARNING: '注意', CAUTION: '提醒' } as Record<string, string>)[match[1].toUpperCase()];
    quote.prepend(label);
  });
  update();
}
