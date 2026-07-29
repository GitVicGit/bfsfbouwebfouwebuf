# Website principles

- Keep the artwork visually dominant and follow the approved cinematic works-archive direction with architectural precision.
- Do not introduce generic gradients, glass effects, dashboard-style cards, or unrelated aesthetic changes.
- Do not invent artwork titles, dates, materials, dimensions, locations, credits, translations, or biographical claims.
- Preserve all existing content and public URLs unless an explicit redirect is added.
- Maintain both English and French routes. Use `Works · Exhibitions · About · CV · Contact · FR` as the English primary navigation and the corresponding existing French labels on French pages. Keep Portfolio as a secondary link in the Works toolbar, not as a primary navigation item.
- Do not create separate primary sections named Works and Projects. The Works archive uses Sculpture, Installation, Painting, and Moving image as its principal medium categories.
- Use existing artwork assets and metadata. Secondary attributes such as sound, scent, surface, object, environment, and time-based must not complicate primary navigation.
- Use semantic HTML before adding ARIA. Maintain logical headings, landmarks, descriptive alternative text, full keyboard access, and clearly visible focus states.
- Respect `prefers-reduced-motion` and provide a usable no-JavaScript fallback for interactive features where practical.
- Optimise image loading, intrinsic dimensions, and responsive sources without visibly degrading artwork reproduction or distorting its aspect ratio.
- Keep client-side JavaScript minimal and dependency-free unless a dependency is necessary and its purpose is explained first.

# Repository workflow

- Treat the site as static HTML, CSS, and JavaScript unless repository evidence shows otherwise.
- Never work directly on the live deployment branch. Use a `codex/` redesign or task branch.
- Inspect routes, shared assets, deployment configuration, and available commands before changing the implementation.
- Do not remove or overwrite unrelated user changes or untracked files.
- At the end of every task, run every build, validation, lint, and test command available in the repository. This repository currently has no package manifest or task runner, so also run relevant static checks such as `git diff --check`, local route and asset resolution, HTML landmark and heading checks, JSON-LD parsing, and inline JavaScript syntax validation.
- Before proposing a commit or pull request, provide a concise diff summary and list every changed file.

# Review guidelines

- Flag broken or changed routes, missing artwork, inaccessible controls, invalid structured data, layout shifts, image distortion, and excessively large image downloads.
- Check narrow mobile, intermediate, and desktop layouts when visual testing is part of the task.
- Treat loss or invention of metadata, captions, translations, alternative text, or source credits as a serious regression.
- Verify navigation order, current-page state, skip links, focus visibility, colour contrast, form labels, reduced-motion behaviour, and no-JavaScript fallbacks.
- Flag any change that could expose private contact, form-submission, analytics, credential, or deployment information.
