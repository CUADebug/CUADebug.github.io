# Third-party notices

This static CUADebug preview vendors selected public evidence so that the project page does not download multi-gigabyte archives at runtime.

## CUA Debugger Trajectories

- Source: <https://huggingface.co/datasets/CyT1ng/cua_debugger_traj>
- Pinned dataset revision: `40dab5eb9f5b98699f9df7c95dbd97ba69f5aad8`
- Source archive: `claude_4.5_sonnet_traj_144.zip`
- Source split: Claude Sonnet 4.5, 50-step configuration
- Viewer-selected tasks (the split and UUID together identify the source trajectory):

| Family | Paper tag | Task UUID |
|---|---|---|
| P | P2 | `04d9aeaf-7bed-4024-bedb-e10e6f00eb7f` |
| P | P5 | `05dd4c1d-c489-4c85-8389-a7836c4f0567` |
| P | P4 | `1f18aa87-af6f-41ef-9853-cdb8f32ebdea` |
| G | G1 | `99146c54-4f37-4ab8-9327-5f3291665e1e` |
| G | G3 | `236833a3-5704-47fc-888c-4f298f09f799` |
| G | G1 | `0a211154-fda0-48d0-9274-eaac4ce5486d` |
| R | R8 | `0326d92d-d218-48a8-9ca1-981cd6d064c7` |
| R | R10 | `0512bb38-d531-4acf-9e7e-0add90816068` |
| R | R4 | `337d318b-aa07-4f4f-b763-89d9a2dd013f` |
| S | S3 | `7f52cab9-535c-4835-ac8c-391ee64dc930` |
| S | S7 | `bedcedc4-4d72-425e-ad62-21960b11fe0d` |
| S | S7 | `c1fa57f3-c3db-4596-8f09-020701085416` |

For each selected task, the website uses the public trajectory JSONL, per-step screenshots, evaluator result, and public `human_annotation.json` from the pinned archive. The corresponding precomputed machine RCA comes from this repository's debugger results. Selection was fail-closed: all 12 cases match the public human annotation exactly on `root_error_step`, `taxonomy_tag`, `evidence`, and `correction`.

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
