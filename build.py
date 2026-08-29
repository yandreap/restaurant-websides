#!/usr/bin/env python3
"""Espejo en Python de build.mjs, para generar y revisar en la compu (no hay Node aqui).

Vercel corre build.mjs. Este archivo hace exactamente lo mismo y sirve para
previsualizar y verificar antes de publicar. Si cambias uno, cambia el otro.

Uso:  python build.py [carpeta_salida]     (por defecto: public)
"""
import html as H
import json
import os
import re
import shutil
import sys
import urllib.parse
from pathlib import Path

BASE = Path(__file__).resolve().parent
D = json.loads((BASE / "datos.json").read_text(encoding="utf-8"))
TPL = (BASE / "plantilla.html").read_text(encoding="utf-8")
OUT = BASE / (sys.argv[1] if len(sys.argv) > 1 else "public")

esc = lambda s: H.escape("" if s is None else str(s), quote=True)
hay = lambda v: isinstance(v, str) and v.strip() != ""
foto = lambda k, w, q: "https://images.unsplash.com/%s?auto=format&fit=crop&w=%d&q=%d" % (D["fotos"][k], w, q)


def bonito(t):
    d = re.sub(r"\D", "", str(t))
    return "(%s) %s-%s" % (d[:3], d[3:6], d[6:]) if len(d) == 10 else t


T = {
 "es": {"T_INV_H":"Aquí va su menú.","T_INV_P":"Por ahora esta página muestra cómo se vería su restaurante en internet. El menú es lo primero que la gente busca.","T_INV_P2":"Mándeme una foto de su menú y yo lo acomodo aquí, sus platillos y sus precios tal como los tiene. Sin costo, y la página es suya de todos modos.","T_INV_STAMP":"Ejemplo de acomodo. No son platillos ni precios reales.","T_INV_CTA":"Mándeme su menú","T_MOCK_H":"Menú","T_TITLE":"muestra","T_NAV_MENU":"Menú","T_NAV_PHOTOS":"Fotos","T_NAV_LOC":"Dónde estamos","T_CALL":"Llamar","T_DIRECTIONS":"Cómo llegar","T_ORDER":"Ordenar en línea","T_RESERVE":"Reservar mesa","T_VIEWMENU":"Ver el menú","T_KNOWN_EYE":"Lo que hacemos","T_KNOWN_H":"Lo que aquí se sirve.","T_MENU_EYE":"El menú","T_MENU_H":"Nuestro menú.","T_PHOTOS_EYE":"Fotos","T_PHOTOS_H":"Cómo se vería.","T_LOC_EYE":"Dónde estamos","T_LOC_H":"Cómo llegar.","T_F_ADDR":"Dirección","T_F_PHONE":"Teléfono","T_F_HOURS":"Horarios","T_HERO_SUB":"En Houston, Texas. Llámenos o venga.","T_HERO_ALT":"Foto de ejemplo del tipo de comida","T_MAP_ALT":"Mapa ilustrado de la ubicación"},
 "en": {"T_INV_H":"Your menu goes here.","T_INV_P":"Right now this page shows what your restaurant could look like online. The menu is the part people look for first.","T_INV_P2":"Send me a photo of your menu and I will lay it out here, your dishes and your prices exactly as you have them. No charge, and the page is yours either way.","T_INV_STAMP":"Sample layout. These are not real dishes or real prices.","T_INV_CTA":"Send me your menu","T_MOCK_H":"Menu","T_TITLE":"sample page","T_NAV_MENU":"Menu","T_NAV_PHOTOS":"Photos","T_NAV_LOC":"Find us","T_CALL":"Call","T_DIRECTIONS":"Directions","T_ORDER":"Order online","T_RESERVE":"Reserve a table","T_VIEWMENU":"View the menu","T_KNOWN_EYE":"What we do","T_KNOWN_H":"What's served here.","T_MENU_EYE":"The menu","T_MENU_H":"Our menu.","T_PHOTOS_EYE":"Photos","T_PHOTOS_H":"How it could look.","T_LOC_EYE":"Find us","T_LOC_H":"How to get here.","T_F_ADDR":"Address","T_F_PHONE":"Phone","T_F_HOURS":"Hours","T_HERO_SUB":"In Houston, Texas. Give us a call or come by.","T_HERO_ALT":"Sample photo of this kind of food","T_MAP_ALT":"Illustrated map of the location"},
}
CORT = {
 "es": lambda a,n,t: "<strong>Ésta es una muestra de cortesía.</strong> La hice yo, "+a+", como ejemplo de cómo se vería "+n+" en internet. <strong>No es el sitio oficial de "+n+"</strong> y no fue hecha ni autorizada por ellos. Las fotos son de banco, no son de este restaurante. Si al negocio le gusta, se la paso sin costo; si no la quiere, la doy de baja el mismo día. Contacto: "+t,
 "en": lambda a,n,t: "<strong>This is a free sample page.</strong> I made it, "+a+", as an example of how "+n+" could look online. <strong>This is not the official website of "+n+"</strong> and it was not made or authorized by them. Photos are stock images, not photos of this restaurant. If the owner likes it, I'll hand it over at no cost; if not, I'll take it down the same day. Contact: "+t,
}

btn_ext = lambda u, e, c: '<a class="btn %s" href="%s" target="_blank" rel="noopener noreferrer"><span class="btn__lbl">%s</span></a>' % (c, esc(u), e)


def btn_tel(tel, etiqueta, clase, con_numero):
    n = '<span class="btn__num">%s</span>' % bonito(tel) if con_numero else ""
    return '<a class="btn %s" href="tel:+1%s"><span class="btn__lbl">%s</span>%s</a>' % (clase, tel, etiqueta, n)


def acciones(b, t, mapa, con_numero):
    out, tiene_orden = [], hay(b.get("orderingUrl"))
    if tiene_orden:
        out.append(btn_ext(b["orderingUrl"], t["T_ORDER"], "btn--full"))
    out.append(btn_tel(b["telefono"], t["T_CALL"], "btn--sec" if tiene_orden else "", con_numero))
    if hay(b.get("reservationUrl")):
        out.append(btn_ext(b["reservationUrl"], t["T_RESERVE"], "btn--sec"))
    out.append(btn_ext(mapa, t["T_DIRECTIONS"], "btn--sec"))
    return '<div class="cta">%s</div>' % "".join(out)


def dock(b, t, mapa):
    principal = (btn_ext(b["orderingUrl"], t["T_ORDER"], "") if hay(b.get("orderingUrl"))
                 else btn_tel(b["telefono"], t["T_CALL"], "", False))
    return principal + ('<a class="btn btn--ghost" href="%s" target="_blank" rel="noopener noreferrer" aria-label="%s">&#9906;</a>' % (esc(mapa), t["T_DIRECTIONS"]))


def seccion_menu(b, t):
    if hay(b.get("menuUrl")):
        return ('<section class="pad light" id="menu"><div class="wrap"><div class="head rv">'
                '<p class="eyebrow">%s</p><h2 class="display-l">%s</h2></div>'
                '<p style="margin-top:30px">%s</p></div></section>'
                % (t["T_MENU_EYE"], t["T_MENU_H"], btn_ext(b["menuUrl"], t["T_VIEWMENU"], "btn--ink")))
    # Sin menu real: la invitacion al dueno. Barras abstractas a proposito:
    # aqui NO se inventa ni un platillo ni un precio.
    fila = lambda c: ('<div class="mi__row"><span class="mi__bar mi__bar--%s"></span>'
                      '<span class="mi__dots"></span><span class="mi__p"></span></div>' % c)
    tel = re.sub("[^0-9]", "", str(D["autorTel"]))
    return ('<section class="pad light" id="menu"><div class="wrap"><div class="head rv">'
            '<p class="eyebrow">%s</p><h2 class="display-l">%s</h2>'
            '<p class="lede">%s</p></div><div class="mi"><div class="mi__mock rv">'
            '<h4>%s</h4>%s%s%s%s'
            '<p class="mi__stamp">%s</p></div><div class="rv d1">'
            '<p class="lede">%s</p><p style="margin-top:26px">'
            '<a class="btn btn--ink" href="tel:+1%s"><span class="btn__lbl">%s</span>'
            '<span class="btn__num">%s</span></a></p></div></div></div></section>'
            % (t["T_MENU_EYE"], t["T_INV_H"], t["T_INV_P"], t["T_MOCK_H"],
               fila("n"), fila("n2"), fila("n3"), fila("n4"),
               t["T_INV_STAMP"], t["T_INV_P2"], tel, t["T_INV_CTA"], D["autorTel"]))


def nav_menu(b, t):
    """La seccion #menu siempre se dibuja, asi que el enlace nunca esta muerto."""
    return '      <a href="#menu">%s</a>' % t["T_NAV_MENU"] + chr(10)


def foot_menu(b, t):
    return '          <li><a href="#menu">%s</a></li>' % t["T_NAV_MENU"] + chr(10)


def fila_horarios(b, t):
    if not hay(b.get("hours")):
        return ""
    return '        <div><span>%s</span><span>%s</span></div>\n' % (t["T_F_HOURS"], esc(b["hours"]))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for f in ["estilo.css", "app.js", "index.html", "robots.txt"]:
        shutil.copy(BASE / f, OUT / f)
    n = con_orden = con_reserva = 0
    for b in D["negocios"]:
        t = T.get(b["idioma"], T["es"])
        dir_full = b["direccion"] + ", " + D["ciudad"]
        mapa = "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(b["nombre"] + ", " + dir_full)
        if hay(b.get("orderingUrl")):
            con_orden += 1
        if hay(b.get("reservationUrl")):
            con_reserva += 1
        rep = dict(t)
        rep.update({
            "LANG": b["idioma"], "NOMBRE": esc(b["nombre"]), "GIRO": esc(b["giro"]),
            "CIUDAD": D["ciudad"], "DIRECCION": esc(dir_full), "TELEFONO": bonito(b["telefono"]),
            "TEL_LIMPIO": "+1" + b["telefono"], "MAPA": mapa,
            "ACENTO": b["acento"], "ACENTO_ENC": "%23" + b["acento"][1:], "PAPEL": b["papel"],
            "HERO": foto(b["hero"], 1800, 72), "G1": foto(b["g1"], 900, 70),
            "G2": foto(b["g2"], 900, 70), "G3": foto(b["g3"], 900, 70),
            "SERVICIO1": esc(b["servicio1"]), "SERVICIO2": esc(b["servicio2"]), "SERVICIO3": esc(b["servicio3"]),
            "T_META": esc("%s - %s, %s." % (b["nombre"], b["giro"], D["ciudad"])),
            "T_CORTESIA": CORT[b["idioma"]](esc(D["autor"]), esc(b["nombre"]), D["autorTel"]),
            "CTA_HERO": acciones(b, t, mapa, True),
            "CTA_LOC": acciones(b, t, mapa, False),
            "CTA_DOCK": dock(b, t, mapa),
            "SECCION_MENU": seccion_menu(b, t),
            "FILA_HORARIOS": fila_horarios(b, t),
            "NAV_MENU": nav_menu(b, t),
            "FOOT_MENU": foot_menu(b, t),
        })
        page = TPL
        for k, v in rep.items():
            page = page.replace("{{%s}}" % k, v)
        if "{{" in page:
            raise SystemExit("quedaron huecos sin llenar en " + b["slug"])
        carpeta = OUT / ("para-" + b["slug"])
        carpeta.mkdir(parents=True, exist_ok=True)
        (carpeta / "index.html").write_text(page, encoding="utf-8", newline=chr(10))
        n += 1
    print("paginas generadas: %d | con pedidos: %d | con reservas: %d" % (n, con_orden, con_reserva))
    if n != len(D["negocios"]):
        raise SystemExit("faltaron paginas")


if __name__ == "__main__":
    main()
