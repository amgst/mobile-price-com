import { InsertBrand, InsertMobile } from "../../shared/schema.js";
import { MobileAPIDevice } from "./mobileapi-service.js";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const parsePrice = (device: MobileAPIDevice): string => {
  const priceFields = [
    device.price?.usd,
    device.prices?.USD,
    device.prices?.usd,
    device.price?.pkr,
    device.prices?.PKR,
    device.prices?.pkr,
  ];

  for (const entry of priceFields) {
    if (entry === undefined || entry === null) continue;
    if (typeof entry === "number") {
      return `USD $${entry.toFixed(2)}`;
    }
    const numeric = Number(String(entry).replace(/[^0-9.]/g, ""));
    if (!Number.isNaN(numeric) && numeric > 0) {
      return `USD $${numeric.toFixed(2)}`;
    }
    if (typeof entry === "string" && entry.trim()) {
      return entry.trim();
    }
  }

  return "Price not available";
};

const selectImages = (device: MobileAPIDevice): string[] => {
  const candidates = [
    ...(Array.isArray(device.images) ? device.images : []),
    ...(Array.isArray(device.image_urls) ? device.image_urls : []),
  ].filter((url): url is string => typeof url === "string" && url.startsWith("http"));

  if (candidates.length > 0) {
    return candidates.slice(0, 6);
  }

  const fallback = slugify(device.name ?? "mobile");
  return [
    `https://dummyimage.com/600x600/0d6efd/ffffff&text=${encodeURIComponent(fallback.toUpperCase())}`,
  ];
};

const parseReleaseDate = (device: MobileAPIDevice): string => {
  const raw = device.release_date ?? device.announcement_date ?? "";
  const dateMatch = raw.match(/\d{4}[-/]\d{2}[-/]\d{2}/);
  if (dateMatch) {
    return dateMatch[0].replace(/\//g, "-");
  }

  const yearMatch = raw.match(/\d{4}/);
  if (yearMatch) {
    return `${yearMatch[0]}-01-01`;
  }

  return new Date().toISOString().split("T")[0];
};

const extractRam = (device: MobileAPIDevice): string => {
  const sources = [device.hardware, device.ram, device.memory];
  for (const source of sources) {
    if (!source) continue;
    const match = String(source).match(/(\d+\s?GB)\s?(RAM)?/i);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  return "Unknown";
};

const extractStorage = (device: MobileAPIDevice): string => {
  if (Array.isArray(device.storage_options) && device.storage_options.length > 0) {
    return device.storage_options.join(", ");
  }

  const sources = [device.storage, device.hardware];
  for (const source of sources) {
    if (!source) continue;
    const matches = String(source).match(/(\d+\s?GB|\d+\s?TB)/gi);
    if (matches && matches.length > 0) {
      return matches.map((value) => value.toUpperCase()).join(", ");
    }
  }
  return "Unknown";
};

const buildSpecifications = (device: MobileAPIDevice) => {
  const specs = [];

  const displaySpecs = [
    device.display ? { feature: "Display", value: device.display } : null,
    device.screen_size ? { feature: "Screen Size", value: device.screen_size } : null,
    device.screen_resolution ? { feature: "Resolution", value: device.screen_resolution } : null,
  ].filter(Boolean);

  if (displaySpecs.length > 0) {
    specs.push({
      category: "Display",
      specs: displaySpecs,
    });
  }

  const performanceSpecs = [
    device.hardware ? { feature: "Hardware", value: device.hardware } : null,
    device.processor ? { feature: "Processor", value: device.processor } : null,
    device.chipset ? { feature: "Chipset", value: device.chipset } : null,
    device.platform ? { feature: "Platform", value: device.platform } : null,
    device.os ? { feature: "Operating System", value: device.os } : null,
  ].filter(Boolean);

  if (performanceSpecs.length > 0) {
    specs.push({
      category: "Performance",
      specs: performanceSpecs,
    });
  }

  const cameraSpecs = [
    device.camera ? { feature: "Primary Camera", value: device.camera } : null,
    device.rear_camera ? { feature: "Rear Camera", value: device.rear_camera } : null,
    device.front_camera ? { feature: "Front Camera", value: device.front_camera } : null,
  ].filter(Boolean);

  if (cameraSpecs.length > 0) {
    specs.push({
      category: "Camera",
      specs: cameraSpecs,
    });
  }

  const batterySpecs = [
    device.battery_capacity ? { feature: "Battery Capacity", value: device.battery_capacity } : null,
    device.battery ? { feature: "Battery Type", value: device.battery } : null,
    device.charging ? { feature: "Charging", value: device.charging } : null,
  ].filter(Boolean);

  if (batterySpecs.length > 0) {
    specs.push({
      category: "Battery",
      specs: batterySpecs,
    });
  }

  const bodySpecs = [
    device.dimensions ? { feature: "Dimensions", value: device.dimensions } : null,
    device.weight ? { feature: "Weight", value: device.weight } : null,
    device.thickness ? { feature: "Thickness", value: device.thickness } : null,
    device.colors ? { feature: "Available Colors", value: device.colors } : null,
  ].filter(Boolean);

  if (bodySpecs.length > 0) {
    specs.push({
      category: "Body",
      specs: bodySpecs,
    });
  }

  if (device.description) {
    specs.push({
      category: "Highlights",
      specs: [{ feature: "Overview", value: device.description }],
    });
  }

  return specs;
};

export const MobileAPITransformer = {
  transformBrand(device: MobileAPIDevice): InsertBrand {
    const brandName = device.brand_name?.trim() ?? "Unknown";

    return {
      name: brandName,
      slug: slugify(brandName),
      logo: brandName.charAt(0).toUpperCase(),
      description: `${brandName} smartphone manufacturer`,
      phoneCount: "0",
      isVisible: true,
    };
  },

  transformDevice(device: MobileAPIDevice): InsertMobile {
    const brandSlug = slugify(device.brand_name ?? "unknown");
    const name = device.name?.trim() ?? "Unknown Device";
    const slug = slugify(device.slug ?? name);
    const images = selectImages(device);

    const processor =
      device.processor ??
      device.chipset ??
      device.hardware?.match(/(A\d+\s?Pro?|Snapdragon\s?[0-9A-Za-z+\s]+|Dimensity\s?[0-9A-Za-z+\s]+)/i)?.[0]?.trim() ??
      "Unknown";

    const shortSpecs = {
      ram: extractRam(device),
      storage: extractStorage(device),
      camera: device.camera ?? device.rear_camera ?? "Unknown",
      battery: device.battery_capacity ?? device.battery ?? undefined,
      display: device.display ?? device.screen_size ?? undefined,
      processor,
    };

    return {
      slug,
      name,
      brand: brandSlug,
      model: device.model_name ?? name,
      imageUrl: images[0],
      imagekitPath: `/mobiles/${brandSlug}/${slug}.jpg`,
      releaseDate: parseReleaseDate(device),
      price: parsePrice(device),
      shortSpecs,
      carouselImages: images,
      specifications: buildSpecifications(device),
      dimensions: device.dimensions
        ? {
            height: device.dimensions,
            width: "",
            thickness: device.thickness ?? "",
            weight: device.weight ?? "",
          }
        : null,
      buildMaterials: null,
    };
  },
};


