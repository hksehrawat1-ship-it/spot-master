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
};

export const discountPct = (c: Course) =>
  Math.round(((c.originalPrice - c.price) / c.originalPrice) * 100);

export const formatINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN");

const sampleVideo = "https://www.w3schools.com/html/mov_bbb.mp4";

export const courses: Course[] = [
  {
    id: "c1",
    slug: "laundry-fundamentals",
    title: "Laundry Operations Fundamentals",
    tagline: "Master the basics of commercial laundry",
    description:
      "From fabric science to wash chemistry — build a rock-solid foundation in commercial laundry operations.",
    level: "Beginner",
    hours: 6,
    students: 1284,
    rating: 4.8,
    cover: "from-primary to-primary-glow",
    modules: [
      {
        id: "m1",
        title: "Introduction to Commercial Laundry",
        lessons: [
          { id: "l1", title: "Welcome & course overview", duration: "04:12", videoUrl: sampleVideo, resources: [{ name: "Course syllabus.pdf", type: "pdf", url: "#" }] },
          { id: "l2", title: "The laundry industry today", duration: "09:30", videoUrl: sampleVideo, resources: [] },
        ],
      },
      {
        id: "m2",
        title: "Fabrics & Fibres",
        lessons: [
          { id: "l3", title: "Natural vs synthetic fibres", duration: "11:08", videoUrl: sampleVideo, resources: [{ name: "Fibre chart.png", type: "png", url: "#" }] },
          { id: "l4", title: "Fabric care symbols", duration: "07:45", videoUrl: sampleVideo, resources: [{ name: "Care symbols.pdf", type: "pdf", url: "#" }] },
        ],
      },
      {
        id: "m3",
        title: "Wash Chemistry",
        lessons: [
          { id: "l5", title: "Detergents & builders", duration: "13:20", videoUrl: sampleVideo, resources: [{ name: "Chemicals.xlsx", type: "xlsx", url: "#" }] },
          { id: "l6", title: "pH, water hardness & dosing", duration: "10:55", videoUrl: sampleVideo, resources: [] },
        ],
      },
    ],
  },
  {
    id: "c2",
    slug: "hotel-linen-management",
    title: "Hotel Linen Management",
    tagline: "Run a flawless hotel laundry",
    description:
      "Linen par levels, RFID tracking, guest experience standards and quality control for 5-star properties.",
    level: "Intermediate",
    hours: 8,
    students: 642,
    rating: 4.9,
    cover: "from-[hsl(214_71%_28%)] to-accent",
    modules: [
      { id: "m1", title: "Linen Lifecycle", lessons: [
        { id: "l1", title: "Procurement to retirement", duration: "12:00", videoUrl: sampleVideo, resources: [] },
        { id: "l2", title: "Par level calculations", duration: "09:14", videoUrl: sampleVideo, resources: [{ name: "Par calculator.xlsx", type: "xlsx", url: "#" }] },
      ]},
      { id: "m2", title: "Quality & Standards", lessons: [
        { id: "l3", title: "Inspection workflows", duration: "08:40", videoUrl: sampleVideo, resources: [] },
      ]},
    ],
  },
  {
    id: "c3",
    slug: "stain-removal-masterclass",
    title: "Stain Removal Masterclass",
    tagline: "Tackle every stain with confidence",
    description:
      "Identify, treat and remove 40+ stain types using safe, repeatable processes used by industry pros.",
    level: "Advanced",
    hours: 5,
    students: 921,
    rating: 4.7,
    cover: "from-accent to-primary",
    modules: [
      { id: "m1", title: "Stain Science", lessons: [
        { id: "l1", title: "Stain categories", duration: "07:25", videoUrl: sampleVideo, resources: [{ name: "Stain guide.pdf", type: "pdf", url: "#" }] },
      ]},
      { id: "m2", title: "Treatment Protocols", lessons: [
        { id: "l2", title: "Protein stains", duration: "11:30", videoUrl: sampleVideo, resources: [] },
        { id: "l3", title: "Tannin & oil stains", duration: "10:15", videoUrl: sampleVideo, resources: [] },
      ]},
    ],
  },
  {
    id: "c4",
    slug: "dry-cleaning-essentials",
    title: "Dry Cleaning Essentials",
    tagline: "Solvent care, machines, and finishing",
    description:
      "A complete guide to perc & hydrocarbon systems, machine cycles, finishing and customer-facing best practices.",
    level: "Intermediate",
    hours: 7,
    students: 487,
    rating: 4.6,
    cover: "from-primary-glow to-accent",
    modules: [
      { id: "m1", title: "Solvents & Machines", lessons: [
        { id: "l1", title: "Solvent overview", duration: "09:40", videoUrl: sampleVideo, resources: [] },
      ]},
    ],
  },
];

export const getCourse = (slug: string) => courses.find((c) => c.slug === slug);

export const allLessons = (course: Course) =>
  course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title })));
