# Testing branch preview

The `testing` branch contains the frontend repairs and a GitHub Pages deployment workflow. The backend repairs are on the `testing` branch of `fury-of-de-night/buildguyana-verification`.

Every push to `testing` runs the **Deploy testing preview** workflow. It checks types, runs the frontend tests, builds with `/BuildGuyana/` as the base path, and publishes a static Pages artifact. The generated `404.html` allows direct navigation and refreshes on application routes. GitHub Pages may return HTTP 404 for a deep route even though the app renders it; that is a preview hosting limitation, not a verified backend failure.

Before its first successful deployment, repository settings must permit Pages:

1. In **Settings > Pages**, choose **GitHub Actions** as the source.
2. In **Settings > Environments > github-pages**, permit deployments from `testing` if branch restrictions are configured.
3. Rerun the failed **Deploy testing preview** workflow from Actions after changing settings.

The workflow deliberately refuses to overwrite a Pages site with a custom domain or an existing branch-based publishing setup. If one already serves the live website, use a separate preview repository/hosting project instead of changing that live site's source.

After the workflow succeeds, use the URL shown in its deployment environment. With the standard project-site configuration, the expected URL is `https://fury-of-de-night.github.io/BuildGuyana/`. This expected address is not proof that deployment has completed. A private repository may require an eligible GitHub plan for Pages.

GitHub Pages hosts the frontend only; it cannot run Flask. Supabase is paused, so account/database-backed flows remain unavailable. Use the public pages and the clearly labeled demo routes for visual review. No Supabase configuration or migration is changed by this workflow. The frontend and API contract changes still need coordinated deployment when backend work resumes.

The cloud environment used to prepare this branch allows Git pushes but blocks `api.github.com`, so the agent cannot enable Pages settings, inspect workflow status, or confirm a deployment from that environment. Allowing `api.github.com` and the Pages hostname in the cloud network settings would permit those checks; repository permission is still required independently.
