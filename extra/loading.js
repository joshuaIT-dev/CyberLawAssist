(() => {
  const bar = (width = '100%', height = '14px') => '<span class="cla-skeleton" style="width:' + width + ';height:' + height + '" aria-hidden="true"></span>';
  const cards = () => '<div class="cla-skeleton-cards">' + Array.from({ length: 3 }, () => '<div class="cla-skeleton-card">' + bar('40px', '40px') + bar('55%', '24px') + bar('75%') + '</div>').join('') + '</div>';
  const section = () => '<section class="cla-skeleton-section" role="status" aria-label="Loading content"><span class="cla-visually-hidden">Loading content. Please wait.</span>' + cards() + '<div class="cla-skeleton-card cla-skeleton-table">' + bar('40%', '20px') + Array.from({ length: 5 }, () => bar('100%', '28px')).join('') + '</div></section>';
  const page = () => '<div class="cla-skeleton-shell"><aside class="cla-skeleton-sidebar" aria-hidden="true">' + bar('75%', '34px') + Array.from({ length: 8 }, () => bar('100%', '30px')).join('') + '</aside><main class="cla-skeleton-main"><div class="cla-skeleton-heading" aria-hidden="true">' + bar('42%', '30px') + bar('65%') + '</div>' + section() + '</main></div>';
  window.CLA_LOADING = { page, section };
})();
