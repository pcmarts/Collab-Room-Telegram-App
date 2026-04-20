## Design Context

### Users
Web3 marketers, brand operators, and founders running partnerships — people who have already closed deals and know the vocabulary (Twitter Spaces, AMAs, co-marketing, newsletters). They open the app inside Telegram, usually on a phone, often between other tasks: scanning a feed of live collab requests, deciding in seconds whether to pursue or skip. The job to be done is *scout and commit fast* — browse opportunities, request to join, and jump into a private Telegram chat the moment there's a match. Contact info is never exposed until both sides opt in, so trust and signal quality matter more than volume.

### Brand Personality
**Confident. Sharp. Insider.**

The interface should feel like a tool used by people who already know what they're doing — no hand-holding, no onboarding cheer, no explainer copy treating the user like a beginner. The vibe is closer to a private industry terminal than a consumer social app. Users should feel mildly flattered to be using it.

Emotional targets per session:
- **Control** (I can see the whole opportunity set at a glance)
- **Signal** (every element on screen is load-bearing information, not decoration)
- **Momentum** (scouting → requesting → chatting should feel frictionless and quick)

### Aesthetic Direction
Reference point: **Superhuman / Notion Calendar** — premium productivity tools with restrained palettes, strong typographic hierarchy, and a keyboard-first energy translated into touch. Every pixel feels intentional; nothing is decorative.

Key qualities to pursue:
- Dense information presented gracefully, not crammed
- Typographic hierarchy doing the heavy lifting (not color, not cards)
- Quiet surfaces with one or two confident accents
- Motion reserved for state changes and confirmations, never ambient
- Feels fast even on slow networks

Theme: **Follows the user's Telegram theme** (light or dark). The app lives inside Telegram and should feel native — adapt surface colors, text contrast, and accents to match whichever mode the user is in. Neither mode is the "default" — both are first-class and must be equally refined.

### Anti-References
Explicitly NOT any of these:
- **Generic SaaS dashboard** — rounded cards on pastel backgrounds, soft drop shadows, icon-above-heading grids, the Stripe/Linear clone template
- **Typical crypto/DeFi app** — cyan-on-black, neon gradients, glowing borders, 3D coin renders, techno-maximalism, gradient text
- **Dating app aesthetic** — despite the matching metaphor, avoid Tinder pinks, heart icons, flirty microcopy, card-swipe theatrics. The word "match" stays, but the feeling is closer to an offer book than a romance app.
- **Traditional enterprise B2B** — corporate navy, stock photos, formal tone, heavy chrome UI, "Schedule a demo" energy

### Design Principles
These should guide every design decision going forward:

1. **Signal over decoration.** If an element doesn't encode information or enable an action, it shouldn't exist. Borders, shadows, icons, and color are earned, not applied by default.

2. **Typography carries the hierarchy.** A confident display/body pairing with a 1.25+ ratio scale does more than color or boxes ever could. Avoid flat type hierarchies.

3. **One accent, used sparingly.** The existing indigo (`hsl(245, 58%, 51%)`) is a starting point — keep it rare enough that it means something (primary CTA, live status, match confirmation) rather than painting it across every surface.

4. **Native to Telegram, native to mobile.** Thumb-reach, one-handed scanning, 44px minimum hit targets, respect for Telegram's own chrome. The app should feel like it *belongs* inside Telegram, not like a website stuffed into a webview.

5. **Fast is a feature.** Optimistic UI updates, skeleton-free instant renders where possible, motion only when it communicates state. Latency is the enemy of the "insider tool" feeling.

6. **Respect the user's expertise.** No tooltips explaining what an AMA is. No onboarding coach marks. Labels are short, copy is declarative, empty states teach the interface without condescension.
