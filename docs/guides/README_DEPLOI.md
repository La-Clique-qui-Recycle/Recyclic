# 🚀 Déploiement Recyclic – VPS Hostinger (srv806876.hstgr.cloud)

## 1️⃣ Connexion au VPS
```bash
ssh root@srv806876.hstgr.cloud
cd /srv/recyclic
```

## 2️⃣ Mise à jour du dépôt
```bash
git pull
```

## 3️⃣ (Optionnel) Reconstruire l’image du frontend
```bash
docker compose build frontend
```

## 4️⃣ Déploiement complet (API + FRONT)
```bash
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --force-recreate
```

## 5️⃣ Vérifications rapides
### 🔹 Statut des conteneurs
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Networks}}"
```
### 🔹 Test Traefik
```bash
docker logs traefik --since=30s | grep -i recyclic
```
### 🔹 Test HTTPS
```bash
curl -I https://recyclic.jarvos.eu
```

## 6️⃣ Fichiers à ne pas modifier
- `/srv/traefik/traefik.yml` → configuration globale proxy
- Réseau utilisé : `traefik-public`
- Le healthcheck du frontend est **désactivé** (ne pas réactiver)

## ✅ Résultat attendu
- https://recyclic.jarvos.eu → `HTTP/2 200`
- https://recyclic.jarvos.eu/api → doit répondre `{"status":"ok"}`

## 🧩 En cas de souci
```bash
docker restart traefik
docker logs traefik --since=30s | grep recyclic
docker logs recyclic-frontend-1 | tail -n 30
```
