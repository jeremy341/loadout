import type { IconName } from "./_components/icons/LoadoutIcon";

export const organizers: {
  name: string;
  role: string;
  responsibility: string;
  icon: IconName;
}[] = [
  {
    name: "Jerry",
    role: "Lead organizer",
    responsibility: "Leads LOADOUT and develops its website.",
    icon: "user",
  },
  {
    name: "Fazin / Wind",
    role: "Developer & co-organizer",
    responsibility: "Works on the program plan and helps develop LOADOUT.",
    icon: "code",
  },
  {
    name: "Netic",
    role: "Developer & co-organizer",
    responsibility: "Develops Rivet, LOADOUT's Slack bot, and helps organize the program.",
    icon: "terminal",
  },
];

export const communityResources = [
  { label: "Explore Hack Club", href: "https://hackclub.com/" },
  { label: "Read about YSWS", href: "https://readme.hackclub.com/ysws" },
] as const;
