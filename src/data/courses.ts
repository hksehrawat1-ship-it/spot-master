export type Lesson = {
  id: string;
  title: string;
  duration: string; // e.g. "08:24"
  videoUrl: string;
  resources: { name: string; type: "pdf" | "xlsx" | "png" | "doc"; url: string }[];
};

export type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  hours: number;
  students: number;
  rating: number;
  cover: string; // gradient class
  price: number; // current price in INR
  originalPrice: number; // MRP in INR
  modules: Module[];
  // Optional marketing/feature flags
  badge?: string; // e.g. "Practical", "Bundle", "Best Value"
  highlight?: string; // small promo line under tagline
  registerNote?: string; // e.g. "Register for ₹500, pay rest at institute"
  bonus?: string; // e.g. "Stain Master lifetime free"
  isBundle?: boolean;
};

export const discountPct = (c: Course) =>
  Math.round(((c.originalPrice - c.price) / c.originalPrice) * 100);

export const formatINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN");

// Returns the next upcoming 24th of a month (today included if it is the 24th)
export const nextClassDate = (from: Date = new Date()) => {
  const d = new Date(from.getFullYear(), from.getMonth(), 24);
  if (from.getDate() > 24) d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const sampleVideo = "https://www.w3schools.com/html/mov_bbb.mp4";

export const courses: Course[] = [
  {
    id: "c1",
    slug: "start-laundry-store",
    title: "Complete Guide to Start Laundry Store",
    tagline: "Launch your own laundry store, step by step",
    description:
      "Everything you need to plan, set up and launch a profitable laundry store — location, machines, pricing, staffing, licences and your first 90 days of operations.",
    level: "Beginner",
    hours: 8,
    students: 1284,
    rating: 4.8,
    cover: "from-[hsl(214_85%_22%)] via-[hsl(214_75%_38%)] to-[hsl(190_85%_55%)]",
    price: 25500,
    originalPrice: 45000,
    modules: [
      {
        id: "m1",
        title: "Business Foundations",
        lessons: [
          { id: "l1", title: "Welcome & how to use this course", duration: "04:12", videoUrl: sampleVideo, resources: [{ name: "Course syllabus.pdf", type: "pdf", url: "#" }] },
          { id: "l2", title: "The Indian laundry opportunity", duration: "09:30", videoUrl: sampleVideo, resources: [] },
        ],
      },
      {
        id: "m2",
        title: "Setup & Equipment",
        lessons: [
          { id: "l3", title: "Choosing the right location", duration: "11:08", videoUrl: sampleVideo, resources: [{ name: "Location checklist.pdf", type: "pdf", url: "#" }] },
          { id: "l4", title: "Machines, layout & investment plan", duration: "12:45", videoUrl: sampleVideo, resources: [{ name: "Equipment costing.xlsx", type: "xlsx", url: "#" }] },
        ],
      },
      {
        id: "m3",
        title: "Launch & First Customers",
        lessons: [
          { id: "l5", title: "Pricing your services", duration: "10:20", videoUrl: sampleVideo, resources: [{ name: "Pricing sheet.xlsx", type: "xlsx", url: "#" }] },
          { id: "l6", title: "Hiring & training your first team", duration: "10:55", videoUrl: sampleVideo, resources: [] },
        ],
      },
    ],
  },
  {
    id: "c2",
    slug: "laundry-business-excellence",
    title: "Advanced – Laundry Business Excellence",
    tagline: "Scale, systemise and run a world-class laundry",
    description:
      "Built for owners ready to level up — SOPs, quality systems, hotel & B2B contracts, RFID, finance dashboards and team leadership for multi-store growth.",
    level: "Intermediate",
    hours: 12,
    students: 642,
    rating: 4.9,
    cover: "from-[hsl(280_70%_35%)] via-[hsl(330_75%_50%)] to-[hsl(25_95%_60%)]",
    price: 35500,
    originalPrice: 75000,
    modules: [
      { id: "m1", title: "Operations Excellence", lessons: [
        { id: "l1", title: "Building bullet-proof SOPs", duration: "12:00", videoUrl: sampleVideo, resources: [{ name: "SOP template.pdf", type: "pdf", url: "#" }] },
        { id: "l2", title: "Quality control systems", duration: "09:14", videoUrl: sampleVideo, resources: [{ name: "QC checklist.xlsx", type: "xlsx", url: "#" }] },
      ]},
      { id: "m2", title: "B2B & Hotel Contracts", lessons: [
        { id: "l3", title: "Winning hotel & hospital tenders", duration: "13:40", videoUrl: sampleVideo, resources: [] },
        { id: "l4", title: "Pricing B2B contracts profitably", duration: "11:10", videoUrl: sampleVideo, resources: [] },
      ]},
      { id: "m3", title: "Finance & Scale", lessons: [
        { id: "l5", title: "Reading your P&L like a pro", duration: "10:25", videoUrl: sampleVideo, resources: [{ name: "P&L template.xlsx", type: "xlsx", url: "#" }] },
        { id: "l6", title: "Opening your second store", duration: "12:15", videoUrl: sampleVideo, resources: [] },
      ]},
    ],
  },
  {
    id: "c3",
    slug: "marketing-profit-accelerator",
    title: "Laundry Marketing & Profit Growth Accelerator",
    tagline: "Get more customers and grow profits — fast",
    description:
      "A practical marketing playbook for laundry owners — local SEO, Google & Meta ads, WhatsApp marketing, retention loops and proven offers that boost monthly profit.",
    level: "Advanced",
    hours: 10,
    students: 921,
    rating: 4.9,
    cover: "from-[hsl(160_75%_30%)] via-[hsl(180_70%_40%)] to-[hsl(45_95%_58%)]",
    price: 45500,
    originalPrice: 99000,
    modules: [
      { id: "m1", title: "Brand & Local Presence", lessons: [
        { id: "l1", title: "Positioning your laundry brand", duration: "08:25", videoUrl: sampleVideo, resources: [{ name: "Brand workbook.pdf", type: "pdf", url: "#" }] },
        { id: "l2", title: "Google Business Profile that ranks", duration: "11:30", videoUrl: sampleVideo, resources: [] },
      ]},
      { id: "m2", title: "Paid Ads & Lead Gen", lessons: [
        { id: "l3", title: "Meta ads for laundry stores", duration: "14:10", videoUrl: sampleVideo, resources: [{ name: "Ad creatives.png", type: "png", url: "#" }] },
        { id: "l4", title: "Google Search & Maps ads", duration: "12:15", videoUrl: sampleVideo, resources: [] },
      ]},
      { id: "m3", title: "Retention & Profit", lessons: [
        { id: "l5", title: "WhatsApp marketing & retention", duration: "10:40", videoUrl: sampleVideo, resources: [{ name: "WA templates.pdf", type: "pdf", url: "#" }] },
        { id: "l6", title: "Offers that boost monthly profit", duration: "11:20", videoUrl: sampleVideo, resources: [{ name: "Profit calculator.xlsx", type: "xlsx", url: "#" }] },
      ]},
    ],
  },
  {
    id: "c4",
    slug: "5-day-practical-training",
    title: "5-Day Practical Laundry Training",
    tagline: "Hands-on, in-person training at our institute",
    description:
      "An intensive 5-day on-site practical session — operate machines, master stain removal, finishing, packing and counter handling alongside our master trainers.",
    level: "Intermediate",
    hours: 40,
    students: 312,
    rating: 4.9,
    cover: "from-[hsl(15_85%_45%)] via-[hsl(25_90%_55%)] to-[hsl(45_95%_60%)]",
    price: 17500,
    originalPrice: 25000,
    badge: "Practical",
    highlight: "5 days of hands-on training at our institute",
    registerNote: "Register for ₹500 now — pay the remaining ₹17,000 at the institute",
    modules: [
      { id: "m1", title: "Day 1–2: Machines & Process", lessons: [
        { id: "l1", title: "Machine operation & safety", duration: "Day 1", videoUrl: sampleVideo, resources: [] },
        { id: "l2", title: "Sorting, washing & chemistry", duration: "Day 2", videoUrl: sampleVideo, resources: [] },
      ]},
      { id: "m2", title: "Day 3–4: Stains & Finishing", lessons: [
        { id: "l3", title: "Stain removal practical", duration: "Day 3", videoUrl: sampleVideo, resources: [] },
        { id: "l4", title: "Pressing, finishing & packing", duration: "Day 4", videoUrl: sampleVideo, resources: [] },
      ]},
      { id: "m3", title: "Day 5: Counter & Live Ops", lessons: [
        { id: "l5", title: "Customer handling & live store ops", duration: "Day 5", videoUrl: sampleVideo, resources: [] },
      ]},
    ],
  },
  {
    id: "c5",
    slug: "laundry-mastery-bundle",
    title: "Laundry Mastery Bundle",
    tagline: "All four courses included + Lifetime Free Access to Stain Master — worth ₹1,33,999, yours for ₹39,999",
    description:
      "The complete package: all 4 flagship laundry courses + Lifetime Free Access to Stain Master. Total value ₹1,33,999 — yours for just ₹39,999.",
    level: "Advanced",
    hours: 70,
    students: 487,
    rating: 5.0,
    cover: "from-[hsl(217_89%_30%)] via-[hsl(280_70%_45%)] to-[hsl(330_80%_55%)]",
    price: 39999,
    originalPrice: 133999,
    badge: "Best Value",
    isBundle: true,
    highlight: "All 4 courses + Lifetime Free Access to Stain Master — worth ₹1,33,999, yours for ₹39,999",
    modules: [
      { id: "m1", title: "Everything Included", lessons: [
        { id: "l1", title: "Complete Guide to Start Laundry Store", duration: "8h", videoUrl: sampleVideo, resources: [] },
        { id: "l2", title: "Advanced – Laundry Business Excellence", duration: "12h", videoUrl: sampleVideo, resources: [] },
        { id: "l3", title: "Marketing & Profit Growth Accelerator", duration: "10h", videoUrl: sampleVideo, resources: [] },
        { id: "l4", title: "5-Day Practical Training (in-person)", duration: "5 days", videoUrl: sampleVideo, resources: [] },
        { id: "l5", title: "Stain Master — Lifetime Access", duration: "∞", videoUrl: sampleVideo, resources: [] },
      ]},
    ],
  },
];

export const getCourse = (slug: string) => courses.find((c) => c.slug === slug);

export const allLessons = (course: Course) =>
  course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title })));
