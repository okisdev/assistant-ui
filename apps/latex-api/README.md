# LaTeX API

A simple LaTeX compilation API service built with Hono + Bun, designed to be deployed on Fly.io.

## API

### `POST /builds/sync`

Compiles LaTeX documents and returns PDF.

**Request:**
```json
{
  "compiler": "pdflatex",
  "resources": [
    {
      "path": "main.tex",
      "content": "\\documentclass{article}\\begin{document}Hello\\end{document}",
      "main": true
    },
    {
      "path": "image.png",
      "file": "<base64-encoded-content>"
    }
  ]
}
```

**Response:**
- Success: `application/pdf` binary
- Failure: `application/json` with `{ error, log_files }`

## Local Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Test
curl -X POST http://localhost:3001/builds/sync \
  -H "Content-Type: application/json" \
  -d '{"compiler":"pdflatex","resources":[{"main":true,"content":"\\documentclass{article}\\begin{document}Hello\\end{document}"}]}'
```

Requires TeX Live installed locally for development.

## Deployment (Railway)

```bash
# Install CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```
