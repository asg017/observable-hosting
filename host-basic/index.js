import {
  Runtime,
  Inspector
} from "https://cdn.jsdelivr.net/npm/@observablehq/runtime@4.6/dist/runtime.js";

const params = new URLSearchParams(window.location.search);
if (params.has("notebook")) {
  const notebook = params.get("notebook");
  const targets = params.has("targets") ? params.get("targets").split(",") : [];
  let observer;

  if (targets.length > 0) {
    const targetSet = new Set(targets);
    observer = name => {
      if (!targetSet.has(name)) return null;
      const node = document.createElement("div");
      node.setAttribute("id", `notebook-${name}`);
      const i = new Inspector(document.body.appendChild(node));
      return {
        pending() {
          targetStatus.set(name, "pending");
          i.pending();
        },
        fulfilled(value) {
          targetStatus.set(name, "fulfilled");
          i.fulfilled(value);
        },
        rejected(error) {
          targetStatus.set(name, "rejected");
          i.rejected(error);
        }
      };
    };
  } else {
    observer = Inspector.into(document.body);
  }

  import(`https://api.observablehq.com/${notebook}.js?v=3`).then(
    async ({ default: define }) => {
      window.rt = new Runtime();
      const o = observer;
      const m = window.rt.module(define, o);
      window.redefine = redefine => {
        for (let cell in redefine) {
          m.redefine(cell, redefine[cell]);
        }
      };
    }
  );
}
