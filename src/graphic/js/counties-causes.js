// JS for your graphic
import pym from "pym.js";
import { rollup, format, select, descending } from "d3";
import { build, BarChart } from "@michigandaily/bore";
import { toBlob } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import counties from "../data/counties_causes.csv";

import downloadImage from "./util/download-image";
import setDisplayOptions from "./util/set-display";

const draw = async () => {
  const data = rollup(
    counties,
    (v) =>
      new Map(
        v
          .map((o) => [o.cause, o.count])
          .filter(([_, count]) => count > 0)
          .sort((a, b) => descending(a[1], b[1]))
      ),
    (d) => d.county,
    (d) => d.year
  );

  const figure = select("figure");
  const width = figure.node().clientWidth;

  const svg = figure.append("svg");
  const chart = new BarChart()
    .color("#8dd3c7")
    .margin({ left: 100, right: 100 })
    .wrappx(150)
    .duration(2000)
    .label((d, i) => `${format(",")(d[1])} ${i === 0 ? "deaths" : ""}`);

  const zip = new JSZip();
  for await (const [key, value] of data) {
    select(".figure__title").text(
      `Deaths by cause in ${key} County during 2021`
    );

    const datum = value.get(2021);

    svg.html("");
    svg.datum(datum).call(build(chart.height(datum.size * 35)));

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const blob = await toBlob(document.body, {
      backgroundColor: "white",
      width,
    });

    zip.file(
      `cause-county-${key.toLowerCase().split(" ").join("-")}.png`,
      blob
    );
  }

  zip.generateAsync({ type: "blob" }).then((content) => {
    saveAs(content, `cookie-graphic-${new Date().toISOString()}.zip`);
  });
};

window.onresize = () => {};

window.onload = () => {
  const child = new pym.Child({ polling: 500 });
  child.sendHeight();
  child.onMessage("download", downloadImage);
  setDisplayOptions();
  draw();
};
