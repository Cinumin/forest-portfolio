# Forest Portfolio

Angela Zhao’s portfolio uses React and Vite, with a painted 2D home page and an original Three.js forest for exploring projects.

## Local development

Use Node.js 24. Run `npm ci`, then `npm run dev`. Use `npm run build` for production output.

In the walkthrough, drag to look around, use W/S to follow the path, or use the numbered stop buttons. The project list provides a standard page with the same work and videos.

The original painting and title composition appear on Home. The 3D trail is a modeled interpretation of the painting. Project details are in `src/pages/projectData.js` and the film files are under `public/project-media/`.

## Publishing

The workflow publishes the Vite build to GitHub Pages on each push to `main`. Set the Pages source to GitHub Actions in repository settings.
