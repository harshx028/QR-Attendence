import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.durgafoundation.markattendence",
  appName: "Mark Attendance",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
