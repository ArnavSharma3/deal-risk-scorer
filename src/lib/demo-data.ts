import { subDays, addDays } from "date-fns";

export interface DemoDealSeed {
  name: string;
  amount: number;
  stage: string;
  closeDate: Date;
  ownerName: string;
  lastActivityDate: Date;
  stageEnteredAt: Date;
  activities: { type: "EMAIL" | "MEETING" | "CALL" | "TASK"; subject: string; date: Date }[];
  stakeholders: { name: string; email: string; lastEngagementDate: Date; engagementCount: number }[];
}

export const DEMO_DEALS: DemoDealSeed[] = [
  {
    name: "Acme Corp Enterprise License",
    amount: 450000,
    stage: "Negotiation/Review",
    closeDate: addDays(new Date(), 18),
    ownerName: "Sarah Chen",
    lastActivityDate: subDays(new Date(), 2),
    stageEnteredAt: subDays(new Date(), 8),
    activities: [
      { type: "MEETING", subject: "Contract review call", date: subDays(new Date(), 2) },
      { type: "EMAIL", subject: "Revised pricing proposal", date: subDays(new Date(), 3) },
      { type: "CALL", subject: "Legal questions follow-up", date: subDays(new Date(), 5) },
    ],
    stakeholders: [
      { name: "James Wilson", email: "jwilson@acme.com", lastEngagementDate: subDays(new Date(), 2), engagementCount: 8 },
      { name: "Lisa Park", email: "lpark@acme.com", lastEngagementDate: subDays(new Date(), 3), engagementCount: 5 },
      { name: "Tom Bradley", email: "tbradley@acme.com", lastEngagementDate: subDays(new Date(), 5), engagementCount: 3 },
    ],
  },
  {
    name: "Globex Digital Transformation",
    amount: 780000,
    stage: "Proposal/Price Quote",
    closeDate: addDays(new Date(), 45),
    ownerName: "Mike Torres",
    lastActivityDate: subDays(new Date(), 22),
    stageEnteredAt: subDays(new Date(), 35),
    activities: [
      { type: "EMAIL", subject: "Proposal sent", date: subDays(new Date(), 22) },
      { type: "MEETING", subject: "Demo session", date: subDays(new Date(), 40) },
    ],
    stakeholders: [
      { name: "Karen Miller", email: "kmiller@globex.com", lastEngagementDate: subDays(new Date(), 22), engagementCount: 2 },
    ],
  },
  {
    name: "Initech Platform Upgrade",
    amount: 320000,
    stage: "Value Proposition",
    closeDate: addDays(new Date(), 30),
    ownerName: "Sarah Chen",
    lastActivityDate: subDays(new Date(), 5),
    stageEnteredAt: subDays(new Date(), 12),
    activities: [
      { type: "MEETING", subject: "ROI workshop", date: subDays(new Date(), 5) },
      { type: "EMAIL", subject: "ROI deck shared", date: subDays(new Date(), 6) },
      { type: "CALL", subject: "Technical requirements", date: subDays(new Date(), 10) },
      { type: "EMAIL", subject: "Case study: similar deployment", date: subDays(new Date(), 12) },
    ],
    stakeholders: [
      { name: "Bill Lumbergh", email: "bill@initech.com", lastEngagementDate: subDays(new Date(), 5), engagementCount: 6 },
      { name: "Peter Gibbons", email: "peter@initech.com", lastEngagementDate: subDays(new Date(), 10), engagementCount: 4 },
      { name: "Samir Nagheenanajar", email: "samir@initech.com", lastEngagementDate: subDays(new Date(), 12), engagementCount: 2 },
    ],
  },
  {
    name: "Umbrella Corp Security Suite",
    amount: 560000,
    stage: "Discovery",
    closeDate: addDays(new Date(), 60),
    ownerName: "Mike Torres",
    lastActivityDate: subDays(new Date(), 1),
    stageEnteredAt: subDays(new Date(), 5),
    activities: [
      { type: "MEETING", subject: "Discovery kickoff", date: subDays(new Date(), 1) },
      { type: "EMAIL", subject: "Security questionnaire", date: subDays(new Date(), 2) },
    ],
    stakeholders: [
      { name: "Albert Wesker", email: "awesker@umbrella.com", lastEngagementDate: subDays(new Date(), 1), engagementCount: 3 },
      { name: "Jill Valentine", email: "jill@umbrella.com", lastEngagementDate: subDays(new Date(), 2), engagementCount: 2 },
    ],
  },
  {
    name: "Stark Industries Cloud Migration",
    amount: 920000,
    stage: "Negotiation/Review",
    closeDate: addDays(new Date(), 10),
    ownerName: "Sarah Chen",
    lastActivityDate: subDays(new Date(), 18),
    stageEnteredAt: subDays(new Date(), 25),
    activities: [
      { type: "EMAIL", subject: "Final pricing", date: subDays(new Date(), 18) },
      { type: "MEETING", subject: "Executive briefing", date: subDays(new Date(), 30) },
    ],
    stakeholders: [
      { name: "Tony Stark", email: "tony@stark.com", lastEngagementDate: subDays(new Date(), 18), engagementCount: 4 },
      { name: "Pepper Potts", email: "pepper@stark.com", lastEngagementDate: subDays(new Date(), 25), engagementCount: 2 },
    ],
  },
  {
    name: "Wayne Enterprises Analytics",
    amount: 275000,
    stage: "Qualification",
    closeDate: addDays(new Date(), 90),
    ownerName: "Mike Torres",
    lastActivityDate: subDays(new Date(), 4),
    stageEnteredAt: subDays(new Date(), 10),
    activities: [
      { type: "CALL", subject: "Intro call", date: subDays(new Date(), 4) },
      { type: "EMAIL", subject: "Qualification questions", date: subDays(new Date(), 5) },
      { type: "MEETING", subject: "Initial discovery", date: subDays(new Date(), 8) },
    ],
    stakeholders: [
      { name: "Bruce Wayne", email: "bruce@wayne.com", lastEngagementDate: subDays(new Date(), 4), engagementCount: 3 },
      { name: "Lucius Fox", email: "lucius@wayne.com", lastEngagementDate: subDays(new Date(), 8), engagementCount: 2 },
    ],
  },
  {
    name: "Oscorp R&D Platform",
    amount: 180000,
    stage: "Prospecting",
    closeDate: addDays(new Date(), 120),
    ownerName: "Sarah Chen",
    lastActivityDate: subDays(new Date(), 35),
    stageEnteredAt: subDays(new Date(), 40),
    activities: [
      { type: "EMAIL", subject: "Cold outreach", date: subDays(new Date(), 35) },
    ],
    stakeholders: [
      { name: "Norman Osborn", email: "norman@oscorp.com", lastEngagementDate: subDays(new Date(), 35), engagementCount: 1 },
    ],
  },
  {
    name: "Cyberdyne AI Integration",
    amount: 650000,
    stage: "Id. Decision Makers",
    closeDate: addDays(new Date(), 25),
    ownerName: "Mike Torres",
    lastActivityDate: subDays(new Date(), 8),
    stageEnteredAt: subDays(new Date(), 20),
    activities: [
      { type: "MEETING", subject: "Stakeholder mapping session", date: subDays(new Date(), 8) },
      { type: "EMAIL", subject: "Org chart request", date: subDays(new Date(), 12) },
      { type: "CALL", subject: "Champion check-in", date: subDays(new Date(), 15) },
    ],
    stakeholders: [
      { name: "Miles Dyson", email: "dyson@cyberdyne.com", lastEngagementDate: subDays(new Date(), 8), engagementCount: 5 },
      { name: "Sarah Connor", email: "sarah@cyberdyne.com", lastEngagementDate: subDays(new Date(), 15), engagementCount: 1 },
    ],
  },
];
