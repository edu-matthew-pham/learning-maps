// presentation.js
// Full-screen presentation mode for Topic Explorer.

import { hexToRgba } from './utils.js';

// ─── Slide builder ────────────────────────────────────────────────────────────

function buildSlides(mapData) {
  const slides = [];
  slides.push({ type: 'title', data: mapData });
  if (mapData.journey) slides.push({ type: 'inquiry', data: mapData.journey });
  slides.push({ type: 'cluster-overview', data: mapData });
  (mapData.clusters || []).forEach(cluster => {
    slides.push({ type: 'cluster', data: cluster });
  });
  // Close with inquiry challenge as reflection prompt
  if (mapData.journey) slides.push({ type: 'inquiry', data: mapData.journey });

  return slides;
}

// ─── Slide renderers ──────────────────────────────────────────────────────────

function renderSlide(slide, container) {
  container.innerHTML = '';
  switch (slide.type) {
    case 'title':            renderTitleSlide(slide.data, container);    break;
    case 'inquiry':          renderInquirySlide(slide.data, container);  break;
    case 'cluster-overview': renderClusterOverview(slide.data, container); break;
    case 'cluster':          renderClusterSlide(slide.data, container);  break;
  }
}

function renderTitleSlide(mapData, el) {
  el.innerHTML = `
    <div class="pres-slide pres-title-slide">
      <div class="pres-inner pres-inner--center">
        <div class="pres-eyebrow">Topic Explorer</div>
        <h1 class="pres-title">${mapData.title || ''}</h1>
        <p class="pres-subtitle-text">${mapData.subtitle || ''}</p>
      </div>
    </div>
  `;
}

function renderInquirySlide(journey, el) {
  el.innerHTML = `
    <div class="pres-slide pres-inquiry-slide">
      <div class="pres-inner pres-inner--center">
        <div class="pres-eyebrow">${journey.title || 'Inquiry Challenge'}</div>
        <blockquote class="pres-inquiry-q">${journey.text || ''}</blockquote>
        ${journey.guidance ? `<p class="pres-inquiry-guidance">${journey.guidance}</p>` : ''}
      </div>
    </div>
  `;
}

function renderClusterOverview(mapData, el) {
  const clusters = mapData.clusters || [];
  const cards = clusters.map(c => {
    const bg     = hexToRgba(c.color || '#666', 0.14);
    const border = hexToRgba(c.color || '#666', 0.4);
    return `
      <div class="pres-ov-card" style="background:${bg};border-color:${border};">
        <div class="pres-ov-card-title" style="color:${c.light || '#fff'}">${c.title}</div>
        <div class="pres-ov-card-desc">${c.description || ''}</div>
      </div>
    `;
  }).join('');

  el.innerHTML = `
    <div class="pres-slide pres-ov-slide">
      <div class="pres-inner pres-inner--full">
        <div class="pres-ov-header">
          <div class="pres-eyebrow">Topic Structure</div>
          <h2 class="pres-section-title">${mapData.title}</h2>
        </div>
        <div class="pres-ov-grid">${cards}</div>
      </div>
    </div>
  `;
}

function renderClusterSlide(cluster, el) {
  const nodes = cluster.nodes || [];
  const bg     = hexToRgba(cluster.color || '#666', 0.07);
  const accent = cluster.color || '#666';

  const nodeCards = nodes.map(n => `
    <div class="pres-node-card" style="border-color:${hexToRgba(cluster.color || '#666', 0.35)};">
      <div class="pres-node-title" style="color:${cluster.light || '#fff'}">${n.title}</div>
      <div class="pres-node-subtitle">${n.subtitle || ''}</div>
      <div class="pres-node-desc">${n.description || ''}</div>
    </div>
  `).join('');

  el.innerHTML = `
    <div class="pres-slide pres-cluster-slide" style="background:${bg};">
      <div class="pres-inner pres-inner--full pres-inner--scroll">
        <div class="pres-cluster-top">
          <div class="pres-cluster-label">
            <div class="pres-cluster-accent-bar" style="background:${accent};"></div>
            <div class="pres-eyebrow" style="color:${cluster.light || '#aaa'}">Cluster</div>
            <h2 class="pres-section-title" style="color:${cluster.light || '#fff'}">${cluster.title}</h2>
            <p class="pres-cluster-desc">${cluster.description || ''}</p>
          </div>
        </div>
        <div class="pres-node-grid">${nodeCards}</div>
      </div>
    </div>
  `;
}

// ─── Overlay ──────────────────────────────────────────────────────────────────

function buildOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'pres-overlay';
  overlay.innerHTML = `
    <div id="pres-slide-container"></div>
    <div id="pres-controls">
      <button id="pres-prev" title="Previous (←)">&#8592;</button>
      <div id="pres-counter"></div>
      <button id="pres-next" title="Next (→)">&#8594;</button>
    </div>
    <button id="pres-exit" title="Exit (Esc)">&#x2715;</button>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function startPresentation(mapData) {
  const slides = buildSlides(mapData);
  let current = 0;

  document.getElementById('pres-overlay')?.remove();
  const overlay   = buildOverlay();
  const container = document.getElementById('pres-slide-container');
  const counter   = document.getElementById('pres-counter');

  function show(index) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    renderSlide(slides[current], container);
    counter.textContent = `${current + 1} / ${slides.length}`;
    document.getElementById('pres-prev').disabled = current === 0;
    document.getElementById('pres-next').disabled = current === slides.length - 1;
  }

  function exit() {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') show(current + 1);
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   show(current - 1);
    if (e.key === 'Escape') exit();
  }

  document.getElementById('pres-next').addEventListener('click', () => show(current + 1));
  document.getElementById('pres-prev').addEventListener('click', () => show(current - 1));
  document.getElementById('pres-exit').addEventListener('click', exit);
  document.addEventListener('keydown', onKey);

  show(0);
}