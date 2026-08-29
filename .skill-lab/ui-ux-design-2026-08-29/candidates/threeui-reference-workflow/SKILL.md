---
name: threeui-reference-workflow
description: Build or adapt React and Three.js interfaces from ThreeUI Community reference packets with pinned source, assets, runtime, and license boundaries. Use for ThreeUI or 3D-web-interface work; not for generic 2D UI design.
---

# ThreeUI Reference Workflow

Use ThreeUI as reference supply, not as a design oracle. A useful reference packet joins live behavior, controls and variants, source, assets and licenses, runtime versions, and the qualities the product should transfer.

## 1. Establish fit

Clarify the product job, interaction, target devices, performance envelope, accessibility expectations, and the reason 3D earns its runtime and interaction cost.

Inspect current official ThreeUI Community sources rather than relying on cached component counts or package details:

- [threeui.com](https://threeui.com)
- [MengTo/threeui](https://github.com/MengTo/threeui)

This step is complete when the task names what 3D contributes and what a flat or simpler implementation would fail to provide.

## 2. Select a reference packet

Compare live candidates with their controls, variants, source, and responsive behavior. Select by named transferable qualities such as camera behavior, geometry, composition, shader treatment, transition, or control model—not by a vague request to copy the look.

Record:

```text
component and variant
transferable qualities
qualities intentionally rejected
target interaction and product role
```

This step is complete when one reference is the closest useful starting point and the transfer boundary is explicit.

## 3. Pin source and rights

Before implementation, pin the component path and exact package version or source commit. Inspect its import graph and record:

- Three.js and framework versions;
- required source and assets;
- root-relative URLs or configurable asset-base props;
- component, font, image, and third-party licenses; and
- any Pro, Beta, remote, or entitlement boundary.

Do not infer that a preview thumbnail, remote asset, or consumer output inherits the repository's code license.

This step is complete when another agent can retrieve the same permitted source packet without guessing versions or rights.

## 4. Choose the transfer mode

Choose one:

- **reuse** — import the published component when it already fits;
- **adapt** — modify permitted source while preserving the pinned runtime and asset contract; or
- **reconstruct** — reproduce only named behavior or geometry when direct reuse is unsuitable or unauthorized.

Prefer the smallest mode that preserves the intended behavior. Avoid upgrading or deduplicating Three.js versions until compatibility is proven in the target application.

This step is complete when the mode, source-consumption path, and expected differences from the reference are recorded.

## 5. Implement and verify

Use the target repository's package manager, architecture, and proof commands. Keep the 3D surface bounded so loading, fallback, cleanup, and failure behavior remain inspectable.

Verify the candidate against the selected packet and product contract:

- build and runtime correctness;
- desktop and mobile composition;
- camera, controls, variants, transitions, and state behavior;
- asset loading and deployment paths;
- frame time, load cost, memory, and cleanup where measurable;
- keyboard, reduced-motion, and non-WebGL fallback behavior where relevant; and
- product fit and owner acceptance.

Direct source reuse proves neither fidelity nor suitability. Preserve a source-consumption receipt and screenshots or recordings of the implemented states.

This step is complete when checks cover the claimed transferable qualities, material deviations are visible, and the owner decides whether the 3D treatment earns its cost.

## Source

Adapted from the [ThreeUI Community repository](https://github.com/MengTo/threeui) and the knowledge note `meng-to-threeui-agent-consumable-reference-library-2026-08-21.md`.
