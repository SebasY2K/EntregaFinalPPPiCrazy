/* CRAZY Store v4 - UI, filtros, subcategorías de accesorios y modal con material */
const CrazyUI = (function () {
  function cop(n) { return '$' + Number(n || 0).toLocaleString('es-CO') + ' COP'; }

  function updateHeader() {
    const cart = CrazyDB.getCarrito();
    const count = cart.reduce((s, i) => s + i.cantidad, 0);
    const badge = document.getElementById('nav-cart-count');
    if (badge) badge.textContent = count;
    const user = CrazyDB.getSesion();
    const uLink = document.getElementById('nav-user-label');
    if (uLink) uLink.textContent = user ? `Hola, ${user.nombre.split(' ')[0]}` : 'Iniciar sesión / Registro';
  }

  function renderCatalogPage(config) {
    const inv = CrazyDB.getInventario();
    const grid = document.getElementById('catalog-grid');
    const info = document.getElementById('catalog-count');
    const pag = document.getElementById('catalog-pagination');
    if (!grid) return;

    const params = new URLSearchParams(window.location.search);
    let activeBrand = params.get('marca') || 'Todas';
    let activeSubcat = 'Todas';
    let searchTerm = '';
    let sortMode = 'default';
    let currentPage = 1;
    const perPage = 16;

    function getFiltered() {
      let list = inv.filter(p => config.categories.includes(p.categoria));
      if (activeSubcat !== 'Todas') list = list.filter(p => p.subcategoria === activeSubcat || p.categoria === activeSubcat);
      if (activeBrand !== 'Todas') list = list.filter(p => p.marca === activeBrand);
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        list = list.filter(p => p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q) || p.material.toLowerCase().includes(q));
      }
      if (sortMode === 'asc') list.sort((a, b) => a.precio - b.precio);
      if (sortMode === 'desc') list.sort((a, b) => b.precio - a.precio);
      return list;
    }

    let selectedProd = null;
    let selectedSize = '';
    const modal = document.getElementById('product-modal');

    function openModal(p) {
      selectedProd = p;
      const mImg = document.getElementById('m-img');
      mImg.onerror = function () { this.onerror = null; this.src = p.fallback || 'img/tenis_studio.jpg'; };
      mImg.src = p.imagen;
      document.getElementById('m-brand').textContent = `${p.marca} · ${p.sku}`;
      document.getElementById('m-title').textContent = p.nombre;
      document.getElementById('m-price').textContent = cop(p.precio);
      document.getElementById('m-desc').textContent = p.descripcion;
      document.getElementById('m-material').innerHTML = `<strong>Material:</strong> ${p.material}`;
      document.getElementById('m-stock').textContent = `Disponible en tienda: ${p.stock} unidades`;
      const tWrap = document.getElementById('m-tallas');
      tWrap.innerHTML = '';
      const tallas = p.tallas.split(',');
      selectedSize = tallas[0];
      tallas.forEach(t => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'talla-pill' + (t === selectedSize ? ' sel' : '');
        b.textContent = t;
        b.onclick = () => {
          selectedSize = t;
          tWrap.querySelectorAll('.talla-pill').forEach(x => x.classList.remove('sel'));
          b.classList.add('sel');
        };
        tWrap.appendChild(b);
      });
      modal.classList.add('open');
    }

    document.getElementById('m-close').onclick = () => modal.classList.remove('open');
    modal.onclick = e => { if (e.target === modal) modal.classList.remove('open'); };
    document.getElementById('m-add').onclick = () => {
      if (!selectedProd) return;
      CrazyDB.addCarrito(selectedProd, selectedSize);
      updateHeader();
      const btn = document.getElementById('m-add');
      btn.textContent = `¡Agregado (${selectedSize})!`;
      setTimeout(() => { btn.textContent = 'Agregar al carrito'; modal.classList.remove('open'); }, 650);
    };

    function draw() {
      const list = getFiltered();
      const totalPages = Math.max(1, Math.ceil(list.length / perPage));
      if (currentPage > totalPages) currentPage = 1;
      const start = (currentPage - 1) * perPage;
      const slice = list.slice(start, start + perPage);

      info.textContent = `Mostrando ${slice.length} de ${list.length} referencias únicas disponibles`;
      grid.innerHTML = '';

      slice.forEach(p => {
        const card = document.createElement('article');
        card.className = 'prod-card';
        card.innerHTML = `
          <div class="prod-img-wrap">
            <span class="brand-tag">${p.marca}</span>
            <span class="stock-tag">Stock: ${p.stock}</span>
            <img src="${p.imagen}" alt="${p.nombre}" loading="lazy" onerror="this.onerror=null;this.src='${p.fallback || 'img/tenis_studio.jpg'}';">
          </div>
          <div class="card-body">
            <div class="prod-title">${p.nombre}</div>
            <div class="prod-meta">${p.color} · ${p.sku}</div>
            <div class="prod-price">${cop(p.precio)}</div>
            <button type="button" class="btn btn-negro" style="width:100%; margin-top:auto; padding:0.6rem;">Ver material y talla</button>
          </div>
        `;
        card.querySelector('button').onclick = () => openModal(p);
        grid.appendChild(card);
      });

      pag.innerHTML = '';
      for (let i = 1; i <= totalPages; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'page-btn' + (i === currentPage ? ' activo' : '');
        b.textContent = i;
        b.onclick = () => { currentPage = i; draw(); window.scrollTo({ top: 180, behavior: 'smooth' }); };
        pag.appendChild(b);
      }
    }

    document.querySelectorAll('[data-brand]').forEach(btn => {
      if (btn.dataset.brand === activeBrand) btn.classList.add('activo');
      btn.onclick = () => {
        document.querySelectorAll('[data-brand]').forEach(x => x.classList.remove('activo'));
        btn.classList.add('activo');
        activeBrand = btn.dataset.brand;
        currentPage = 1;
        draw();
      };
    });

    document.querySelectorAll('[data-subcat]').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('[data-subcat]').forEach(x => x.classList.remove('activo'));
        btn.classList.add('activo');
        activeSubcat = btn.dataset.subcat;
        currentPage = 1;
        draw();
      };
    });

    const searchIn = document.getElementById('search-input');
    if (searchIn) searchIn.oninput = () => { searchTerm = searchIn.value.trim(); currentPage = 1; draw(); };
    const sortSel = document.getElementById('sort-select');
    if (sortSel) sortSel.onchange = () => { sortMode = sortSel.value; draw(); };

    draw();
  }

  return { cop, updateHeader, renderCatalogPage };
})();

document.addEventListener('DOMContentLoaded', () => CrazyUI.updateHeader());
