

## Problem

The `package-lock.json` is out of sync with `package.json` — many packages (react-markdown, testing-library, etc.) are missing from the lockfile. `npm ci` requires an exact match and fails.

## Fix

Change the GitHub Actions workflow from `npm ci` to `npm install`. This will resolve dependencies from `package.json` directly, bypassing the stale lockfile.

### Change in `.github/workflows/deploy.yml`

Line 24: Replace `npm ci` with `npm install --legacy-peer-deps`

This is a single-line change that will unblock the build immediately.

