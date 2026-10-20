import { redirect } from "next/navigation";
import { HOME_SLUG } from "../components/shell/nav-data";

export default function Home() {
  redirect(`/${HOME_SLUG}`);
}
