# Multi-Tenant Plan — POS Rahmat

> **Status:** Draft — untuk didiskusikan
> **Tujuan:** Menjalankan beberapa toko independen (pemilik berbeda) dalam satu server menggunakan Docker.

---

## 1. Pendekatan yang Direkomendasikan

### Per-toko Docker Stack (isolasi penuh)

Setiap toko mendapat Docker Compose stack sendiri-sendiri. Masing-masing punya:

- VM sendiri **MariaDB** (database terisolasi)
- VM sendiri **Next.js app** (port berbeda)
- VM sendiri **AUTH_SECRET**, env var, volume data

```
┌─────────────────────────────────────────────────────┐
│                   Satu Server                        │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Toko A   │  │ Toko B   │  │ Toko C   │  ...     │
│  │ :3001    │  │ :3002    │  │ :3003    │          │
│  │          │  │          │  │          │          │
│  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │          │
│  │ │MariaDB│ │  │ │MariaDB│ │  │ │MariaDB│ │          │
│  │ │pos_a  │ │  │ │pos_b  │ │  │ │pos_c  │ │          │
│  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Nginx (reverse proxy)                          │ │
│  │  toko-a.pos.com → :3001                         │ │
│  │  toko-b.pos.com → :3002                         │ │
│  │  toko-c.pos.com → :3003                         │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Kenapa ini yang dipilih

| Kriteria | Per-toko stack | DB-per-tenant (satu app) | Shared DB + store_id |
|-----------|---------------|------------------------|---------------------|
| Isolasi data | ✅ Total | ✅ Baik | ❌ Risiko bocor |
| Zero code change | ✅ Ya | ❌ Banyak | ❌ Sangat banyak |
| Backup/restore | ✅ `docker compose down` + cp volume | ❌ Perlu routing | ❌ Perlu filter |
| Update per-toko | ✅ Bisa beda versi | ❌ Satu untuk semua | ❌ Satu untuk semua |
| Resource usage | ⬇️ Lebih berat | ⬆️ Hemat | ⬆️ Hemat |
| Cocok untuk pemilik beda? | ✅ Sangat cocok | ⚠️ Bisa | ❌ Tidak |

---

## 2. Struktur Direktori

```
/srv/pos/
├── toko-a/
│   ├── docker-compose.yml
│   ├── .env
│   └── data/              # (auto-created) MariaDB volume
├── toko-b/
│   ├── docker-compose.yml
│   ├── .env
│   └── data/
├── nginx/
│   └── pos.conf           # reverse proxy config
├── scripts/
│   ├── deploy-all.sh      # pull & restart semua toko
│   ├── backup.sh          # backup semua toko
│   └── create-toko.sh     # bootstrap toko baru dari template
└── template/
    ├── .env.example
    └── docker-compose.yml # reusable template
```

---

## 3. Template Docker Compose

```yaml
# template/docker-compose.yml
services:
  db:
    image: mariadb:11
    container_name: pos-${STORE_ID}-db
    restart: unless-stopped
    volumes:
      - ./data/mysql:/var/lib/mysql
    environment:
      MARIADB_ROOT_PASSWORD: ${DB_PASSWORD}
      MARIADB_DATABASE: pos_${STORE_ID}
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect"]
      interval: 10s
      timeout: 5s
      retries: 10

  app:
    image: pos-rahmat:latest
    container_name: pos-${STORE_ID}-app
    restart: unless-stopped
    ports:
      - "${APP_PORT}:3000"
    environment:
      DATABASE_URL: mysql://root:${DB_PASSWORD}@db:3306/pos_${STORE_ID}
      AUTH_SECRET: ${AUTH_SECRET}
      NEXT_PUBLIC_APP_URL: ${APP_URL}
      DB_MIGRATE: "true"
      DB_SEED: ${DB_SEED:-false}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - pos-network

networks:
  pos-network:
    name: pos-network
    external: true
```

```bash
# template/.env.example
STORE_ID=toko_a
APP_PORT=3001
APP_URL=https://toko-a.pos.com
DB_PASSWORD=rahmat123_tokoa
AUTH_SECRET=generate-min-32-chars-random-string
DB_SEED=true
```

---

## 4. Setup Toko Baru

### 4.1 Build image (sekali saja)

```bash
# Dari repo root
docker compose build
# atau pull dari registry
docker pull pos-rahmat:latest
```

### 4.2 Bootstrap toko baru

```bash
# scripts/create-toko.sh
STORE_ID=$1
APP_PORT=$2
APP_URL=$3

mkdir -p /srv/pos/$STORE_ID
cd /srv/pos/$STORE_ID

# Generate random password & secret
DB_PASS=$(openssl rand -base64 12)
AUTH_SECRET=$(openssl rand -base64 32)

# Copy config
cp /srv/pos/template/docker-compose.yml .
cat > .env <<EOF
STORE_ID=$STORE_ID
APP_PORT=$APP_PORT
APP_URL=$APP_URL
DB_PASSWORD=$DB_PASS
AUTH_SECRET=$AUTH_SECRET
DB_SEED=true
EOF

# Jalankan
docker compose up -d

echo "✅ Toko $STORE_ID siap di $APP_URL"
echo "   DB Password: $DB_PASS"
```

### 4.3 Setup DNS + Nginx

```nginx
# nginx/pos.conf
upstream toko-a { server 127.0.0.1:3001; }
upstream toko-b { server 127.0.0.1:3002; }
upstream toko-c { server 127.0.0.1:3003; }

server {
    listen 443 ssl;
    server_name toko-a.pos.com;

    ssl_certificate     /etc/letsencrypt/live/toko-a.pos.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/toko-a.pos.com/private.key;

    location / {
        proxy_pass http://toko-a;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name toko-b.pos.com;

    ssl_certificate     /etc/letsencrypt/live/toko-b.pos.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/toko-b.pos.com/private.key;

    location / {
        proxy_pass http://toko-b;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 5. Manajemen Sehari-hari

### Update semua toko

```bash
# scripts/deploy-all.sh
# Build image dulu
cd /srv/pos/rahmat-repo
git pull
docker compose build

# Deploy ke setiap toko
for store in /srv/pos/toko-*/docker-compose.yml; do
  dir=$(dirname "$store")
  cd "$dir"
  docker compose pull
  docker compose up -d
done
```

### Backup semua toko

```bash
# scripts/backup.sh
BACKUP_DIR=/srv/backups/pos/$(date +%Y%m%d)
mkdir -p "$BACKUP_DIR"

for store in /srv/pos/toko-*/docker-compose.yml; do
  STORE_ID=$(basename $(dirname "$store"))
  docker exec pos-${STORE_ID}-db \
    mariadb-dump -uroot -p${DB_PASSWORD} pos_${STORE_ID} \
    > "$BACKUP_DIR/${STORE_ID}.sql"
  gzip "$BACKUP_DIR/${STORE_ID}.sql"
done

echo "✅ Backup selesai: $BACKUP_DIR"
```

### Restore satu toko

```bash
docker exec -i pos-toko-a-db \
  mariadb -uroot -p${DB_PASSWORD} pos_toko_a \
  < backup-toko-a.sql
```

---

## 6. Resource Estimation

Untuk **satu server** dengan spesifikasi:

| Store count | RAM (MariaDB ~200MB/toko) | RAM (App ~150MB/toko) | CPU |
|------------|--------------------------|----------------------|-----|
| 5 toko     | ~1.0 GB + overhead       | ~0.75 GB             | 2-4 core |
| 10 toko    | ~2.0 GB + overhead       | ~1.5 GB              | 4-8 core |
| 20 toko    | ~4.0 GB + overhead       | ~3.0 GB              | 8+ core |

> **Catatan:** Untuk >10 toko, pertimbangkan opsi DB-per-tenant (satu MariaDB, banyak database) untuk menghemat resource, atau pisahkan ke server berbeda.

---

## 7. Opsi Alternatif (untuk diskusi)

### Opsi A: DB-per-tenant, satu app container

Satu MariaDB instance dengan banyak database. Satu app container yang routes
berdasarkan domain/subdomain.

```
toko-a.pos.com → auth user → cari store_id → query database `pos_a`
```

**Kelebihan:** Lebih hemat resource (satu MariaDB).

**Kekurangan:**
- Perubahan kode signifikan:
  - Tambah tabel `stores`
  - Tambah `store_id` ke user session (JWT)
  - Logic routing: filter request by domain → pilih database
  - Connection pool: perlu multi-database pool
- Update sekali untuk semua toko
- Downtime berdampak ke semua toko

### Opsi B: Shared database + `store_id` column

Satu database, setiap tabel ditambah kolom `store_id`, semua query difilter.

**Kelebihan:** Paling hemat resource.

**Kekurangan:**
- Risiko data leak (bug query lupa filter store_id)
- Perubahan kode masif (schema + tiap query + tiap API route)
- Backup/restore per toko susah
- **Tidak direkomendasikan untuk pemilik beda**

---

## 8. Open Questions

- [ ] Semua toko di **satu server** atau **server berbeda**?
- [ ] Perlu **dashboard admin terpusat** untuk lihat semua toko?
- [ ] Perlu **laporan consolidated** (omset semua toko)?
- [ ] Perlu **fitur white-label** (branding tiap toko beda)?
- [ ] Tiap toko punya **admin sendiri** atau kita yang kelola?
- [ ] Berapa **skala awal** (berapa toko)?
- [ ] Semua toko harus **versi sama** atau boleh berbeda?
- [ ] **Print server** — tiap toko perlu koneksi printer sendiri?
- [ ] Perlu **cek token** / **lisensi** per toko?
- [ ] **Pricing model** — satu harga atau per-toko?
