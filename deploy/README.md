# Frontend VM Deployment

This app is frontend-only. It builds to static files and stores demo data in the browser through `sql.js`.

## What the pipeline does

On push to `main`:

1. installs frontend dependencies
2. runs `npm run lint`
3. runs `npm run build`
4. uploads the `Frontend/dist` artifact
5. copies the built files to your VM over SSH
6. switches the VM to the new release
7. reloads `nginx`

## GitHub Actions secrets

Add these repository secrets:

- `VM_HOST`
- `VM_USER`
- `VM_SSH_PRIVATE_KEY`
- `VM_DEPLOY_PATH`

Optional:

- `VM_PORT`

Recommended value:

- `VM_DEPLOY_PATH=/var/www/nobody-frontend`

## One-time VM setup

Copy this repo to the VM once, then run:

```bash
cd /path/to/repo/deploy
bash setup_vm.sh /var/www/nobody-frontend
```

This installs:

- `nginx`
- `rsync`

And configures static hosting with SPA fallback.

## How deployment works on the VM

Each deploy goes to:

```text
/var/www/nobody-frontend/releases/<git-sha>
```

Active release:

```text
/var/www/nobody-frontend/current
```

`nginx` serves from `current`.

## Important behavior

- No backend is deployed.
- No server database is deployed.
- All app data remains browser-side per user/browser.
- This is correct for your demo architecture.

## Local verification

```bash
cd Frontend
npm ci
npm run lint
npm run build
```
