# Workflow Támogató Rendszer

Egy Laravel-alapú workflow támogató rendszer React Flow vizualizációval és Filament admin panellel.

## Technológiai Stack

### Backend
- **Laravel 12** - PHP framework
- **SQLite/MySQL** - Adatbázis
- **REST API** - Workflow CRUD műveletek

### Frontend
- **React 18** - UI könyvtár
- **React Flow** - Interaktív workflow vizualizáció
- **Tailwind CSS** - Styling
- **Vite** - Build tool

### Admin Panel
- **Filament v4** - Laravel admin panel
- **Livewire 3** - Reactive komponensek

## Főbb Funkciók

### Admin Felület (Filament)
- Workflow-k listázása, létrehozása, szerkesztése, törlése
- Vizuális workflow editor (React Flow)
- Workflow aktiválás/deaktiválás
- Workflow metaadatok kezelése

### Front-end Felület
- Aktív workflow-k megtekintése
- Csak-olvasható workflow vizualizáció
- Node-ok és kapcsolatok megjelenítése

### Workflow Komponensek
- **Start Node**: Folyamat kezdőpontja
- **Action Node**: Művelet végrehajtása
- **Condition Node**: Feltételvizsgálat
- **End Node**: Folyamat végpontja

## Telepítés

### Előfeltételek
- PHP 8.2+
- Composer
- Node.js 18+
- npm vagy yarn

### Lépések

1. **Függőségek telepítése**
```bash
composer install
npm install
```

2. **Környezeti változók beállítása**
```bash
cp .env.example .env
php artisan key:generate
```

3. **Adatbázis migráció**
```bash
php artisan migrate
```

4. **Admin felhasználó létrehozása**
```bash
php artisan make:filament-user
```
Kövesd a promptokat a név, email és jelszó megadásához.

5. **Frontend build**
```bash
npm run build
# vagy development módban:
npm run dev
```

6. **Szerver indítása**
```bash
php artisan serve
```

## Használat

### Admin Panel
A Filament admin panel elérhető: `http://localhost:8000/admin`

#### Workflow létrehozása:
1. Jelentkezz be az admin panelbe
2. Navigálj a "Workflows" menüpontra
3. Klikk a "New Workflow" gombra
4. Add meg a workflow nevét és leírását
5. Klikk a "Design" gombra a vizuális editorhoz
6. Add hozzá a node-okat és kösd össze őket
7. Mentsd el a workflow-t

#### Workflow szerkesztése:
1. A Workflows listában klikk az "Edit" gombra
2. Vagy klikk a "Design" gombra a vizuális editorhoz
3. Módosítsd a workflow-t
4. Mentsd el a változásokat

### Front-end Felület
A nyilvános workflow felület elérhető: `http://localhost:8000/workflows`

- Megtekintheted az összes aktív workflow-t
- Ráklikkelve egy workflow-ra láthatod a vizualizációját
- A workflow nem szerkeszthető, csak megtekinthető

## API Végpontok

### Workflows
- `GET /api/workflows` - Összes workflow lekérése
- `GET /api/workflows/{id}` - Egy workflow lekérése
- `POST /api/workflows` - Új workflow létrehozása
- `PUT /api/workflows/{id}` - Workflow frissítése
- `DELETE /api/workflows/{id}` - Workflow törlése

### Példa Request Body (POST/PUT):
```json
{
  "name": "Új Workflow",
  "description": "Leírás",
  "is_active": true,
  "nodes": [
    {
      "id": "node-1",
      "type": "start",
      "position": { "x": 100, "y": 100 },
      "data": { "label": "Start Node" }
    }
  ],
  "connections": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2"
    }
  ]
}
```

## Adatbázis Struktúra

### workflows tábla
- `id` - Elsődleges kulcs
- `name` - Workflow neve
- `description` - Leírás
- `is_active` - Aktív állapot
- `metadata` - JSON metaadatok
- `created_at`, `updated_at` - Időbélyegek

### workflow_nodes tábla
- `id` - Elsődleges kulcs
- `workflow_id` - Foreign key
- `node_id` - Egyedi node azonosító
- `type` - Node típusa (start, action, condition, end)
- `label` - Node címkéje
- `data` - JSON node adatok
- `position` - JSON pozíció (x, y)
- `created_at`, `updated_at` - Időbélyegek

### workflow_connections tábla
- `id` - Elsődleges kulcs
- `workflow_id` - Foreign key
- `connection_id` - Egyedi kapcsolat azonosító
- `source_node_id` - Forrás node
- `target_node_id` - Cél node
- `source_handle` - Forrás handle (opcionális)
- `target_handle` - Cél handle (opcionális)
- `created_at`, `updated_at` - Időbélyegek

## Fejlesztés

### Development mód
```bash
# Terminal 1: Laravel szerver
php artisan serve

# Terminal 2: Vite dev szerver
npm run dev
```

### Production build
```bash
npm run build
php artisan optimize
```

## Jövőbeli Fejlesztési Lehetőségek

- [ ] Workflow végrehajtás engine
- [ ] Workflow verziókezelés
- [ ] Workflow sablonok
- [ ] Workflow import/export
- [ ] Workflow analytics
- [ ] Real-time collaboration
- [ ] Workflow validáció
- [ ] Egyedi node típusok
- [ ] Webhook integrációk
- [ ] API key autentikáció

## Licensz

MIT
