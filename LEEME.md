# Mi sitio de páginas para restaurantes

**En vivo:** https://yina-htx-ya-ndrea.vercel.app
**Proyecto en Vercel:** `yina-htx` (equipo YAndrea)

Esta carpeta es la **fuente**. Vercel la construye sola en cada despliegue.

## Qué es cada archivo

| Archivo | Qué hace |
|---|---|
| `datos.json` | **Los 15 restaurantes.** Nombre, giro, teléfono, dirección, colores, fotos, idioma. Casi todo lo que vas a querer cambiar está aquí. |
| `plantilla.html` | La página, con huecos `{{ASI}}`. Una sola, para las 15. |
| `build.mjs` | El generador. Toma la plantilla + los datos y escribe las 15 páginas en `public/`. |
| `estilo.css` | El diseño, compartido por las 15. Cambiar aquí cambia todas. |
| `app.js` | Animaciones y el visor de fotos. Compartido. |
| `index.html` | Tu página de entrada (la raíz del sitio). |
| `robots.txt` | Le dice a Google que **no indexe nada**. No lo borres. |
| `package.json` | Le dice a Vercel que corra `node build.mjs`. |

## Cómo cambiar algo

**Un color, un teléfono, un servicio de un restaurante** → `datos.json`.
Cada renglón de `negocios` va en este orden:
```
nombre, giro, teléfono, dirección, slug, servicio1, servicio2, servicio3,
idioma(es|en), color, papel, fotoPrincipal, foto1, foto2, foto3
```

**Agregar un restaurante 16** → un renglón más en `negocios`. Se genera solo.

**Bajar una página** (si el dueño lo pide — se hace **el mismo día**) →
borra su renglón de `negocios`, vuelve a desplegar, y anota el negocio en
`BRAIN SERVER/entrega/no-contactar.txt`.

**El diseño de todas** → `estilo.css`.

## Cómo volver a publicar
Pídeselo a tu IA: *"vuelve a desplegar mi sitio de restaurantes con los cambios de datos.json"*.
Se sube el contenido de esta carpeta a Vercel, al proyecto `yina-htx`.

## ⚠️ Dos cosas que no se tocan

1. **`robots.txt` con `Disallow: /`** y el `noindex` de cada página. Sin eso, tus muestras
   podrían salir en Google compitiendo con la ficha real del negocio. Ahí se acaba el
   regalo y empieza el pleito.
2. **La banda de cortesía** al pie de cada página: dice que la hiciste tú, que **no es el
   sitio oficial**, y que las fotos son de banco. El regalo funciona porque es un regalo
   de verdad.

## Ojo con Vercel
Cuando creas un proyecto nuevo, Vercel prende **Deployment Protection** por defecto: las
páginas responden 200 pero sirven una pantalla de login y **nadie de fuera puede verlas**.
Se apaga en: proyecto → Settings → Deployment Protection → Vercel Authentication →
**Disabled** → Save.

**Cómo comprobar que de verdad está pública** (no basta con que dé 200):
```bash
curl -I https://yina-htx-ya-ndrea.vercel.app/para-la-tapatia/
```
Si aparece `302` y `sso-api`, sigue protegida. Si da `200` directo, está pública.


---

## Los datos de cada restaurante (2026-08-29)

`datos.json` ahora usa campos con nombre. Cada negocio:

```
nombre, giro, telefono, direccion, slug,
servicio1..3, idioma(es|en), acento, papel, hero, g1..g3,
orderingUrl, reservationUrl, menuUrl, hours, websiteUrl
```

**Los ultimos cinco estan VACIOS a proposito.** Ninguno de estos 15 negocios
publica pedidos en linea, reservas, menu ni horarios. **Nunca inventarlos.**

En cuanto pegues una URL real ahi, el boton aparece solo:

| Si llenas | Sale |
|---|---|
| `orderingUrl` | Boton **Ordenar en linea** (principal, ancho completo) |
| `reservationUrl` | Boton **Reservar mesa** |
| `menuUrl` | Seccion de menu + enlace en el nav y el pie |
| `hours` | La fila de Horarios en "Donde estamos" |

Si estan vacios, esos botones y secciones **no se dibujan**: nada de botones muertos
ni de textos de relleno.

## El telefono nunca se parte
El numero va en `<span class="btn__num">` con `white-space:nowrap`. La etiqueta
("Llamar") puede bajar de linea, el numero no. Probado en 320, 375, 390, 430, 768,
1024 y 1440 px: siempre una sola linea, cero desbordamiento.

## Dos generadores
- `build.mjs` — el que corre Vercel (Node).
- `build.py` — el espejo para probar en la compu (aqui no hay Node).

**Si cambias uno, cambia el otro.** Para ver el sitio en local:
```
python build.py public
cd public && python -m http.server 8137
```
y abre http://localhost:8137/para-la-tapatia/

## Limitacion de Vercel que hay que saber
Con el acceso que tengo, **solo puedo crear proyectos nuevos, no actualizar los que ya
existen** (da 403). Cada version nueva del sitio sale en una URL distinta, y hay que
apagarle la proteccion otra vez. La solucion de fondo es conectar el proyecto a GitHub
y desplegar por `git push`.
