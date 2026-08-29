// Genera las paginas a partir de plantilla.html + datos.json.
// Vercel lo corre solo en cada despliegue (buildCommand: node build.mjs).
//
// REGLA DURA: aqui no se inventa NADA. Un boton solo aparece si su URL existe
// de verdad en datos.json. Si esta vacia, el boton no se dibuja.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";

const D = JSON.parse(readFileSync("datos.json", "utf8"));
const TPL = readFileSync("plantilla.html", "utf8");
const OUT = "public";

const esc = s => String(s == null ? "" : s)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;").replace(/'/g,"&#x27;");
const foto = (k, w, q) => "https://images.unsplash.com/" + D.fotos[k] + "?auto=format&fit=crop&w=" + w + "&q=" + q;
const bonito = t => { const d = String(t).replace(/\D/g,""); return d.length===10 ? "("+d.slice(0,3)+") "+d.slice(3,6)+"-"+d.slice(6) : t; };
const hay = v => typeof v === "string" && v.trim().length > 0;

const T = {
 es:{T_TITLE:"muestra",T_NAV_MENU:"Menú",T_NAV_PHOTOS:"Fotos",T_NAV_LOC:"Dónde estamos",T_CALL:"Llamar",T_DIRECTIONS:"Cómo llegar",T_ORDER:"Ordenar en línea",T_RESERVE:"Reservar mesa",T_VIEWMENU:"Ver el menú",T_KNOWN_EYE:"Lo que hacemos",T_KNOWN_H:"Lo que aquí se sirve.",T_MENU_EYE:"El menú",T_MENU_H:"Nuestro menú.",T_PHOTOS_EYE:"Fotos",T_PHOTOS_H:"Cómo se vería.",T_LOC_EYE:"Dónde estamos",T_LOC_H:"Cómo llegar.",T_F_ADDR:"Dirección",T_F_PHONE:"Teléfono",T_F_HOURS:"Horarios",T_HERO_SUB:"En Houston, Texas. Llámenos o venga.",T_HERO_ALT:"Foto de ejemplo del tipo de comida",T_MAP_ALT:"Mapa ilustrado de la ubicación"},
 en:{T_TITLE:"sample page",T_NAV_MENU:"Menu",T_NAV_PHOTOS:"Photos",T_NAV_LOC:"Find us",T_CALL:"Call",T_DIRECTIONS:"Directions",T_ORDER:"Order online",T_RESERVE:"Reserve a table",T_VIEWMENU:"View the menu",T_KNOWN_EYE:"What we do",T_KNOWN_H:"What's served here.",T_MENU_EYE:"The menu",T_MENU_H:"Our menu.",T_PHOTOS_EYE:"Photos",T_PHOTOS_H:"How it could look.",T_LOC_EYE:"Find us",T_LOC_H:"How to get here.",T_F_ADDR:"Address",T_F_PHONE:"Phone",T_F_HOURS:"Hours",T_HERO_SUB:"In Houston, Texas. Give us a call or come by.",T_HERO_ALT:"Sample photo of this kind of food",T_MAP_ALT:"Illustrated map of the location"}
};

const CORT = {
 es: (a,n,t) => "<strong>Ésta es una muestra de cortesía.</strong> La hice yo, "+a+", como ejemplo de cómo se vería "+n+" en internet. <strong>No es el sitio oficial de "+n+"</strong> y no fue hecha ni autorizada por ellos. Las fotos son de banco, no son de este restaurante. Si al negocio le gusta, se la paso sin costo; si no la quiere, la doy de baja el mismo día. Contacto: "+t,
 en: (a,n,t) => "<strong>This is a free sample page.</strong> I made it, "+a+", as an example of how "+n+" could look online. <strong>This is not the official website of "+n+"</strong> and it was not made or authorized by them. Photos are stock images, not photos of this restaurant. If the owner likes it, I'll hand it over at no cost; if not, I'll take it down the same day. Contact: "+t
};

// Un boton externo (pedidos, reservas, menu). Siempre target=_blank + rel seguro.
const btnExterno = (url, etiqueta, clase) =>
  '<a class="btn ' + clase + '" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
  '<span class="btn__lbl">' + etiqueta + '</span></a>';

// El boton de llamar: etiqueta + numero, y el NUMERO va en su propio span
// con white-space:nowrap para que jamas se parta en dos renglones.
const btnLlamar = (tel, etiqueta, clase, conNumero) =>
  '<a class="btn ' + clase + '" href="tel:+1' + tel + '">' +
  '<span class="btn__lbl">' + etiqueta + '</span>' +
  (conNumero ? '<span class="btn__num">' + bonito(tel) + '</span>' : '') + '</a>';

/* Arma las acciones de un negocio, en orden de jerarquia:
     1. Ordenar en linea  (principal)  - solo si existe orderingUrl
     2. Llamar                          - siempre (el telefono si lo tenemos)
     3. Reservar mesa                   - solo si existe reservationUrl
     4. Como llegar                     - siempre
   Si un negocio no tiene pedidos ni reservas, sencillamente no se dibujan. */
function acciones(b, t, mapa, opciones) {
  const conNumero = opciones && opciones.conNumero;
  const out = [];
  const tieneOrden = hay(b.orderingUrl);
  if (tieneOrden) out.push(btnExterno(b.orderingUrl, t.T_ORDER, "btn--full"));
  out.push(btnLlamar(b.telefono, t.T_CALL, tieneOrden ? "btn--sec" : "", conNumero));
  if (hay(b.reservationUrl)) out.push(btnExterno(b.reservationUrl, t.T_RESERVE, "btn--sec"));
  out.push('<a class="btn btn--sec" href="' + esc(mapa) + '" target="_blank" rel="noopener noreferrer">' +
           '<span class="btn__lbl">' + t.T_DIRECTIONS + '</span></a>');
  return '<div class="cta">' + out.join("") + '</div>';
}

/* El dock del celular: maximo DOS acciones, para que nunca se encimen.
   La mas util primero (ordenar si existe, si no llamar) + el mapa. */
function dock(b, t, mapa) {
  const principal = hay(b.orderingUrl)
    ? btnExterno(b.orderingUrl, t.T_ORDER, "")
    : btnLlamar(b.telefono, t.T_CALL, "", false);
  const mapaBtn = '<a class="btn btn--ghost" href="' + esc(mapa) + '" target="_blank" rel="noopener noreferrer" aria-label="' + t.T_DIRECTIONS + '">&#9906;</a>';
  return principal + mapaBtn;
}

/* La seccion de menu solo existe si hay un menu de verdad al que enlazar.
   Sin datos, se omite entera: nada de "aqui va su menu". */
function seccionMenu(b, t) {
  if (!hay(b.menuUrl)) return "";
  return '<section class="pad light" id="menu">\n  <div class="wrap">\n' +
    '    <div class="head rv">\n      <p class="eyebrow">' + t.T_MENU_EYE + '</p>\n' +
    '      <h2 class="display-l">' + t.T_MENU_H + '</h2>\n    </div>\n' +
    '    <p style="margin-top:30px">' + btnExterno(b.menuUrl, t.T_VIEWMENU, "btn--ink") + '</p>\n' +
    '  </div>\n</section>';
}

/* El enlace a #menu solo si la seccion de menu existe. Nada de enlaces muertos. */
function navMenu(b, t) {
  return hay(b.menuUrl) ? '      <a href="#menu">' + t.T_NAV_MENU + '</a>\n' : "";
}
function footMenu(b, t) {
  return hay(b.menuUrl) ? '          <li><a href="#menu">' + t.T_NAV_MENU + '</a></li>\n' : "";
}

/* La fila de horarios solo si hay horarios. Sin datos, no se dibuja. */
function filaHorarios(b, t) {
  if (!hay(b.hours)) return "";
  return '        <div><span>' + t.T_F_HOURS + '</span><span>' + esc(b.hours) + '</span></div>\n';
}

mkdirSync(OUT, { recursive: true });
for (const f of ["estilo.css", "app.js", "index.html", "robots.txt"]) copyFileSync(f, OUT + "/" + f);

let n = 0, conOrden = 0, conReserva = 0;
for (const b of D.negocios) {
  const t = T[b.idioma] || T.es;
  const dirFull = b.direccion + ", " + D.ciudad;
  const mapa = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(b.nombre + ", " + dirFull).replace(/'/g, "%27");
  if (hay(b.orderingUrl)) conOrden++;
  if (hay(b.reservationUrl)) conReserva++;

  const rep = Object.assign({
    LANG: b.idioma, NOMBRE: esc(b.nombre), GIRO: esc(b.giro), CIUDAD: D.ciudad,
    DIRECCION: esc(dirFull), TELEFONO: bonito(b.telefono), TEL_LIMPIO: "+1" + b.telefono,
    MAPA: mapa, ACENTO: b.acento, ACENTO_ENC: "%23" + b.acento.slice(1), PAPEL: b.papel,
    HERO: foto(b.hero, 1800, 72), G1: foto(b.g1, 900, 70), G2: foto(b.g2, 900, 70), G3: foto(b.g3, 900, 70),
    SERVICIO1: esc(b.servicio1), SERVICIO2: esc(b.servicio2), SERVICIO3: esc(b.servicio3),
    T_META: esc(b.nombre + " - " + b.giro + ", " + D.ciudad + "."),
    T_CORTESIA: CORT[b.idioma](esc(D.autor), esc(b.nombre), D.autorTel),
    CTA_HERO: acciones(b, t, mapa, {conNumero:true}),
    CTA_LOC: acciones(b, t, mapa, {conNumero:false}),
    CTA_DOCK: dock(b, t, mapa),
    SECCION_MENU: seccionMenu(b, t),
    FILA_HORARIOS: filaHorarios(b, t),
    NAV_MENU: navMenu(b, t),
    FOOT_MENU: footMenu(b, t)
  }, t);

  let page = TPL;
  for (const k of Object.keys(rep)) page = page.split("{{" + k + "}}").join(rep[k]);
  if (page.indexOf("{{") !== -1) throw new Error("quedaron huecos sin llenar en " + b.slug);
  mkdirSync(OUT + "/para-" + b.slug, { recursive: true });
  writeFileSync(OUT + "/para-" + b.slug + "/index.html", page, "utf8");
  n++;
}
console.log("paginas generadas: " + n + " | con pedidos: " + conOrden + " | con reservas: " + conReserva);
if (n !== D.negocios.length) throw new Error("esperaba " + D.negocios.length + " paginas, salieron " + n);
