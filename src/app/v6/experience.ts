/**
 * The About band's timeline, copied from my published résumé
 * (public/resume/Resume-Developer-Sumido.pdf). Newest first. When the résumé
 * changes, this changes with it; nothing here should say more than that file.
 */
export type TimelineEntry = {
  id: string;
  dates: string;
  title: string;
  place: string;
  points: string[];
};

export const WORK: TimelineEntry[] = [
  {
    id: "helika",
    dates: "Jun 2023 - Feb 2026",
    title: "Senior Software Developer (Frontend Lead)",
    place: "Helika, Calgary (remote)",
    points: [
      "Led the front end of an enterprise gaming-analytics platform, including a reusable 15-component charting library behind dashboards of 20+ visualizations each.",
      "Shipped Helika AI, a conversational analytics assistant that answers with live charts, dashboards and leaderboards inline.",
      "Built the drag-and-drop Dashboard and Visual Designer for multiple enterprise studios.",
    ],
  },
  {
    id: "refmint",
    dates: "Feb 2022 - Jun 2023",
    title: "Frontend Developer",
    place: "Refmint, Vancouver (remote)",
    points: [
      "Cut page load times 40% on data-heavy React apps with lazy loading and caching.",
      "Built a shared UI component library with automated CI/CD pipelines.",
    ],
  },
  {
    id: "peopleinsight",
    dates: "Apr 2017 - Jan 2022",
    title: "Front-End Developer (Analytics)",
    place: "PeopleInsight, Ottawa",
    points: [
      "Built interactive React dashboards for enterprise HR analytics, plus survey-driven data collection with validation and automated tests.",
      "Automated data-processing pipelines and verification queries, cutting analytics QA time by 80%.",
    ],
  },
];

export const EDUCATION: TimelineEntry[] = [
  {
    id: "carleton",
    dates: "2013 - 2018",
    title: "Bachelor of Engineering, Communications Engineering",
    place: "Carleton University, Ottawa",
    points: [],
  },
];
