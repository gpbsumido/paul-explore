import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import dynamic from "next/dynamic";

const StacksQueuesContent = dynamic(() => import("./StacksQueuesContent"), {
  ssr: false,
});

const TITLE = "Stacks & Queues";
const DESCRIPTION =
  "Last in first out, first in first out. Interactive demos for push/pop, enqueue/dequeue, and Valid Parentheses.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/learn/stacks-queues`,
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default function StacksQueuesPage() {
  return <StacksQueuesContent />;
}
