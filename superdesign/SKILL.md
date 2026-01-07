---
name: superdesign
description: AI design agent principles from Superdesign. Generate UI mockups with variations using proven design system.
---

# Superdesign Skill

Design principles and workflow from [Superdesign](https://github.com/superdesigndev/superdesign) - an open source design agent.

## Core Principle

When asked to create UI designs, **generate 3 variations** concurrently for faster iteration.

## Design Guidelines

### File Output
- Output to `.superdesign/design_iterations/{name}_{n}.html`
- Iterations: `table_1.html`, `table_2.html`, `table_3.html`
- Sub-iterations: `ui_1_1.html`, `ui_1_2.html`

### Technical Rules
1. **No images** - Use CSS placeholders (no placehold.co either)
2. **Tailwind CSS via CDN** - `<script src="https://cdn.tailwindcss.com"></script>`
3. **Text colors**: Only black or white
4. **Spacing**: Use 4pt or 8pt system (all margins/padding multiples)
5. **Responsive**: Must look good on mobile, tablet, desktop

### Design Style
- Elegant minimalism + functional design
- Generous white space
- Clear information hierarchy
- Subtle shadows, modular card layouts
- Refined rounded corners

## Usage

When user asks for UI design:

```
1. Create .superdesign/design_iterations/ folder if not exists
2. Generate 3 HTML variations with slight differences:
   - Variation 1: Conservative/clean
   - Variation 2: More creative/bold  
   - Variation 3: Alternative layout
3. Each file is standalone HTML with Tailwind CDN
4. User can preview in browser and pick favorite
```

## Example Prompt

User: "Design a pricing table"

You create:
- `.superdesign/design_iterations/pricing_1.html` - Clean 3-column
- `.superdesign/design_iterations/pricing_2.html` - Card-based with shadows
- `.superdesign/design_iterations/pricing_3.html` - Horizontal comparison

## HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Design - {name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-black">
  <!-- Your design here -->
</body>
</html>
```

## Integration with UI/UX Pro Max

This skill complements `ui-ux-pro-max`:
- **Superdesign**: Quick iteration, 3 variations, visual exploration
- **UI/UX Pro Max**: Deep style guides, color palettes, UX best practices

**Recommended workflow:**
1. Use UI/UX Pro Max to research style, colors, typography
2. Use Superdesign to generate 3 variations quickly
3. User picks favorite, refine with UI/UX Pro Max guidelines

## Source

Based on [superdesigndev/superdesign](https://github.com/superdesigndev/superdesign) by AI Jason.
