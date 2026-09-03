import { generateId } from "./id";
import type { Quote } from "./types";

export function buildSampleQuote(): Quote {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    quoteNumber: "Q_0713001",
    date: "2026-07-13",
    status: "Draft",
    client: {
      name: "Sir Bodjie Lorenzo",
      office: "MDRRMO Rizal",
      address: "Municipal Government of Rizal, Palawan",
    },
    vatPct: 0.12,
    items: [
      {
        id: generateId(),
        title: "ADVANCE DRONE WITH PERIPHERALS",
        specs: [
          "Thermal Imager: at least Uncooled VOx Microbolometer",
          "Thermal Camera: at least 640x512 at 30FPS",
          "Zoom Camera: at least 28MP 1/2\" CMOS Sensor",
          "Optical Zoom: at least 112x Max Hybrid Zoom",
          "Wide Angle: at least 1/1.3-inch CMOS, Effective Pixels: 48MP",
          "Laser Rangefinder: at least 3m to 1800m Range",
          "Photo Resolution: at least 8K",
          "Video Resolution: at least 1024 x 1024@30fps",
          "Other conditions:",
          "Operation Frequency: at least 2.4GHz & 5.725-5.850GHz",
          "Flight Time: at least 49 Minutes",
          "Wind Resistance: at least 12 m/s",
          "Service Ceiling: at least 6000m",
          "Max Speed: at least 21m/s",
          "at least Dual Vision and ToF Sensors",
          "Battery Type & Capacity: at least Li-ion & 6741 mAh",
          "Battery Voltage & Energy: at least 17v & 99.59Wh",
          "Battery Charging Time: not more than 2 hrs for internal battery or external battery.",
          "Auxiliary Lights Type: at least Dual NIR (Near-Infrared) Auxiliary Illumination System",
          "Remote Controller Screen: at least 7 inch LCD touchscreen, with a resolution of 1920x1200 pixels, and high brightness of 1200 cd",
          "Max Transmission Distance: at least 15km",
        ],
        inclusions: [
          "1x RC Pro Controller",
          "1x Hard Carrying Case",
          "3x Intelligent Batteries",
          "1x Speaker & Spotlight Combo",
          "Training Conducted by CAAP Certified Drone Instructor (2 Pax)",
        ],
        warranty: "at least 1 Year Warranty",
        qty: 1,
        unit: "unit",
        unitPrice: 978000,
        priceManuallySet: true,
        supplierCost: 118000,
        markupPct: 1.3,
      },
      {
        id: generateId(),
        title: "FIELD MONITOR",
        specs: [
          "Display: at least 21.5-inch IPS Panel",
          "Resolution: at least 1920x1080",
          "Input & Output: at least 3G-SDI and HDMI",
          "Providing a stable and lag-free video feed from your drone's camera",
          "Lightweight and Compact",
          "Case: Integrated Protective Carry-on Case",
        ],
        inclusions: [
          "2x V-Mount Battery Plates",
          "1x DC 12V Cable Connector",
          "1x XLR Connector",
        ],
        warranty: "at least 1 Year Warranty",
        qty: 1,
        unit: "unit",
        unitPrice: 150000,
        priceManuallySet: true,
        supplierCost: 33000,
        markupPct: 0.3,
      },
    ],
    terms: {
      delivery: "Within 4-6 weeks upon receipt of PO",
      payment:
        "Thirty (30) days upon receipt of the invoice and upon complete/full submission",
      warranty: "1-yr Product Warranty and 1 month Service Warranty",
      pricesNote: "Prices are inclusive of applicable taxes unless otherwise stated.",
    },
    preparedBy: {
      name: "Engr. Lowell Amora",
      title: "Technical Engineer",
    },
    createdAt: now,
    updatedAt: now,
  };
}
