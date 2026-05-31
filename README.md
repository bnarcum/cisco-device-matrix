# Cisco Collaboration Device Matrix — Interactive 3D

An unaffiliated, interactive **3D walkthrough** of the publicly published
*Cisco Collaboration Device Product Matrix* (Feb 2026 catalog) — built with
[Vite](https://vite.dev), [React 19](https://react.dev), TypeScript and
[react-three-fiber](https://r3f.docs.pmnd.rs/).

It rebuilds the 27-page PDF brochure as a navigable space with four
complementary views, lets you compare up to three devices side-by-side, and
deploys statically to GitHub Pages.

> Cisco®, Webex® and product names are trademarks of Cisco Systems, Inc.
> This project is independent and uses only publicly documented specifications
> and stylized geometric representations of the devices (no copyrighted
> product imagery).

## Modes

| Mode | What you do |
| --- | --- |
| **Showroom** | Orbit a virtual floor where each ring is a product category. Click any device for full specs. |
| **Carousel** | Drag, scroll, or use `←` / `→` to spin a 3D ring; press `Enter` to inspect the front device. |
| **Grid** | A 3D comparison matrix — rows = room size, columns = category. |
| **Finder** | Answer two short questions and watch the matching devices fly forward. |

Anywhere, you can **add up to three devices to compare** and open a
spec-by-spec table.

## Running locally

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # static output in ./dist
npm run preview # serve the production build locally
```

## Deploying to GitHub Pages

The included workflow at
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) builds the
site on every push to `main` and deploys it via GitHub Pages.

1. Push this repo to GitHub (e.g. `youruser/cisco-device-matrix`).
2. In the repo: **Settings → Pages → Build and deployment → Source:
   GitHub Actions**.
3. Push to `main`. The action will deploy automatically and the URL appears
   in the action summary (typically `https://<user>.github.io/<repo>/`).

The workflow automatically picks the right Vite `base` path:

- For a user/org page repo named `<user>.github.io`, base is `/`.
- For any other repo, base is `/<repo-name>/`.

To override locally (e.g. for a custom domain):

```bash
VITE_BASE_PATH=/ npm run build
```

If you serve from a sub-path other than the repo name, set `VITE_BASE_PATH`
in the workflow’s `Build` step.

### Custom domain

If you add a `CNAME` for a custom domain, set `VITE_BASE_PATH=/` and place
your CNAME file in `public/CNAME` so it’s copied into `dist/` during build.

### Hosting on Vercel (alternative)

The project is also Vercel-ready — `npm run build` produces a static `dist/`
directory. Run `vercel` in this folder, or import the repo on
[vercel.com](https://vercel.com).

## Project structure

```
src/
  App.tsx               # mode switching + overlays
  data/cisco.ts         # device catalog (from the PDF) + Cisco palette
  three/
    DeviceModel.tsx     # stylized 3D primitives per device shape
    DevicePedestal.tsx  # device + pedestal + label
    SceneEnv.tsx        # shared lighting & environment
  scenes/
    ShowroomScene.tsx
    CarouselScene.tsx
    GridScene.tsx
    FinderScene.tsx
  ui/
    DeviceDrawer.tsx
    CompareTray.tsx
    CompareModal.tsx
    FinderOverlay.tsx
  index.css
public/
  favicon.svg
  .nojekyll
```

## Data source

Device specifications are adapted from
[Cisco’s public Collaboration Device Product Matrix brochure (PDF)](https://www.webex.com/content/dam/wbx/us/documents/pdf/Collaboration_Device_Product_Matrix_Brochure.pdf).
You can refresh or extend the catalog by editing `src/data/cisco.ts`.

## License

The visualization code in this repo is MIT-licensed. Cisco product names,
specifications, and brand colors are the property of Cisco Systems, Inc.
and are used here under fair-use editorial principles.
