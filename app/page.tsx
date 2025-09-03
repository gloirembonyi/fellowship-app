import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to the application form page
  redirect("/apply");
}
