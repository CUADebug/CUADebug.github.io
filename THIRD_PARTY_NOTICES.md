# Third-party notices

This static CUADebug preview vendors selected trajectory evidence so that the project page does not download multi-gigabyte archives at runtime.

## CUA Debugger Trajectories

- Source: <https://huggingface.co/datasets/CyT1ng/cua_debugger_traj>
- Public-dataset revision: `40dab5eb9f5b98699f9df7c95dbd97ba69f5aad8`
- Public source archives: `claude_4.5_sonnet_traj_144.zip` and `gemini_2.5_pro_traj_30.zip`
- Archived snapshot: one checked-in Claude Sonnet 4.5 15-step trajectory and its Zeyi annotation
- Viewer-selected tasks (the manifest records the split/archive for each UUID):

| Family | Paper tag | Task UUID |
|---|---|---|
| P | P2 | `04d9aeaf-7bed-4024-bedb-e10e6f00eb7f` |
| P | P5 | `05dd4c1d-c489-4c85-8389-a7836c4f0567` |
| P | P4 | `1f18aa87-af6f-41ef-9853-cdb8f32ebdea` |
| G | G1 | `04578141-1d42-4146-b9cf-6fab4ce5fd74` |
| G | G3 | `09a37c51-e625-49f4-a514-20a773797a8a` |
| G | G1 | `0a211154-fda0-48d0-9274-eaac4ce5486d` |
| R | R8 | `0326d92d-d218-48a8-9ca1-981cd6d064c7` |
| R | R10 | `0512bb38-d531-4acf-9e7e-0add90816068` |
| R | R3 | `185f29bd-5da0-40a6-b69c-ba7f4e0324ef` |
| S | S3 | `7f52cab9-535c-4835-ac8c-391ee64dc930` |
| S | S7 | `bedcedc4-4d72-425e-ad62-21960b11fe0d` |
| S | S7 | `c1fa57f3-c3db-4596-8f09-020701085416` |

For each selected task, the website vendors a trajectory JSONL, per-step screenshots, evaluator result, a checked-in human reference, and the corresponding precomputed machine RCA. The `human_reference_source` field in `data/cases.json` distinguishes a public Hugging Face record from an archived annotation snapshot. Selection is fail-closed: all 12 cases match their stored human reference exactly on `root_error_step`, `taxonomy_tag`, `evidence`, and `correction`. Because one task UUID can occur in more than one trajectory split, `source_split`, `source_archive`, and `data_dir` jointly identify the displayed run.

The selected cases represent 10 of the canonical paper's 30 subtypes; the repeated G1 and S7 examples are intentional so that the viewer contains three aligned cases from each P/G/R/S family. This curated website selection is not a claim about the full dataset's subtype availability or debugger accuracy. No missing trajectory, annotation, or RCA is synthesized.

Recordings, runtime logs, large message dumps, and unrelated task files are not loaded by the viewer. Display metadata and collision-safe source keys live in `data/cases.json`; interface labels and coordinate overlays are not burned into the source screenshots.

- License stated by the dataset card: Apache License 2.0

## OSWorld

- Project and data explorer: <https://osworld-v1.xlang.ai/>
- Source repository: <https://github.com/OS-Copilot/OSWorld>
- License: Apache License 2.0

The interaction idea of selecting a task and inspecting linked static trajectory data is informed by the OSWorld Data Explorer. The CUADebug page structure, components, and visual styling are original.

## Trademarks and application UI

GIMP, GNU, Ubuntu, Visual Studio Code, LibreOffice, and other third-party names or interface elements visible in trajectory screenshots or paper figures belong to their respective owners. Their appearance identifies the recorded task environment and does not imply endorsement.

The Apache License 2.0 text is included at [`LICENSES/Apache-2.0.txt`](./LICENSES/Apache-2.0.txt).
