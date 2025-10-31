# Gyors Kezdés - Workflow Támogató Rendszer

## 1. Első indítás

### Függőségek telepítése (ha még nem tetted meg)
```bash
composer install
npm install
```

### Környezeti változók és kulcs generálás
```bash
cp .env.example .env
php artisan key:generate
```

### Adatbázis migráció
```bash
php artisan migrate
```

### Frontend build
```bash
npm run build
```

## 2. Admin felhasználó létrehozása

A Filament admin panelhez szükséged lesz egy felhasználóra. Futtasd:

```bash
php artisan make:filament-user
```

Amikor kérdezi, add meg:
- **Név**: Admin (vagy bármi)
- **Email**: admin@example.com (vagy bármi)
- **Jelszó**: válassz egy biztonságos jelszót

## 3. Szerver indítása

### Development módban (ajánlott)
Nyiss két terminált:

**Terminal 1 - Laravel szerver:**
```bash
php artisan serve
```

**Terminal 2 - Vite dev szerver (hot reload-dal):**
```bash
npm run dev
```

### Vagy production módban
```bash
npm run build
php artisan serve
```

## 4. Alkalmazás használata

### A) Filament Admin Panel
1. Nyisd meg: http://localhost:8000/admin
2. Jelentkezz be az előbb létrehozott fiókkal
3. Klikk a **Workflows** menüpontra
4. Klikk a **New** gombra új workflow létrehozásához
5. Töltsd ki az űrlapot:
   - Név: pl. "Új vásárló folyamat"
   - Leírás: pl. "Vásárló regisztráció és aktiválás"
   - Aktív: pipáld be
6. Mentsd el
7. A listában klikk a **Design** gombra a vizuális szerkesztőhöz

### B) Egyedi Admin Felület (React Flow Editor)
1. Nyisd meg: http://localhost:8000/admin
2. Itt teljes funkcionalitású workflow editort találsz:
   - Node-ok hozzáadása (Start, Action, Condition, End)
   - Node-ok mozgatása drag & drop-pal
   - Node-ok összekötése
   - Workflow mentése

### C) Nyilvános Workflow Nézet
1. Nyisd meg: http://localhost:8000/workflows
2. Itt láthatod az összes **aktív** workflow-t
3. Klikk a **View** gombra egy workflow megtekintéséhez
4. A workflow csak olvasható módban jelenik meg

## 5. API használata

### Összes workflow lekérése
```bash
curl http://localhost:8000/api/workflows
```

### Egy workflow lekérése
```bash
curl http://localhost:8000/api/workflows/1
```

### Új workflow létrehozása
```bash
curl -X POST http://localhost:8000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Workflow",
    "description": "API-ból létrehozott workflow",
    "is_active": true,
    "nodes": [
      {
        "id": "node-1",
        "type": "start",
        "position": {"x": 100, "y": 100},
        "data": {"label": "Start"}
      },
      {
        "id": "node-2",
        "type": "end",
        "position": {"x": 300, "y": 100},
        "data": {"label": "End"}
      }
    ],
    "connections": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2"
      }
    ]
  }'
```

### Workflow frissítése
```bash
curl -X PUT http://localhost:8000/api/workflows/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Frissített Workflow",
    "is_active": false
  }'
```

### Workflow törlése
```bash
curl -X DELETE http://localhost:8000/api/workflows/1
```

## 6. Hibaelhárítás

### "Unable to locate file in Vite manifest"
Futtasd le:
```bash
npm run build
```

### "SQLSTATE[HY000]: General error: 1 no such table"
Futtasd le a migrációkat:
```bash
php artisan migrate
```

### "Target class [AdminPanelProvider] does not exist"
Ellenőrizd, hogy a `bootstrap/providers.php` tartalmazza:
```php
App\Providers\Filament\AdminPanelProvider::class,
```

### CSS nem töltődik be
1. Töröld a cache-t: `php artisan optimize:clear`
2. Build újra: `npm run build`

### Port foglalt (8000)
Használj másik portot:
```bash
php artisan serve --port=8001
```

## 7. Következő lépések

- Hozz létre több workflow-t különböző típusú folyamatokra
- Teszteld a node típusokat és kapcsolatokat
- Próbáld ki az API végpontokat
- Nézd át a részletes dokumentációt: WORKFLOW_README.md

Sok sikert! 🚀
