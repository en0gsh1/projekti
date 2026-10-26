# 🇽🇰 Vizito Kosovën

Udhërrëfyes dhe planifikues udhëtimi për turizmin në Kosovë, në JavaScript të pastër (ES modules, pa framework, pa build). Të gjitha të dhënat ruhen në **localStorage**, pa databazë.

## Funksionet
- **Eksploro**: 12 destinacione, kërkim (shkurtorja `/`), filtra (Natyrë, Histori, Qytet, Aventurë, *Tani në sezon*, Të preferuarat), renditje sipas emrit, vlerësimit ose distancës nga ti (geolocation).
- **Faqe për çdo destinacion**: këshilla, sezoni më i mirë, **moti live** me parashikim 4-ditor (Open-Meteo), mini-hartë, vende afër, udhëzime në Google Maps.
- **Vlerësime** me yje dhe koment.
- **Harta interaktive** (Leaflet + OpenStreetMap), ku ndalesat e planit kanë numër dhe rrugë me ngjyrë për çdo ditë.
- **Plan udhëtimi shumë-ditor**:
  - drag & drop ndërmjet ditëve
  - distanca dhe koha me makinë për çdo segment
  - paralajmërim për ditë shumë të gjata
  - ✨ optimizim i rrugës
  - data e fillimit, shënime
- **Ndaj planin me link**, eksporto/importo JSON, printo.
- 🛂 **Pasaporta e Kosovës**: shëno vendet e vizituara.
- Shqip / English, temë e errët / e çelët.
- **PWA**: instalohet në telefon dhe punon edhe offline.

## Si ta hapësh
```bash
node serve.js
```
Pastaj hap http://localhost:5173 në shfletues.

> ES modules dhe service worker nuk punojnë nga `file://`, prandaj duhet një server i vogël (ose GitHub Pages).

## Struktura
```
index.html              – faqja (shell)
css/style.css           – stilet (temë e çelët/errët, print, responsive)
js/main.js              – router me hash + nisja e aplikacionit
js/store.js             – "databaza" mbi localStorage + migrimi nga v1
js/data.js              – destinacionet
js/i18n.js              – përkthimet SQ/EN
js/actions.js           – veprimet e përbashkëta
js/weather.js           – moti nga Open-Meteo (me cache)
js/map.js               – ndihmës për Leaflet
js/views/*.js           – faqet: explore, detail, map, plan
sw.js                   – service worker (offline)
serve.js                – server statik për zhvillim
```
