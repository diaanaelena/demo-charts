import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { width, margin, height, createRhombusPath } from "./utils";
const Plot = ({ scatteredData, lineData }) => {
  const svgRef = useRef();
  const tooltipRef1 = useRef();
  const tooltipRef2 = useRef();

  const [processedScatteredData, setProcessedScatteredData] = useState([]);
  const [processedLineData, setProcessedLineData] = useState([]);

  useEffect(() => {
    setProcessedScatteredData(processData(scatteredData));
    setProcessedLineData(processData(lineData));
  }, [scatteredData, lineData]);

  const processData = (data) => {
    return data.map((d) => ({
      ...d,
      date: d3.timeParse("%d/%m/%Y")(d.date),
    }));
  };

  const compositeData = processedLineData.filter(
    (d) => d.composite_price !== null && d.date !== null
  );
  const derivedData = processedLineData.filter(
    (d) => d.derived_price !== null && d.date !== null
  );
  const svg = d3
    .select(svgRef.current)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  useEffect(() => {
    // Parse date strings to Date objects
    const combinedData = [...compositeData, ...derivedData];

    // Calculate the extent of the date domain from both datasets
    const originalExtent = d3.extent(combinedData.map((d) => d.date));

    // Subtract 6 months from the earliest date
    const sixMonthsBefore = new Date(originalExtent[0]);
    sixMonthsBefore.setMonth(sixMonthsBefore.getMonth() - 6);

    // Set the xDomain
    const xDomain = [sixMonthsBefore, originalExtent[1]];

    // Calculate the maximum values for Y domains based on both datasets
    const yMaxComposite = d3.max(
      compositeData.filter((d) => d.composite_price !== null),
      (d) => d.composite_price
    );

    const yMaxDerived = d3.max(
      derivedData.filter((d) => d.derived_price !== null),
      (d) => d.derived_price
    );

    // Define the X and Y scales using the combined domains
    const xScale = d3.scaleTime().domain(xDomain).range([0, width]);
    const yScale = d3
      .scaleLinear()
      .domain([0, Math.max(yMaxComposite, yMaxDerived, 150)])
      .range([height, 0]);

    const compositeLine = d3
      .line()
      .x((d) => xScale(d.date))
      .y((d) => {
        if (d.composite_price !== null && d.date) {
          return yScale(d.composite_price);
        } else {
          return yScale(0);
        }
      });

    const derivedLine = d3
      .line()
      .x((d) => xScale(d.date))
      .y((d) => {
        if (d.derived_price !== null && d.date) {
          return yScale(d.derived_price);
        } else {
          return yScale(0);
        }
      });
    const colorScale = d3
      .scaleOrdinal()
      .domain(processedScatteredData.map((d) => d.equity_type))
      .range(["#66c2a5", "#fc8d62"]);

    svg
      .selectAll("path")
      .data(processedScatteredData)
      .enter()
      .append("path")
      .attr("d", (d) =>
        createRhombusPath(xScale(d.date), yScale(d.fund_price), 10, 10)
      )
      .attr("fill", (d) => colorScale(d.equity_type))
      .attr("stroke", (d) => d3.rgb(colorScale(d.equity_type)).darker(2)) 
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round") 
      .style("cursor", "pointer") // Change cursor on hover

      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

    const segmentData = (data) => {
      const segments = [];
      let segment = [];

      for (let i = 0; i < data.length; i++) {
        if (
          i > 0 &&
          data[i].date - data[i - 1].date > 3 * 30 * 24 * 60 * 60 * 1000
        ) {
          // 3 months in milliseconds
          if (segment.length > 0) {
            segments.push(segment);
            segment = [];
          }
        }
        segment.push(data[i]);
      }

      if (segment.length > 0) {
        segments.push(segment);
      }

      return segments;
    };
    const segmentedCompositeData = segmentData(compositeData);
    const lineStyle = {
      strokeWidth: 4,
      strokeLinejoin: "round",
      strokeLinecap: "round",
    };

    segmentedCompositeData.forEach((segment) => {
      svg
        .append("path")
        .datum(segment)
        .attr("fill", "none")
        .attr("stroke", "#8da0cb") // Set the color for the composite line
        .attr("stroke-width", lineStyle.strokeWidth)
        .attr("stroke-linejoin", lineStyle.strokeLinejoin)
        .attr("stroke-linecap", lineStyle.strokeLinecap)
        .attr("d", compositeLine)
        .on("mouseover", handleMouseOverLine)
        .on("mouseout", handleMouseOutLine);
    });

    svg
      .append("path")
      .datum(derivedData)
      .attr("fill", "none")
      .attr("stroke", "#e78ac3") // Set the color for the derived line
      .attr("stroke-width", 2)
      .attr("d", derivedLine)
      .on("mouseover", handleMouseOverLine)
      .on("mouseout", handleMouseOutLine);

    svg
      .append("g")
      .call(
        d3
          .axisBottom(xScale)
          .ticks(d3.timeMonth.every(5))
          .tickFormat(d3.timeFormat("%b-%Y"))
      )
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height})`);

    svg.append("g").call(d3.axisLeft(yScale));
    // X-axis styling
    svg
      .select(".x-axis")
      .style("color", "#888")
      .selectAll("text")
      .style("font-size", "10px");

    // Y-axis styling
    svg
      .select(".y-axis")
      .style("color", "#888")
      .selectAll("text")
      .style("font-size", "10px");

    // Determine the x-coordinate of the first data point.
    const firstDataPoint = d3.min(combinedData, (d) => d.date);
    const xCoordOfFirstDataPoint = xScale(firstDataPoint);

    // Draw a vertical line from the top to the bottom of the chart at that x-coordinate
    svg
      .append("line")
      .attr("x1", xCoordOfFirstDataPoint)
      .attr("y1", 0) 
      .attr("x2", xCoordOfFirstDataPoint)
      .attr("y2", height) 
      .attr("stroke", "black") 
      .attr("stroke-dasharray", "5,5");

    // Add a text label to display the date, just above the x-axis.
    const dateFormatter = d3.timeFormat("%d/%m/%Y"); 
    svg
      .append("text")
      .attr("x", xCoordOfFirstDataPoint)
      .attr("y", 0)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .text(dateFormatter(firstDataPoint));

    function handleMouseOver(event, d) {
      const tooltip1 = d3.select(tooltipRef1.current);

      tooltip1.transition().duration(200).style("opacity", 0.9);
      tooltip1
        .html(
          `Date: ${d.date ? d.date : "undefined"}<br/>Price: ${
            d.fund_price
          }<br/>Type: ${d.equity_type}`
        )
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    }

    function handleMouseOut() {
      const tooltip1 = d3.select(tooltipRef1.current);
      tooltip1.transition().duration(500).style("opacity", 0);
    }

    function handleMouseOverLine(event, d) {
      // Get the x-coordinate of the mouse pointer relative to the SVG
      const mouseX = xScale.invert(
        event.clientX - svgRef.current.getBoundingClientRect().left
      );

      // D3's bisect to find the nearest data point
      const bisectDate = d3.bisector((d) => d.date).left;
      const index = bisectDate(d, mouseX, 1);
      const dataPoint = d[index - 1]; // Use the left data point as a fallback

      // Ensure we have a valid data point before proceeding
      if (!dataPoint) return;

      const tooltip2 = d3.select(tooltipRef2.current);

      tooltip2.transition().duration(200).style("opacity", 0.9);
      tooltip2
        .html(
          `Date: ${
            dataPoint.date ? dataPoint.date : "undefined"
          }<br/>Composite_price: ${
            dataPoint.composite_price
          }<br/>derived_price: ${dataPoint.derived_price}`
        )
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    }

    function handleMouseOutLine() {
      const tooltip2 = d3.select(tooltipRef2.current);
      tooltip2.transition().duration(500).style("opacity", 0);
    }
  }, [processedScatteredData, processedLineData,compositeData, derivedData, svg]);

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef}></svg>
      <Tooltip ref={tooltipRef1} className="tooltip1" />
      <Tooltip ref={tooltipRef2} className="tooltip2" />
    </div>
  );
};
const Tooltip = React.forwardRef(({ className }, ref) => (
  <div
    ref={ref}
    className={className}
    style={{
      position: "absolute",
      opacity: 0,
      background: "#f9f9f9",
      padding: "8px",
      border: "1px solid #ccc",
      boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
      borderRadius: "4px",
      pointerEvents: "none", 
      transition: "opacity 0.3s",
    }}
  ></div>
));

export default Plot;
