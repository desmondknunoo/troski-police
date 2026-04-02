# Design System Specification

## 1. Overview & Creative North Star: "The Heritage Prism"
This design system is a dual-narrative framework designed to bridge the gap between high-octane cinematic entertainment and civic urgency within the Ghanaian digital ecosystem. Our Creative North Star is **The Heritage Prism**: an approach that treats the UI not as a flat screen, but as a series of refracted layers of light and culture.

To move beyond the "template" look, we reject the rigid, boxed-in constraints of traditional mobile apps. Instead, we utilize **Intentional Asymmetry** and **Editorial Layering**. In the streaming context, this manifests as deep, infinite depths of "Rich Black" with floating golden elements. In the utility context, it transforms into an "Airy Authority"—using vast white space and sharp, animated transitions to convey speed and civic trust.

---

## 2. Color Philosophy
Our palette is rooted in the Pan-African identity but executed with high-fashion restraint. 

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. 
Boundaries must be defined through:
*   **Background Shifts:** Using `surface-container-low` against `surface`.
*   **Tonal Transitions:** Subtle shifts in luminosity to indicate a new functional area.
*   **Negative Space:** Utilizing the `spacing-12` and `spacing-16` tokens to create "implied" boundaries.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials. 
1.  **Base Layer:** `surface-container-lowest` (#0E0E0E) for deep cinematic immersion.
2.  **Interaction Layer:** `surface-container` (#201F1F) for cards and interactive modules.
3.  **Elevated Layer:** `surface-bright` (#3A3939) for floating navigation or critical prompts.

### The "Glass & Gradient" Rule
To ensure a premium feel, avoid "flat" gold. Main CTAs should utilize a **Signature Texture**: a subtle radial gradient transitioning from `primary` (#FFF0C9) to `primary-container` (#FCD116). For floating elements (like video overlays), use Glassmorphism—applying a `surface-variant` color at 60% opacity with a 20px backdrop blur.

---

## 3. Typography: The Editorial Voice
We use a dual-font approach to balance character with readability.

*   **Display & Headlines (Epilogue):** This is our "Statement" typeface. It’s used in `display-lg` to `headline-sm`. Epilogue's geometric weight provides an authoritative, modern feel that mirrors contemporary Ghanaian architecture. Use it for movie titles, urgent report headers, and major category names.
*   **Body & Labels (Manrope):** Chosen for its technical precision. Manrope handles the heavy lifting in `body-md` and `label-sm`. Its high x-height ensures that even in urgent "Troski Reporter" scenarios, text remains legible under stress.

**Editorial Tip:** Use "Asymmetric Scale." Pair a `display-lg` title with a `body-sm` description to create a high-contrast, magazine-style layout that feels curated rather than generated.

---

## 4. Elevation & Depth
In this design system, shadows are light, not dark.

*   **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` card sitting on a `surface-container-low` background creates a natural, soft "recession" without a single line of code for shadows.
*   **Ambient Shadows:** When a component must float (e.g., a "Report Crime" button), use an extra-diffused shadow: `blur: 32px`, `opacity: 6%`, using a tinted version of the `surface-tint` (#ECC300) to mimic ambient light.
*   **The "Ghost Border" Fallback:** If a container requires definition for accessibility, use the `outline-variant` token at 15% opacity. Never use 100% opaque outlines.

---

## 5. Components

### Buttons: The Golden Standard
*   **Primary:** `primary-container` (#FCD116) background. Roundedness: `full`. No border. Text: `on-primary-container` (#6E5A00). 
*   **Secondary:** `surface-container-high` background. Text: `primary`. 
*   **Tertiary:** Transparent background. Text: `primary`. Used for "Cancel" or "More Info" to maintain hierarchy.

### The "Black Star" Iconography
Icons must be "Subtle Black Star" style—minimalist line art with a signature 5-point star motif integrated into the corner or center of primary action icons. Use `outline` (#999078) for inactive states.

### Cards & Lists (The Divider-Free Approach)
*   **Streaming Cards:** Use `surface-container-lowest` with a 5% `primary` tint on hover. 
*   **Utility Lists:** Use vertical white space (`spacing-4`) to separate items. If separation is visually required, use a background color shift between alternating rows using `surface-container-low` and `surface-container-lowest`.

### Input Fields: The Urgent Utility
For 'Troski Reporter', inputs must feel "Live."
*   **Surface:** `surface-container-highest` for the field container.
*   **Active State:** Transitions from `outline-variant` to a 2px `primary` bottom-bar. 
*   **Error State:** Use `error` (#FFB4AB) with a soft `error-container` glow behind the text to ensure the "Urgent" feel doesn't become "Panic."

### Global Badges
*   **Live Tags:** Background: `tertiary-container` (#FFC8C4). Text: `on-tertiary-container` (#BB001E).
*   **Success/Verified Badges:** Background: `secondary-container` (#006A3E). Text: `on-secondary-container` (#8FE7B0).

---

## 6. Do's and Don'ts

### Do:
*   **Embrace the Void:** In the streaming UI, let the `surface-container-lowest` background breathe. Large margins create a "Cinema" feel.
*   **Animate Transitions:** In the reporting UI, use "staggered entry" animations where list items slide in from the bottom with a 20ms delay between them.
*   **Use Tonal Layering:** Always check if you can separate two elements with color before reaching for a line or a shadow.

### Don't:
*   **Don't use pure white (#FFFFFF):** Even in the light-grey "Troski" mode, use `surface-bright` or `on-background` variants to keep the UI feeling premium and easy on the eyes.
*   **Don't use standard "Drop Shadows":** Avoid the heavy, muddy grey shadows common in default UI kits.
*   **Don't Box Everything:** Allow images or movie posters to bleed slightly off-center or overlap with text to maintain the editorial "Prism" aesthetic.

---

## 7. Token Reference Summary
*   **Primary Accent (The Sun):** `#FCD116`
*   **Safety/Police (The Forest):** `#006B3F`
*   **Urgency/Live (The Flame):** `#CE1126`
*   **Background (The Night):** `#050505`
*   **Base Spacing Unit:** `0.35rem` (Scale: 1, 1.5, 2, 3, 4, 6, 8, 12, 16)
*   **Default Radius:** `0.25rem` (Scale: sm: 0.125, lg: 0.5, xl: 0.75, full: 9999px)