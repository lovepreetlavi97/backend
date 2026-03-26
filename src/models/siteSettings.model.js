const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false },
);

const siteSettingsSchema = new mongoose.Schema(
  {
    // singleton document key
    key: { type: String, default: "main", unique: true },

    brand: {
      name: { type: String, trim: true, default: "Guru Jewellers" },
      tagline: { type: String, trim: true, default: "" },
      logoUrl: { type: String, trim: true, default: "" },
    },

    contact: {
      email: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      whatsapp: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
      googleMapUrl: { type: String, trim: true, default: "" },
      businessHours: { type: String, trim: true, default: "" },
    },

    social: {
      instagramAccounts: [
        {
          handle: { type: String, default: "@guru.jewellers" },
          url: { type: String, default: "https://www.instagram.com/gurujewellers/" },
        },
      ],
      instagramHashtag: { type: String, trim: true, default: "#GURUJEWELLERS" },
      facebook: { type: String, trim: true, default: "" },
      youtube: { type: String, trim: true, default: "" },
      twitter: { type: String, trim: true, default: "" },
    },

    links: {
      instagramPageLinks: { type: [linkSchema], default: [] },
      footerLinks: { type: [linkSchema], default: [] },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);

