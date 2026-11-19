import { SAMPLE_EXECUTIVE, SAMPLE_GRAPHIC, SAMPLE_SIDEBAR, SAMPLE_UIUX } from "./resume-samples";

/** `sample` is the demo data shown when this theme is picked and the editor still holds a sample. */
export type ThemeOption = {
  id: string;
  name: string;
  hint?: string;
  css: string;
  pro?: boolean;
  sample?: string;
  supportsPhoto?: boolean;
};
export type ThemeDefinition = Omit<ThemeOption, "css"> & { directory: string };

export const DEFAULT_RESUME_CSV = `section,title,subtitle,date,details
Name,Daniel Gallego,UX Designer,,
Contact,,,,+123-456-7890
Contact,,,,hello@reallygreatsite.com
Contact,,,,"123 Anywhere St., Any City"
About Me,,,,"UX Designer dedicated to achieving meaningful outcomes, enthusiastic about embracing dynamic challenges and utilizing creativity to create intuitive user experiences. Proven expertise in project management, user-focused problem-solving, and effective collaboration across teams. Proficient in employing cutting-edge tools and methodologies to enhance processes and boost user satisfaction."
Education,UX Industrial Basics and General Application,University of Engineering UX Cohort,Aug 2016 - Oct 2019,"Major in Automotive Technology.|Thesis on ""Technological Advancements within the current Mechatronics Industry""."
Education,Bachelor of Design in Process Engineering,Engineering University,May 2014 - May 2016,Relevant coursework in Structural Design and Project Management.
Professional Experience,"Instant Chartz App, Morcelle Program",,,"Led development of an advanced automation system, achieving a 15% increase in operational efficiency.|Streamlined manufacturing processes, reducing production costs by 10%.|Implemented preventive maintenance strategies, resulting in a 20% decrease in equipment downtime."
Professional Experience,"System UX Engineer, XarrowAI Industries",,Feb 2021 - Dec 2022,"Designed and optimised a robotic control system, realizing a 12% performance improvement.|Coordinated testing and validation, ensuring compliance with industry standards.|Provided technical expertise, contributing to a 15% reduction in system failures."
Technical Skills,,,,Prototyping Tools|User Research|Information Architecture|Interaction Design|Visual Design|Usability Heuristics|Accessibility|Responsive Design|User Testing Tools
Languages,,,,English (Fluent)|French (Conversational)|Mandarin (Basic)
References,Estelle Darcy,Wardiere Inc. / CTO,,Phone: +124-4236-7894|Email: estelle@reallygreatsite.com
References,Harper Lin,Borcelle Studio / Director,,Phone: +123-456-7890|Email: harper@reallygreatsite.com
Additional Information,,,,"Certifications: Professional Design Engineer (PDE) License, Project Management Tech (PMT).|Awards/Activities: Most Innovative Employer of the Year (2021), Overall Best Employee Division Two (2024), Onboarding Project Lead (2023)."
`;

const D = DEFAULT_RESUME_CSV;

export const RESUME_THEME_DEFS: ThemeDefinition[] = [
  { id: "resume-classic", name: "Plain", hint: "ATS-friendly", directory: "plain", sample: D },
  { id: "resume-timeline", name: "Ledger", directory: "ledger", sample: D },
  { id: "resume-editorial", name: "Margin", directory: "margin", sample: D, supportsPhoto: true },
  {
    id: "resume-sidebar",
    name: "Midnight",
    directory: "midnight",
    sample: SAMPLE_SIDEBAR,
    supportsPhoto: true,
  },
  {
    id: "resume-executive",
    name: "Boardroom",
    hint: "ATS-friendly",
    directory: "boardroom",
    sample: SAMPLE_EXECUTIVE,
  },
  {
    id: "resume-graphic",
    name: "Terracotta",
    hint: "Creative",
    directory: "terracotta",
    sample: SAMPLE_GRAPHIC,
    supportsPhoto: true,
  },
  {
    id: "resume-uiux",
    name: "Pop",
    hint: "Creative",
    directory: "pop",
    sample: SAMPLE_UIUX,
    supportsPhoto: true,
  },
];

/** True while the editor still holds one of our demo datasets (so swapping in another one is safe). */
export const isResumeSample = (csv: string) => RESUME_THEME_DEFS.some((theme) => theme.sample === csv);