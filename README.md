# LabCoat · Acid–base titration

Rehearse determining an unknown hydrochloric acid concentration with standardised sodium hydroxide and phenolphthalein. The application includes a Three.js teaching bench, a student notebook, a lecturer mapping and publication workflow, and stage-aware demonstrator coaching.

## Run locally

Use Node.js 24 and npm. From the repository root:

```sh
npm ci
npm test
npm run build
npm start
```

Open http://127.0.0.1:4173. The server also serves direct links at /lecturer and /student. Rebuild after changing the frontend. Stop the server with Ctrl+C.

1. Open **Lecturer studio** and select **Load demonstration procedure**. The sample is an editable demonstration handout.
2. Review each original line against the supported bench action and equipment. Paste custom procedures as one action per line. Confirm flagged mappings only after resolving the source wording. Redraft after editing the handout.
3. Review the aliquot, titrant, hidden sample bounds, concordance tolerance and hint policy. Set both hidden bounds to the same value to use a fixed sample. **Student preview** runs the draft without publishing it.
4. Select **Publish practical**, then open the **Student bench**. In practice mode, start a rough run, use the eye-level view to enter the meniscus readings, and use stream dosing to approach the endpoint. Switch to drops and swirl before judging the mixed colour. **Observe 30 s** simulates the observation interval. Aim for the first persistent faint pink.
5. Record at least two concordant repeat titres and calculate the result from their mean. The notebook excludes the rough run from concordance. If several groups tie, the app uses the group with the smallest titres. In mock assessment mode, trial diagnostics appear on submission.

Bench objects and on-screen buttons offer equivalent actions. The calibrated eye-level overlay enlarges the scale. Its accessible disclosure reads the bottom of the meniscus to two decimal places. The overlay and procedural controls also work if WebGL is unavailable.

Publication persists in `.labcoat/practical.json`. The lecturer can reopen it after restart. Attempts and their notebook entries live in server memory for the current run. This is a single-machine demonstration bound to loopback. Lecturer and student views share the same local trust boundary. A multi-user rollout needs authentication, role separation, and durable attempt storage.

## Optional live AI

Copy `.env.example` to `.env`, set `OPENAI_API_KEY`, optionally set `OPENAI_MODEL` to a Responses API model available to your account, and restart the server. `PORT` defaults to 4173. The server keeps the key out of the browser.

Without a key the interface shows **Scripted demo**. The bundled handout maps deterministically, and custom steps in scripted mode start unresolved for manual review. With a key, custom handout lines are sent for suggested mappings and ambiguity flags. Publication still validates the action set, sequence and numeric limits. The approved procedure used at the student bench is the canonical instruction for each reviewed mapping. Free-form source text remains in lecturer authoring, where it may contain private sample information.

Live coaching receives the canonical approved procedure, current stage, observable colour state and student question. Hidden concentrations, equivalent volumes, measured readings, and grading data stay out of the hint payload. API failures are shown to the user.

## Chemistry and teaching assumptions

- HCl and NaOH fully dissociate. Neutralisation consumes hydronium and hydroxide in a 1:1 molar ratio. The equilibrium volume in mL is C(HCl) × aliquot in mL / C(NaOH). The known 25.00 mL, 0.1000 mol/L case with 0.1000 mol/L NaOH gives 25.00 mL. The model uses additive volumes, ideal activities and water autoionisation with Kw = 10⁻¹⁴ at 25 °C. [OpenStax, Chemistry: Atoms First 2e, §14.7](https://openstax.org/books/chemistry-atoms-first-2e/pages/14-7-acid-base-titrations)
- The observed endpoint is a separate colour judgement. The phenolphthalein model uses a visible onset at pH 8.3 and a response centred at pH 9.3. An illustrative colour-intensity cutoff separates faint pink from deep pink. This cutoff is a display calibration for the rehearsal. Indicator volume and acid consumption are neglected. [OpenStax, §14.7](https://openstax.org/books/chemistry-atoms-first-2e/pages/14-7-acid-base-titrations), [Chem1, Acid/Base Titration](https://chem.libretexts.org/Bookshelves/General_Chemistry/Chem1_%28Lower%29/13%3A_Acid-Base_Equilibria/13.05%3A_Acid_Base_Titration)
- The model holds added titrant in an unmixed local zone until the student swirls. The plume is illustrative and swirling homogenises it in one action. Stream, single-drop and feathered-stopcock doses are 1.00, 0.03 and 0.001 mL. The finest increment models delivering a fraction of a drop. Actual volumes retain model precision. Student entries use 0.01 mL. The starting reading varies by trial and the same hidden sample persists throughout the attempt.
- The teaching sequence adapts common volumetric technique: condition and clear the burette tip, condition the pipette, transfer with a filler, add indicator, read the bottom of the meniscus at eye level, swirl, and use a white background to judge persistent faint pink. Preparation and transfer compress several physical operations into one interaction each. [Los Medanos College, General College Chemistry Lab Manual](https://chem.libretexts.org/Courses/Los_Medanos_College/General_College_Chemistry_Lab_Manual_%28Semester_2%29/01%3A_Experiments/1.09%3A_New_Page), [LibreTexts, Titration of Vinegar](https://chem.libretexts.org/Ancillary_Materials/Laboratory_Experiments/Wet_Lab_Experiments/General_Chemistry_Labs/Online_Chemistry_Lab_Manual/Chem_10_Experiments/11%3A_Titration_of_Vinegar_%28Experiment%29), [LibreTexts, Titration of Juice](https://chem.libretexts.org/Ancillary_Materials/Laboratory_Experiments/Wet_Lab_Experiments/General_Chemistry_Labs/General_Chemistry_Labs_II/06.02%3ATitration_of_Juice)

Before teaching, the lecturer should validate the actual apparatus, titrant standardisation, PPE and waste procedure, indicator amount, endpoint and persistence criterion, concordance rule, rounding and assessment rubric against the institution’s protocol. The demonstration omits real-world apparatus errors, reagent degradation and lab safety operations.

## Assets and verification

The 3D meshes, scales, bottle labels and styling are generated in this repository. There are no external image, font, or model assets. The rendering library is Three.js.

The automated checks cover 25.00 mL equivalence, indicator onset, overshoot, retry state, non-zero initial readings, independent student entries, configuration validation, concordance and unit conversion. The in-app browser flow published the example with a smaller fixed aliquot for a short test, restarted the server, overshot and discarded the rough run, recorded two faint-pink 1.00 mL repeats, and submitted 20 mmol/L. It also verified the home and direct lecturer/student routes, mock preview launch, and different scripted answers to the same question at two stages. The default demonstration settings were restored after testing. Live API calls were outside this verification.



## Free practice and the lab environment

In Practice, drag the bench view to orbit and use Shift + scroll to zoom. Select **Arrange equipment** to drag the table, burette assembly, flask, tile, pipette or reagent bottles. The same panel offers directional buttons. The table carries the equipment with it. A misaligned flask prevents dosing until you move it underneath the tip. **Place flask under tip** and **Reset layout** are available in the arrangement panel. Positions are bounded to the teaching bench.

When the lecturer enables experiments, try omitting the indicator and compare the clear solution to its appearance after adding indicator. **Restart this trial** resets the current glassware and entries while preserving completed trials, the unknown sample and your layout. Mock assessments use the published starting layout and the guided procedure.

In **Lecturer studio → Lab environment**, preview lighting, table height and finish, and drag equipment to define the starting layout. Choose whether students can move equipment and try experimental steps in Practice. Publishing saves these choices with the practical. Older practicals load with the default environment.

Motion uses elapsed time, and burette ticks render in a single instanced draw. The app respects the system reduced-motion preference. Display smoothness depends on the browser, display refresh and GPU.

## University chemical inventory and incident inbox

In **Lecturer studio → Lab records**, import the university's own inventory export as JSON. The database starts with three demonstration reagents. Each batch accepts up to 2,000 rows. Use the same institutional ID to update an entry. For example:

```json
[
  {
    "id": "stock-0042",
    "name": "Copper(II) sulfate",
    "formula": "CuSO4",
    "aliases": "copper sulfate|copper sulphate"
  }
]
```

The optional `cas` and `sds` fields hold a CAS number and the supplier's HTTPS safety data sheet URL. Import the institution's approved product records and SDS links. LabCoat does not infer hazards or compatibility from a chemical name. Both inventory and incidents persist in `.labcoat/records.sqlite`. The inventory view shows the first 100 matches for each search.

Select **AI handout generator** in Lecturer Studio to draft a chemistry practical. Paste up to 12,000 characters or attach a PDF, DOCX, TXT or Markdown file up to 5 MB. Select **Generate practical** to submit the source. The server sends custom handouts to the configured OpenAI model. PDF and DOCX generation first requests a full transcription. Check it against the original, especially tables, diagrams and units. The drafting pass then maps the procedure to bench geometry and actions, inventories the materials and apparatus, and returns a source-linked coverage checklist. SQLite indexes apparatus keywords and the institution's chemical names, aliases, formulas and CAS numbers. Resolve missing or unsupported items and regenerate before publishing. Always review and preview the draft. Publication replaces the current practical on the student bench.

The crystallisation and osmosis handouts can run from the sample buttons without an API key. The dedicated titration sample uses the existing 3D model. Generated practicals use a Three.js bench with selectable apparatus, an orbit camera, zoom, and animated operations. The AI maps to available bench geometry and visual effects. Starting supplies and setup-only apparatus appear on the bench. Modelled transfers update the receiving vessel; if a step names a required reagent, the bench checks the reagent used. A guided procedure with representative effects is not a quantitative simulation: calibrated instruments, mechanisms and endpoints need a dedicated model. The exact titration sample handout opens the calibrated titration model directly. The illustrative osmosis masses are supplied by the demo, not predicted by a transport model. Custom generation requires `OPENAI_API_KEY`.

The generated bench evaluates transfers using server-side reagent state and a small, explicit model library. It includes qualitative [strong acid–strong base neutralisation](https://openstax.org/books/chemistry-2e/pages/14-4-hydrolysis-of-salt-solutions) and [carbon dioxide evolution from acid and bicarbonate](https://openstax.org/books/chemistry-2e/pages/18-6-occurrence-preparation-and-properties-of-carbonates). It does not predict mixture safety, pH or gas volume. Unmodelled combinations pause the pour and create an incident in published attempts. Never use the teaching bench to decide whether real chemicals can be mixed.

The sample activities were adapted from [University of Hawaiʻi Sea Grant's Reappearing Salt guide](https://manoa.hawaii.edu/sealearning/sites/default/files/5PS_Reappearing%20Salt_Teacher%20Guide.pdf) and [Idaho State University's BIOL 1101L lab manual](https://www.isu.edu/media/libraries/college-of-science-and-engineering/biology/biolab/courses/Manual_1101L_Sp25.pdf).

The **Student incident inbox** refreshes automatically. The simulator records concrete observations such as an off-centre flask, an observed overshoot, an omitted indicator, an inaccurate reading, or a calculation mismatch. Repeat observations within the same run are deduplicated. Deliberate practice may generate alerts, and lecturer previews are excluded. **Suggest coaching** optionally sends the incident category, mode and evidence to the live AI. Without a key it gives scripted guidance. The inbox uses anonymous attempt references and is local to the running lab. University deployment requires authenticated student and lecturer accounts and a policy for access and retention. The local demo uses an in-app inbox as its notification channel.
