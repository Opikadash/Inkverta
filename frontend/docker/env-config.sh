#!/usr/bin/env sh
set -eu

cat <<'EOF' > /usr/share/nginx/html/env-config.js
window.__ENV__ = window.__ENV__ || {};
EOF

if [ -n "${VITE_API_URL:-}" ]; then
  echo "window.__ENV__.VITE_API_URL = \"${VITE_API_URL}\";" >> /usr/share/nginx/html/env-config.js
fi

