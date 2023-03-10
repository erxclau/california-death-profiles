// JS for your graphic
import pym from "pym.js";
import { select, rollup, axisLeft } from "d3";
import { build, ColumnChart } from "@michigandaily/bore";
import { toBlob } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import counties from "../data/counties_total.csv";

import downloadImage from "./util/download-image";
import setDisplayOptions from "./util/set-display";

const draw = async () => {
  const data = rollup(
    counties,
    (v) => v[0].count,
    (d) => d.county,
    (d) => d.year
  );

  const figure = select("figure");
  const width = figure.node().clientWidth;

  const svg = figure.append("svg");

  const yAxis = function (scale) {
    return (g) => {
      const selection = this.getSelectionWithRedrawContext(g);
      selection.call(axisLeft(scale).ticks(6, ",.0f"));

      const { left, right } = this.margin();
      const w = this.getResponsiveWidth();
      selection.selectAll(".tick line").attr("x2", w - left - right);
    };
  };

  const chart = new ColumnChart()
    .label(null)
    .margin({ left: 50 })
    .yAxis(yAxis)
    .color("#6082B6")
    .duration(5);

  let redraw = false;
  let i = 0;

  const zip = new JSZip();

  for await (const [key, value] of data) {
    select(".figure__title").text(`Number of deaths by year in ${key}`);

    svg.datum(value).call(build(chart.redraw(redraw)));
    redraw = true;

    await new Promise((resolve) => setTimeout(resolve, 10));

    const blob = await toBlob(document.body, {
      backgroundColor: "white",
      width,
    });

    zip.file(`${key}.png`, blob);
    console.log(i++);
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
