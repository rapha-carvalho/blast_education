# Deploy on NAS with Cloudflare Tunnel

## Prerequisites

- NAS with Docker support
- Cloudflare account
- Domain: `school.blastgroup.org` configured in Cloudflare

## 1. Build and run with Docker Compose

```bash
cd /path/to/blast_sql_vertical
docker-compose up -d
```

The frontend will listen on port 80. The backend runs internally and is not exposed to the host.

## 2. Configure Cloudflare Tunnel

Install `cloudflared` on your NAS or a host that can reach the NAS.

Create a tunnel and add a public hostname:

- **Public hostname**: `school.blastgroup.org`
- **Service**: `http://localhost:80` (if cloudflared runs on the NAS) or `http://<nas-ip>:80`

Example config (in `~/.cloudflared/config.yml`):

```yaml
tunnel: <tunnel-id>
credentials-file: /path/to/<tunnel-id>.json

ingress:
  - hostname: school.blastgroup.org
    service: http://localhost:80
  - service: http_status:404
```

## 3. Verify

1. Visit https://school.blastgroup.org
2. You should see the Blast SQL course list
3. Click a lesson, write SQL, and use Run / Check Answer / Hint / Show Solution

## 4. Backend exposure

The backend (port 8000) is **not** exposed to the internet. All API calls go through the frontend container. Nginx proxies `/api/*` to the backend internally. Do not expose the backend port in `docker-compose.yml` or via the tunnel.
