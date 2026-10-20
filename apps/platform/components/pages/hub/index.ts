import type { ComponentType } from "react";
import { AccountPage } from "./account-page";
import { AchievementsPage } from "./achievements-page";
import { NotificationsPage } from "./notifications-page";
import { OverviewPage } from "./overview-page";
import { ProfilePage } from "./profile-page";

// Slug -> page component for the Hub: Overview (Build group) and Profile, Achievements, Notifications and Account
// (You group). Each is a client component that renders its own <PageHeader>.
export const hubPages: Record<string, ComponentType> = {
  overview: OverviewPage,
  profile: ProfilePage,
  achievements: AchievementsPage,
  notifications: NotificationsPage,
  account: AccountPage,
};
