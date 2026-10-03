import React from "react";
import { getPublicBusinessSettings } from "@/lib/data/business";
import { ContactView } from "@/components/contact/contact-view";

export const metadata = {
  title: "Contact Us — Amuthavalli Crackers",
  description:
    "Get in touch with Amuthavalli Crackers in Sivakasi for product enquiries, order assistance, or visiting our store.",
};

export default async function ContactPage() {
  const businessSettings = await getPublicBusinessSettings();

  return <ContactView businessSettings={businessSettings} />;
}
