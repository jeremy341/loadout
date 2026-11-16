import { Geist, Geist_Mono } from "next/font/google";

// The reviewer site's type: Geist Sans for text and Geist Mono for ids, hashes, durations and numbers, as in the Egg dashboard.
// They are exposed as CSS variables on the reviewer root (see reviewer-theme.css), with system fonts as the fallback.
export const reviewerSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
export const reviewerMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
