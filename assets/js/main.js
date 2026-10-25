/* Cansejo — comportamiento del sitio (sin dependencias) */
(function () {
  'use strict';

  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };

  /* ---------- Año del footer ---------- */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Menú móvil ---------- */
  var burger = $('#burger');
  var menu = $('#menu');

  function setMenu(open) {
    if (!burger || !menu) return;
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }

  if (burger && menu) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        setMenu(false);
        burger.focus();
      }
    });
    doc.addEventListener('click', function (e) {
      if (menu.classList.contains('open') && !menu.contains(e.target) && !burger.contains(e.target)) setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960) setMenu(false);
    });
  }

  /* ---------- Sombra del header al hacer scroll ---------- */
  var header = $('#header');
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Aparición al scroll (fallback para navegadores sin animation-timeline) ---------- */
  var supportsTimeline = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!supportsTimeline && !reduce && 'IntersectionObserver' in window) {
    doc.documentElement.classList.add('io');
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          revealObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal, .reveal-l, .reveal-s').forEach(function (el) { revealObs.observe(el); });
  }

  /* ---------- Sección activa en el menú ---------- */
  var links = {};
  $$('.navlink', menu).forEach(function (a) { links[a.getAttribute('href')] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = links['#' + en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        } else {
          a.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (h) {
      var s = $(h);
      if (s) spy.observe(s);
    });
  }

  /* ---------- Formulario de contacto ---------- */
  var form = $('#contact-form');
  if (!form) return;

  var statusEl = $('#form-status');
  var okBox = $('#form-ok');
  var okTitle = $('#ok-title');
  var okText = $('#ok-text');
  var okWa = $('#ok-wa');
  var okReset = $('#ok-reset');
  var submitBtn = $('.btn-submit', form);
  var submitLabel = $('.btn-label', form);
  var endpoint = (form.getAttribute('data-endpoint') || '').trim();
  var waNumber = (form.getAttribute('data-whatsapp') || '').replace(/\D/g, '');

  function setStatus(msg) { statusEl.textContent = msg || ''; }

  function clean(v) { return String(v || '').replace(/\s+/g, ' ').trim(); }

  function validate() {
    var ok = true, first = null;
    $$('.field', form).forEach(function (f) { f.classList.remove('invalid'); f.removeAttribute('aria-invalid'); });

    var nombre = form.elements.nombre;
    var tel = form.elements.telefono;
    var correo = form.elements.correo;

    if (clean(nombre.value).length < 2) { mark(nombre); }
    var digits = tel.value.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 13) { mark(tel); }
    if (correo.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value)) { mark(correo); }

    function mark(el) {
      ok = false;
      el.classList.add('invalid');
      el.setAttribute('aria-invalid', 'true');
      if (!first) first = el;
    }
    if (!ok) {
      setStatus('Revisa los campos marcados en rojo.');
      first.focus();
    }
    return ok;
  }

  function buildWhatsAppUrl(d) {
    var msg = 'Hola Juan, soy ' + d.nombre + '.\n' +
      'Quiero cotizar: ' + d.servicio + '.\n' +
      (d.mensaje ? d.mensaje + '\n' : '') +
      'Mi teléfono: ' + d.telefono + (d.correo ? '\nCorreo: ' + d.correo : '');
    return 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(msg);
  }

  function showOk(viaWhatsApp, waUrl) {
    form.hidden = true;
    okBox.hidden = false;
    if (viaWhatsApp) {
      okTitle.textContent = '¡Casi listo!';
      okText.textContent = 'Abrimos WhatsApp con tu mensaje ya escrito. Solo presiona enviar y te respondo a la brevedad.';
      okWa.href = waUrl;
      okWa.hidden = false;
    } else {
      okTitle.textContent = '¡Mensaje enviado!';
      okText.textContent = 'Gracias por escribir. Te contactaré pronto con tu cotización.';
      okWa.hidden = true;
    }
    okBox.focus();
  }

  function busy(on) {
    submitBtn.disabled = on;
    submitLabel.textContent = on ? 'Enviando…' : 'Enviar solicitud';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus('');

    // Campo trampa: si lo completó un bot, simulamos éxito y no enviamos nada
    if (form.elements.empresa && form.elements.empresa.value) { showOk(false); return; }
    if (!validate()) return;

    var d = {
      nombre: clean(form.elements.nombre.value),
      telefono: clean(form.elements.telefono.value),
      correo: clean(form.elements.correo.value),
      servicio: clean(form.elements.servicio.value),
      mensaje: String(form.elements.mensaje.value || '').trim()
    };

    // Sin servicio externo configurado: el mensaje se envía por WhatsApp
    if (!endpoint) {
      var url = buildWhatsAppUrl(d);
      window.open(url, '_blank', 'noopener');
      showOk(true, url);
      return;
    }

    busy(true);
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        nombre: d.nombre,
        telefono: d.telefono,
        correo: d.correo,
        servicio: d.servicio,
        mensaje: d.mensaje,
        _subject: 'Nueva cotización web — ' + d.servicio
      })
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      showOk(false);
    }).catch(function () {
      setStatus('No pudimos enviar el formulario. Intenta de nuevo o escríbeme por WhatsApp.');
    }).then(function () { busy(false); });
  });

  // Quitar el error al corregir un campo
  form.addEventListener('input', function (e) {
    if (e.target.classList && e.target.classList.contains('invalid')) {
      e.target.classList.remove('invalid');
      e.target.removeAttribute('aria-invalid');
      setStatus('');
    }
  });

  okReset.addEventListener('click', function () {
    form.reset();
    okBox.hidden = true;
    form.hidden = false;
    setStatus('');
    form.elements.nombre.focus();
  });
})();
