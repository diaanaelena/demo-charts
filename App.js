import React, { useState } from "react";
import Papa from "papaparse";
import "./styling.css";
import Plot from "./ScatterPlot";
const styles = {
  fileUploader: {
    display: "block",
    margin: "10px auto",
    padding: "10px 15px",
    textAlign: "center",
    border: "1px solid #ccc",
    borderRadius: "5px",
    cursor: "pointer",
    backgroundColor: "#f4f4f4",
    transition: "background-color 0.3s",
    ":hover": {
      backgroundColor: "#e0e0e0",
    },
  },
};

function App() {
  const [dataArray1, setDataArray1] = useState([]);
  const [dataArray2, setDataArray2] = useState([]);

  const changeHandler1 = (event) => {
    Papa.parse(event.target.files[0], {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => header.trim(),
      complete: function (results) {
        console.log(results.data);
        setDataArray1(results.data);
      },
    });
  };
  const changeHandler2 = (event) => {
    Papa.parse(event.target.files[0], {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => header.trim(),
      complete: function (results) {
        console.log(results.data);
        // Replace "?" and "N/A" with null
        const cleanedData = results.data.map((row) => {
          for (const key in row) {
            if (row[key] === "?" || row[key] === "N/A") {
              row[key] = null;
            }
          }
          return row;
        });

        setDataArray2(cleanedData);
      },
    });
  };
  return (
    <div className="App charts-container">
      <div>
        Common preferred fund filings -scattered
        <label style={styles.fileUploader}>
          <input
            type="file"
            name="Common preferred fund filings"
            accept=".csv"
            onChange={changeHandler1}
            style={{ display: "none" }} // hide the actual input
          />
          Upload CSV File
        </label>
        Composite derived data -lines
        <label style={styles.fileUploader}>
          <input
            type="file"
            name="Composite derived data"
            accept=".csv"
            onChange={changeHandler2}
            style={{ display: "none" }} 
          />
          Upload CSV File
        </label>
        {dataArray1.length > 0 && dataArray2.length > 0 ? (
          <Plot scatteredData={dataArray1} lineData={dataArray2} />
        ) : (
          <div>Please upload data to see chart 1</div>
        )}
      </div>
    </div>
  );
}

export default App;
