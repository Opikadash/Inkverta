# Security Policy

## Reporting a vulnerability

If you discover a security issue, please **do not** open a public GitHub issue. Instead, email:

- `opikadash@gmail.com`

Include:

- Steps to reproduce
- Impact assessment
- Any proof-of-concept

## Hardening checklist (deployments)

- Set `NODE_ENV=production`
- Configure `CORS_ORIGINS` to only your web origins
- Use HTTPS in production (Traefik/Nginx)
- Keep API keys in environment variables (never commit them)
- Run containers as non-root where possible

