import Stats from "three/examples/jsm/libs/stats.module.js";

export function useStats() {
  let stats;

  if (typeof document !== "undefined") {
    stats = Stats();
    document.body.appendChild(stats.dom);
  }

  return {
    stats,
  };
}
