# CUADebug project website

This directory is the dependency-free project page for **CUADebug: Diagnosing and Repairing Computer-Use Agent Failures**. It combines an academic paper page, a curated interactive trajectory viewer spanning every P/G/R/S family, the paper pipeline and re-rollout results, the canonical 30-error taxonomy, and source provenance.

## Run locally

From the repository root:

```powershell
python -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

The viewer uses `fetch`, so opening `index.html` directly with a `file://` URL is not supported.

## Interactive evidence

`data/cases.json` indexes 12 selected examples: three trajectories from each P/G/R/S family. Every checked-in machine RCA exactly matches its checked-in human reference on `root_error_step`, `taxonomy_tag`, `evidence`, and `correction`; each manifest entry identifies whether that reference is the public Hugging Face record or an archived annotation snapshot.

| Family | Selected trajectories | Represented subtypes |
|---|---:|---:|
| P · Perception | 3 | 3 |
| G · Grounding & interaction | 3 | 2 |
| R · Task reasoning & control | 3 | 3 |
| S · External / system | 3 | 2 |
| O · Others | 0 | 0 |

The `(source_split, case_id)` pair is the source identity. `case_key` and `data_dir` provide collision-safe static paths because task UUIDs may occur in more than one source split.

Each selected case directory contains `traj.jsonl`, every referenced `step_*.png`, `result.txt`, the stored `human_annotation.json`, and the corresponding precomputed repository `debugger_rca.json`. No missing example, annotation, or RCA is synthesized. Screenshots load only when selected. The viewer opens on the checked-in human root-cause step: the root is red, downstream drift is amber, and earlier context remains neutral.

The interactive viewer follows a debugger workspace layout: case navigation on the left, the selected visual state in the center, the checked-in human diagnosis and machine comparison on the right, and the full trajectory timeline across the bottom. This release is fail-closed: a selected case does not load if its machine RCA differs from the stored human reference on any of the four structured fields.

## Claim boundary

The page is fully static. The visible diagnosis is checked-in, precomputed data; loading or navigating the viewer does not call a model, execute a GUI agent, start an OSWorld VM, retrieve memory, or run the repository debugger.

Paper-result cards and the re-rollout comparison table are transcribed from Tables 2–4 of the current manuscript and are explicitly labeled paper-reported results, not new reproductions. Dataset provenance comes from the public [CUA Debugger Trajectories dataset](https://huggingface.co/datasets/CyT1ng/cua_debugger_traj). The interaction pattern is informed by the [OSWorld Data Explorer](https://osworld-v1.xlang.ai/), but the CUADebug layout, components, and styling are original.

Public-dataset entries are pinned to revision `40dab5eb9f5b98699f9df7c95dbd97ba69f5aad8`; archived annotation snapshots carry their own source labels in `data/cases.json`. The selected gallery represents 10/30 canonical paper subtypes across P/G/R/S; duplicate G1 and S7 examples are intentional. The manuscript benchmark supports 22 of the 30 defined subtypes. This is a curated viewer selection, not a statement about benchmark accuracy. See [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) and [`LICENSES/Apache-2.0.txt`](./LICENSES/Apache-2.0.txt) for provenance and license details.

## Static deployment

Deploy the repository root as the site root. No build step or server-side route is required.

The document title and public brand are **CUADebug**. Recommended publication paths, pending ownership and team approval, are `cuadebug.xlang.ai` or `agentdebugx.github.io/cuadebug/`. Do not add a `CNAME` until the domain is verified.
