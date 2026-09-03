# Define: generated media

Use this branch only when bespoke imagery, 3D, shaders, or video has a named role in the selected direction. Generated media is design material, not automatic polish.

## Choose the lightest capable medium

| Need | Prefer |
| --- | --- |
| Texture, depth, illustration, product world, or a signature still | Image generation |
| Responsive geometric behavior tied to input | CSS, canvas, WebGL, or a shader |
| Organic physics, complex transformation, cinematic atmosphere | Video generation |
| Transition between visually defined product states | Keyframes plus video interpolation |

Use ordinary code and existing assets when they express the idea equally well. Skip media that only fills empty space, disguises weak hierarchy, or repeats a generic visual trope.

**Decision criterion:** the medium performs a specific narrative, explanatory, spatial, or interaction job that survives when described in one sentence.

## Image direction

Specify the asset before generating it:

- role in the interface and intended focal point;
- subject, environment, material, lighting, and lens or rendering language;
- composition, crop, negative space, and text-safe region for each breakpoint;
- palette relationship to the interface;
- required consistency across a set;
- dimensions, transparency, file format, and size budget;
- exclusions that would make it feel like stock or generic AI art.

Generate a small set of meaningfully different candidates. Evaluate them inside the real layout, not on an isolated image canvas. Check subject integrity, text artifacts, edges, crop behavior, contrast, and whether the image steals attention from the task. Provide useful alt text when the image conveys content; mark it decorative when it does not.

## Video and state interpolation

Use video when the concept depends on motion too complex or physical for simpler animation.

1. Storyboard the start, important intermediate state, and end.
2. Generate or approve still keyframes before paying for long clips.
3. For a sequence, use the accepted final frame of one clip as the next clip's starting reference to preserve continuity.
4. For an overlay, generate against the intended background when reflections or refraction must match, then use chroma key or matting only when the edge quality survives the real composition.
5. Map playback to a purposeful event—entry, navigation, progress, scroll, or gesture—and define whether it plays, loops, pauses, or scrubs.
6. Provide poster frames, reduced-motion behavior, load failure fallback, and controls when the video carries information.

Inspect representative frames and the transition in the browser or target device. Watch for temporal warping, inconsistent objects, seams, sudden lighting changes, unreadable overlays, dropped frames, and scroll-jank.

## Current providers and costs

Media providers, model quality, price, licensing, and privacy terms change quickly. When a task requires an external provider, check current official documentation and compare the candidates on quality, consistency, latency, cost, rights, data handling, and output constraints. Ask before incurring cost or creating/changing an account.

Prefer a built-in approved generation tool when it satisfies the brief. If credentials are required, use an existing approved secret store or local ignored environment file. Never paste a real key into a prompt, commit it, embed it in client code, or repeat it in the handoff.

## Integration proof

Verify:

- responsive crop and focal position;
- loading, poster, error, and offline behavior;
- compressed size and measurable layout stability;
- contrast and readability with overlays;
- keyboard and reduced-motion behavior where interactive;
- attribution or licensing obligations;
- removal of unused generated variants from the shipped bundle.

**Branch completion criterion:** the media strengthens the selected identity in the actual interface, remains robust across required states and viewports, meets the runtime budget, and has no unresolved rights, privacy, or cost issue.
