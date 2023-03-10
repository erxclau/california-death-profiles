// // JS for your graphic
import pym from "pym.js";
import { rollup, descending, select, format } from "d3";
import { build, BarChart } from "@michigandaily/bore";
import { toBlob } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import localities from "../data/localities_causes.csv";

import downloadImage from "./util/download-image";
import setDisplayOptions from "./util/set-display";

const draw = async () => {
  const data = rollup(
    localities,
    (v) =>
      new Map(
        v
          .map((o) => [o.category, o.count])
          .filter(([_, count]) => count > 0)
          .sort((a, b) => descending(a[1], b[1]))
      ),
    (d) => d.id
  );

  const dictionary = rollup(
    localities,
    (v) => v[0].name,
    (d) => d.id
  );

  const figure = select("figure");
  const width = figure.node().clientWidth;
  const svg = figure.append("svg");

  const chart = new BarChart()
    .color("#8dd3c7")
    .margin({ left: 100, right: 100 })
    .wrappx(150)
    .label((d, i) => `${format(",")(d[1])} ${i === 0 ? "deaths" : ""}`);

  const zip = new JSZip();
  for await (const [key, value] of data) {
    select(".figure__title").text(
      `Deaths by cause in ${dictionary.get(key)} during 2021`
    );

    svg.html("");
    svg
      .datum(value)
      .call(build(chart.height(value.size < 3 ? 100 : value.size * 35)));

    await new Promise((resolve) => setTimeout(resolve, 350));

    const blob = await toBlob(document.body, {
      backgroundColor: "white",
      width,
    });

    zip.file(`cause-locality-${key}.png`, blob);
  }

  zip.generateAsync({ type: "blob" }).then((content) => {
    saveAs(content, `cookie-graphic-${new Date().toISOString()}.zip`);
  });
};

window.onload = () => {
  const child = new pym.Child({ polling: 200 });
  child.sendHeight();
  child.onMessage("download", downloadImage);
  setDisplayOptions();
  draw();
};
