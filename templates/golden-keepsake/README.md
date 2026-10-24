# Golden Keepsake

Adapted from the supplied `Nimesh & Dilhani – Wedding Invitation (1).html`.

The source contains inline CSS and JavaScript. Its only external dependency is a Google Fonts stylesheet. The native template keeps its styles and interactions in the project:

- `components/templates/wedding-keepsake.tsx`: template entry point and editor envelope preview.
- `components/templates/golden-envelope.tsx` and `golden-envelope.module.css`: the opening animation, keyboard support, scroll locking and reduced motion support adapted from the original inline code.
- `components/templates/wedding-golden.tsx`, `wedding-golden.module.css` and `wedding-keepsake.module.css`: invitation sections, countdown, leaf animation and refined styling.
- `components/templates/template-photo-slot.tsx`: eight independent upload, replacement and removal controls. Pictures and editable wedding details use the invitation's existing persistence and validation.
- `public/assets/templates/golden-keepsake/fonts.css`: downloaded stylesheet with all font URLs rewritten to local assets. Five font files and both font licenses are included in the same directory.
- `public/assets/templates/golden-keepsake/asset-manifest.json`: download sources, byte sizes and SHA-256 hashes.
- `public/assets/templates/golden-keepsake/cover.svg`: local gallery cover artwork.

The imported vendor footer credit is omitted. Google Maps and Calendar remain optional outbound links; page rendering does not request remote fonts, styles or scripts. The source's demo RSVP code is replaced by the application's persisted RSVP form.

Names, dates, parents, story, schedule, venue and contact defaults match the supplied HTML. Its original RSVP deadline is editable in the builder.
