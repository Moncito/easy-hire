import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Single, module-level registration point for GSAP + ScrollTrigger.
// Every landing section should import gsap/ScrollTrigger from HERE instead
// of registering the plugin itself. Module singletons in JS only ever
// evaluate once per bundle, so this guarantees registerPlugin() runs
// exactly once for the whole app, no matter how many components import it.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);

  // Batches refreshes to layout-changing events instead of every
  // ScrollTrigger.create() call recalculating on its own.
  ScrollTrigger.config({ autoRefreshEvents: "DOMContentLoaded,load,resize" });
}

export { gsap, ScrollTrigger };
