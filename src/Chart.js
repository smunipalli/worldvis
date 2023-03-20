import { useState, useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import CSVdata from "./5_OneCatSevNumOrdered.csv";

const Chart = () => {
  const d3ref = useRef(null);

  const margin = { top: 10, right: 30, bottom: 30, left: 60 };
  const width = 460 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  //   const [data, setData] = useState(null);

  useEffect(() => {
    const getD3Ref = d3.select(d3ref.current);

    getD3Ref.selectAll("*").remove();

    const svg = getD3Ref
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //Read the data
    d3.csv(CSVdata)
      //   "https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/5_OneCatSevNumOrdered.csv",
      .then((data) => {
        // console.log(data);

        const sumstat = d3.group(data, (d) => d.name); // nest function allows to group the calculation per level of a factor
        // Add X axis --> it is a date format
        const x = d3
          .scaleLinear()
          .domain(
            d3.extent(data, function (d) {
              return d.year;
            })
          )
          .range([0, width]);
        svg
          .append("g")
          .attr("transform", `translate(0, ${height})`)
          .call(d3.axisBottom(x).ticks(5));
        // Add Y axis
        const y = d3
          .scaleLinear()
          .domain([
            0,
            d3.max(data, function (d) {
              return +d.n;
            }),
          ])
          .range([height, 0]);
        svg.append("g").call(d3.axisLeft(y));
        // color palette
        const color = d3
          .scaleOrdinal()
          .range([
            "#e41a1c",
            "#377eb8",
            "#4daf4a",
            "#984ea3",
            "#ff7f00",
            "#ffff33",
            "#a65628",
            "#f781bf",
            "#999999",
          ]);
        // Draw the line
        svg
          .selectAll(".line")
          .data(sumstat)
          .join("path")
          .attr("fill", "none")
          .attr("stroke", function (d) {
            return color(d[0]);
          })
          .attr("stroke-width", 1.5)
          .attr("d", function (d) {
            return d3
              .line()
              .x(function (d) {
                return x(d.year);
              })
              .y(function (d) {
                return y(+d.n);
              })(d[1]);
          });
      });
    // getD3Ref.style("background-color", "red");
  }, [CSVdata]);

  return (
    <>
      <div ref={d3ref}></div>
    </>
  );
};

export default Chart;
