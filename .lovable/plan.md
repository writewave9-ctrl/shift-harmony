

## Landing Page Polish & Enhancements

After reviewing the landing page on both desktop (1024px) and mobile (375px), the page is solid but has room for a few high-impact improvements:

### What to build

1. **Add a "How it works" section** — 3-step visual walkthrough (Create shifts -> Workers get notified -> Track in real-time) between the features grid and pricing. Simple numbered steps with icons and short descriptions.

2. **Add a social proof strip** — "Trusted by X teams" counter with a row of placeholder company logos below the hero benefits strip. Builds credibility before the user scrolls deeper.

3. **Add smooth-scroll nav links** — Add "Features", "Pricing", and "FAQ" links to the sticky nav that scroll to each section. Keeps users oriented on a long page.

4. **Fix dead space between FAQ and CTA** — There's excessive vertical padding. Tighten the gap so the page flows more naturally into the final call-to-action.

5. **Fix "View demo" button** — Currently links to `/demo` which goes to RoleSelect. Change to scroll down to the features section instead, or remove in favor of a single clear CTA.

### Technical approach

All changes are in `src/pages/Landing.tsx`:
- New `howItWorks` data array with 3 steps, rendered as a horizontal (desktop) / vertical (mobile) numbered flow
- Social proof section using simple flex layout with muted placeholder logos
- Nav links use `scrollIntoView({ behavior: 'smooth' })` with section `id` attributes
- Reduce `py-20` gap between FAQ and CTA to `py-12`
- Change "View demo" to an anchor scroll or remove it

No new files, no backend changes. All framer-motion patterns follow existing conventions.

