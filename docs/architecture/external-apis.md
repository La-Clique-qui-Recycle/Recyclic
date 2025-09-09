# External APIs

## Gemini AI API

- **Purpose:** Transcription audio et classification automatique EEE
- **Documentation:** https://ai.google.dev/gemini-api/docs
- **Base URL(s):** https://generativelanguage.googleapis.com
- **Authentication:** API Key
- **Rate Limits:** 15 RPM gratuit, 1500 RPM payant

**Key Endpoints Used:**
- `POST /v1beta/models/gemini-2.5-flash:generateContent` - Classification avec prompt engineering
- `POST /v1beta/models/gemini-2.5-flash:generateContent` - Transcription audio

**Integration Notes:** Pipeline avec retry et fallback. Cache Redis pour éviter double classification.

## Google Sheets API

- **Purpose:** Synchronisation temps réel données ventes/dépôts
- **Documentation:** https://developers.google.com/sheets/api
- **Base URL(s):** https://sheets.googleapis.com
- **Authentication:** Service Account JSON
- **Rate Limits:** 100 requests/100s/user

**Key Endpoints Used:**
- `GET /v4/spreadsheets/{spreadsheetId}/values/{range}` - Lecture données
- `POST /v4/spreadsheets/{spreadsheetId}/values/{range}:append` - Ajout lignes
- `PUT /v4/spreadsheets/{spreadsheetId}/values/{range}` - Mise à jour batch

**Integration Notes:** Batch updates pour performance. Gestion erreurs 429 avec backoff.

## Infomaniak kDrive WebDAV

- **Purpose:** Sauvegarde automatique exports et fichiers audio
- **Documentation:** https://www.infomaniak.com/fr/support/faq/2038
- **Base URL(s):** https://connect.drive.infomaniak.com/remote.php/dav/files/{user}/
- **Authentication:** Basic Auth (username/password)
- **Rate Limits:** 10GB storage, bande passante illimitée

**Key Endpoints Used:**
- `PUT /{path}` - Upload fichiers
- `GET /{path}` - Download fichiers
- `PROPFIND /{path}` - Liste fichiers/dossiers

**Integration Notes:** Upload asynchrone via queue Redis. Retry automatique échecs réseau.

---
