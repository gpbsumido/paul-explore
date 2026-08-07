/**
 * The curated layer of the research explorer: candidate vascular surgery
 * research topics, the journals worth watching, and the demographic lenses
 * used to spot who the existing literature actually studied.
 *
 * This is deliberately plain data. Each topic carries its own PubMed query,
 * so adding or re-tagging a topic is a data edit, not a code change. Evidence
 * levels come from live counts against these queries, never from anything
 * hand-maintained here.
 */

export const TOPIC_CATEGORIES = [
  "Aortic disease",
  "PAD & limb salvage",
  "Carotid & stroke",
  "Venous disease",
  "Dialysis access",
  "Training & workforce",
  "Disparities & populations",
] as const;

export type TopicCategory = (typeof TOPIC_CATEGORIES)[number];

export type ResearchTopic = {
  id: string;
  name: string;
  category: TopicCategory;
  /** Why this is a promising project, in one line. */
  description: string;
  /** PubMed search expression, kept in PubMed syntax so it can be audited. */
  query: string;
};

export const TOPICS: ResearchTopic[] = [
  {
    id: "aaa-screening-women",
    name: "AAA screening uptake in women",
    category: "Aortic disease",
    description:
      "Screening criteria were built on male cohorts; whether and how women get screened is far less settled.",
    query:
      '("aortic aneurysm, abdominal"[mh] OR abdominal aortic aneurysm[tiab]) AND ("mass screening"[mh] OR screening[tiab]) AND ("female"[mh] OR women[tiab])',
  },
  {
    id: "evar-surveillance-adherence",
    name: "EVAR surveillance adherence",
    category: "Aortic disease",
    description:
      "Lifelong imaging after endovascular repair is the deal patients sign up for, and many quietly stop showing up.",
    query:
      "(EVAR[tiab] OR endovascular aneurysm repair[tiab]) AND surveillance[tiab] AND (adherence[tiab] OR compliance[tiab] OR loss to follow-up[tiab])",
  },
  {
    id: "complex-evar-frailty",
    name: "Complex EVAR in frail patients",
    category: "Aortic disease",
    description:
      "Fenestrated and branched repairs reach sicker anatomy in sicker patients; frailty may matter more than anatomy.",
    query:
      '(fenestrated[tiab] OR branched[tiab]) AND endovascular[tiab] AND aortic[tiab] AND ("frailty"[mh] OR frail[tiab])',
  },
  {
    id: "tevar-timing-dissection",
    name: "Timing of TEVAR in type B dissection",
    category: "Aortic disease",
    description:
      "When to intervene on uncomplicated type B dissection is still argued case by case.",
    query:
      '("aortic dissection"[mh] OR type B aortic dissection[tiab]) AND (TEVAR[tiab] OR thoracic endovascular repair[tiab]) AND timing[tiab]',
  },
  {
    id: "pad-outcomes-women",
    name: "PAD revascularization outcomes in women",
    category: "PAD & limb salvage",
    description:
      "Women present later, get revascularized less, and are underrepresented in the trials the guidelines cite.",
    query:
      '("peripheral arterial disease"[mh] OR peripheral artery disease[tiab]) AND revascularization[tiab] AND ("sex factors"[mh] OR women[tiab] OR sex differences[tiab])',
  },
  {
    id: "amputation-disparities",
    name: "Racial disparities in major amputation",
    category: "PAD & limb salvage",
    description:
      "Amputation rates differ several-fold by race and geography for the same disease; the mechanisms are still being mapped.",
    query:
      '(amputation[tiab]) AND ("peripheral arterial disease"[mh] OR critical limb ischemia[tiab] OR chronic limb-threatening ischemia[tiab]) AND ("healthcare disparities"[mh] OR racial[tiab] OR disparities[tiab])',
  },
  {
    id: "clti-dialysis",
    name: "CLTI revascularization on dialysis",
    category: "PAD & limb salvage",
    description:
      "Dialysis patients were excluded from the landmark limb-salvage trials, and they are the patients on the ward.",
    query:
      '(chronic limb-threatening ischemia[tiab] OR CLTI[tiab] OR critical limb ischemia[tiab]) AND ("renal dialysis"[mh] OR dialysis[tiab] OR end-stage renal[tiab])',
  },
  {
    id: "dcb-long-term-safety",
    name: "Drug-coated balloon long-term safety",
    category: "PAD & limb salvage",
    description:
      "The paclitaxel mortality scare reshaped practice on interim data; long-horizon safety is still being written.",
    query:
      "(drug-coated balloon[tiab] OR paclitaxel-coated[tiab] OR drug-eluting[tiab]) AND (femoropopliteal[tiab] OR peripheral artery[tiab]) AND (mortality[tiab] OR long-term safety[tiab])",
  },
  {
    id: "exercise-therapy-rural",
    name: "Supervised exercise therapy access in rural areas",
    category: "PAD & limb salvage",
    description:
      "First-line claudication therapy that most patients can't actually reach is a health-services project waiting to happen.",
    query:
      '("exercise therapy"[mh] OR supervised exercise[tiab]) AND (claudication[tiab] OR peripheral artery disease[tiab]) AND ("rural population"[mh] OR rural[tiab] OR access to care[tiab])',
  },
  {
    id: "bypass-young-adults",
    name: "Infrainguinal bypass in young adults",
    category: "PAD & limb salvage",
    description:
      "Premature PAD behaves differently and the young bypass patient has decades to live with the choice.",
    query:
      '(infrainguinal bypass[tiab] OR lower extremity bypass[tiab]) AND ("young adult"[mh] OR premature peripheral[tiab] OR young patients[tiab])',
  },
  {
    id: "tcar-octogenarians",
    name: "TCAR in octogenarians",
    category: "Carotid & stroke",
    description:
      "Transcarotid revascularization is marketed to the high-risk elderly, where the trial evidence is thinnest.",
    query:
      '(transcarotid artery revascularization[tiab] OR TCAR[tiab]) AND ("aged, 80 and over"[mh] OR octogenarian[tiab] OR elderly[tiab])',
  },
  {
    id: "carotid-outcomes-women",
    name: "Carotid intervention outcomes in women",
    category: "Carotid & stroke",
    description:
      "Stroke risk, plaque biology, and perioperative outcomes all differ by sex; carotid trials skew male.",
    query:
      '("carotid stenosis"[mh] OR carotid[tiab]) AND (endarterectomy[tiab] OR carotid stenting[tiab]) AND ("sex factors"[mh] OR women[tiab] OR sex differences[tiab])',
  },
  {
    id: "silent-infarcts-carotid",
    name: "Silent brain infarcts after carotid intervention",
    category: "Carotid & stroke",
    description:
      "DWI lesions without clinical stroke are common after intervention and their cognitive cost is unresolved.",
    query:
      "(carotid[tiab]) AND (silent brain infarct[tiab] OR silent ischemic lesion[tiab] OR DWI lesion[tiab]) AND (endarterectomy[tiab] OR stenting[tiab])",
  },
  {
    id: "iliofemoral-vein-stenting",
    name: "Iliofemoral venous stenting outcomes",
    category: "Venous disease",
    description:
      "Venous stents went in faster than the evidence; patency, patient selection, and reintervention need real data.",
    query:
      "(iliofemoral[tiab] OR iliac vein[tiab]) AND stent[tiab] AND (venous[tiab] OR deep venous[tiab])",
  },
  {
    id: "cvi-obesity",
    name: "Chronic venous insufficiency and obesity",
    category: "Venous disease",
    description:
      "Two epidemics that share a leg: how obesity changes CVI treatment response is understudied.",
    query:
      '("venous insufficiency"[mh] OR chronic venous insufficiency[tiab] OR chronic venous disease[tiab]) AND ("obesity"[mh] OR obese[tiab])',
  },
  {
    id: "pelvic-venous-diagnosis",
    name: "Pelvic venous disorder diagnosis",
    category: "Venous disease",
    description:
      "A common cause of chronic pelvic pain that most specialties are not looking for; diagnostic pathways are immature.",
    query:
      "(pelvic venous disorder[tiab] OR pelvic congestion syndrome[tiab] OR pelvic venous insufficiency[tiab]) AND (diagnosis[tiab] OR diagnostic[tiab] OR imaging[tiab])",
  },
  {
    id: "avf-maturation-failure",
    name: "Predicting AV fistula maturation failure",
    category: "Dialysis access",
    description:
      "A third of fistulas never mature; predicting which ones before surgery would change access planning.",
    query:
      "(arteriovenous fistula[tiab]) AND maturation[tiab] AND (failure[tiab] OR predictor[tiab] OR prediction[tiab])",
  },
  {
    id: "endoavf-outcomes",
    name: "Endovascular AVF creation outcomes",
    category: "Dialysis access",
    description:
      "Percutaneous fistula creation is new enough that real-world comparative outcomes are still scarce.",
    query:
      "(endovascular arteriovenous fistula[tiab] OR endoAVF[tiab] OR percutaneous arteriovenous fistula[tiab])",
  },
  {
    id: "access-elderly-frail",
    name: "Access strategy in elderly frail patients",
    category: "Dialysis access",
    description:
      "Fistula-first was written for younger patients; for the frail elderly the right first access is genuinely open.",
    query:
      '("arteriovenous shunt, surgical"[mh] OR vascular access[tiab]) AND (hemodialysis[tiab] OR dialysis[tiab]) AND ("frailty"[mh] OR frail[tiab] OR octogenarian[tiab])',
  },
  {
    id: "trainee-burnout",
    name: "Burnout in vascular surgery trainees",
    category: "Training & workforce",
    description:
      "Long training, high acuity, small programs: trainee wellbeing data specific to vascular surgery is thin.",
    query:
      '("burnout, professional"[mh] OR burnout[tiab]) AND vascular surgery[tiab] AND (resident[tiab] OR trainee[tiab] OR fellow[tiab])',
  },
  {
    id: "women-vascular-workforce",
    name: "Women in the vascular surgery workforce",
    category: "Training & workforce",
    description:
      "Representation, attrition, and career trajectory in one of surgery's least gender-balanced specialties.",
    query:
      "(vascular surgery[tiab]) AND (workforce[tiab] OR career[tiab] OR attrition[tiab]) AND (women[tiab] OR gender[tiab] OR sex[tiab])",
  },
  {
    id: "open-skills-simulation",
    name: "Simulation for open aortic skills",
    category: "Training & workforce",
    description:
      "Endovascular volume is eroding open exposure; how trainees keep open aortic skills is an education question with teeth.",
    query:
      '("simulation training"[mh] OR simulation[tiab]) AND (open repair[tiab] OR open surgical[tiab]) AND (aortic[tiab] OR vascular surgery[tiab])',
  },
  {
    id: "ses-limb-loss",
    name: "Socioeconomic status and limb loss",
    category: "Disparities & populations",
    description:
      "Insurance, income, and neighborhood predict amputation as strongly as anatomy does.",
    query:
      '("social class"[mh] OR socioeconomic[tiab] OR insurance status[tiab]) AND (amputation[tiab] OR limb loss[tiab] OR limb salvage[tiab]) AND (vascular[tiab] OR ischemia[tiab])',
  },
  {
    id: "indigenous-vascular-care",
    name: "Vascular care in Indigenous populations",
    category: "Disparities & populations",
    description:
      "High diabetes and PAD burden, long distances to vascular centers, and almost no literature centered on these patients.",
    query:
      '("indigenous peoples"[mh] OR indigenous[tiab] OR First Nations[tiab] OR "american indian or alaska native"[mh]) AND (vascular disease[tiab] OR peripheral artery[tiab] OR vascular surgery[tiab])',
  },
  {
    id: "frailty-preop-assessment",
    name: "Frailty assessment before vascular surgery",
    category: "Disparities & populations",
    description:
      "Everyone agrees frailty matters and nobody agrees how to measure it at the vascular clinic door.",
    query:
      '("frailty"[mh] OR frailty[tiab]) AND ("vascular surgical procedures"[mh] OR vascular surgery[tiab]) AND (preoperative[tiab] OR risk assessment[tiab] OR outcomes[tiab])',
  },
];

/** Fallback scope when no topic is chosen, e.g. demographic coverage of the whole field. */
export const ALL_VASCULAR_QUERY =
  '"vascular surgical procedures"[mh] OR vascular surgery[tiab]';

export type Journal = {
  id: string;
  name: string;
  /** PubMed journal title abbreviation, used with the [ta] field tag. */
  pubmedName: string;
};

export const JOURNALS: Journal[] = [
  { id: "jvs", name: "Journal of Vascular Surgery", pubmedName: "J Vasc Surg" },
  {
    id: "ejves",
    name: "European Journal of Vascular and Endovascular Surgery",
    pubmedName: "Eur J Vasc Endovasc Surg",
  },
  {
    id: "avs",
    name: "Annals of Vascular Surgery",
    pubmedName: "Ann Vasc Surg",
  },
  {
    id: "jvsvl",
    name: "JVS: Venous and Lymphatic Disorders",
    pubmedName: "J Vasc Surg Venous Lymphat Disord",
  },
  {
    id: "jet",
    name: "Journal of Endovascular Therapy",
    pubmedName: "J Endovasc Ther",
  },
  { id: "vascular", name: "Vascular", pubmedName: "Vascular" },
  {
    id: "svs-seminars",
    name: "Seminars in Vascular Surgery",
    pubmedName: "Semin Vasc Surg",
  },
  { id: "jama-surgery", name: "JAMA Surgery", pubmedName: "JAMA Surg" },
];

export type DemographicGroup =
  "Sex" | "Age" | "Race & ethnicity" | "Health populations";

export type DemographicFacet = {
  id: string;
  label: string;
  group: DemographicGroup;
  /** PubMed clause ANDed onto a topic query to scope it to this population. */
  clause: string;
};

export const DEMOGRAPHICS: DemographicFacet[] = [
  { id: "female", label: "Women", group: "Sex", clause: '"female"[mh]' },
  { id: "male", label: "Men", group: "Sex", clause: '"male"[mh]' },
  {
    id: "aged-65",
    label: "Older adults (65+)",
    group: "Age",
    clause: '"aged"[mh]',
  },
  {
    id: "aged-80",
    label: "Very elderly (80+)",
    group: "Age",
    clause: '"aged, 80 and over"[mh]',
  },
  {
    id: "middle-aged",
    label: "Middle-aged (45-64)",
    group: "Age",
    clause: '"middle aged"[mh]',
  },
  {
    id: "young-adult",
    label: "Young adults (19-39)",
    group: "Age",
    clause: '"young adult"[mh]',
  },
  {
    id: "black",
    label: "Black or African American",
    group: "Race & ethnicity",
    clause: '"black or african american"[mh] OR african american[tiab]',
  },
  {
    id: "hispanic",
    label: "Hispanic or Latino",
    group: "Race & ethnicity",
    clause: '"hispanic or latino"[mh] OR hispanic[tiab]',
  },
  {
    id: "asian",
    label: "Asian",
    group: "Race & ethnicity",
    clause: '"asian"[mh] OR asian patients[tiab]',
  },
  {
    id: "indigenous",
    label: "Indigenous peoples",
    group: "Race & ethnicity",
    clause:
      '"indigenous peoples"[mh] OR "american indian or alaska native"[mh] OR indigenous[tiab]',
  },
  {
    id: "diabetes",
    label: "Diabetes",
    group: "Health populations",
    clause: '"diabetes mellitus"[mh] OR diabetic[tiab]',
  },
  {
    id: "ckd",
    label: "CKD / ESRD",
    group: "Health populations",
    clause: '"renal insufficiency, chronic"[mh] OR end-stage renal[tiab]',
  },
  {
    id: "smokers",
    label: "Smokers",
    group: "Health populations",
    clause: '"smokers"[mh] OR smoking[tiab]',
  },
  {
    id: "obesity",
    label: "People with obesity",
    group: "Health populations",
    clause: '"obesity"[mh] OR obese[tiab]',
  },
  {
    id: "rural",
    label: "Rural communities",
    group: "Health populations",
    clause: '"rural population"[mh] OR rural[tiab]',
  },
  {
    id: "frail",
    label: "Frail patients",
    group: "Health populations",
    clause: '"frailty"[mh] OR frail[tiab]',
  },
];
