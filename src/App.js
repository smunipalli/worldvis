import "./App.css";
import { useState, useEffect, useMemo } from "react";
import * as d3 from "d3";
import Globe from "react-globe.gl";
import Button from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import _ from "lodash";

function App() {
  const [selectGlobes, setselectGlobes] = useState("regularGlobe");

  const RegularGlobe = () => {
    const N = 300;
    const gData = [...Array(N).keys()].map(() => ({
      lat: (Math.random() - 0.5) * 180,
      lng: (Math.random() - 0.5) * 360,
      size: 2, // Math.random() / 3,
      color: ["red", "white", "blue", "green"][Math.round(Math.random() * 3)],
    }));

    console.log(gData);

    return <Globe globeImageUrl="./img/earth-night.jpg" pointsData={gData} />;
  };
  const ChoroplethGlobe = () => {
    const [countries, setCountries] = useState({ features: [] });
    const [hoverD, setHoverD] = useState();

    useEffect(() => {
      // load data
      fetch("./geo/ne_110m_admin_0_countries.geojson")
        .then((res) => res.json())
        .then(setCountries);
    }, []);

    const colorScale = d3.scaleSequentialSqrt(d3.interpolateYlOrRd);

    // GDP per capita (avoiding countries with small pop)
    const getVal = (feat) =>
      feat.properties.GDP_MD_EST / Math.max(1e5, feat.properties.POP_EST);

    const maxVal = useMemo(
      () => Math.max(...countries.features.map(getVal)),
      [countries]
    );
    colorScale.domain([0, maxVal]);

    return (
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        lineHoverPrecision={0}
        polygonsData={countries.features.filter(
          (d) => d.properties.ISO_A2 !== "AQ"
        )}
        polygonAltitude={(d) => (d === hoverD ? 0.12 : 0.06)}
        polygonCapColor={(d) =>
          d === hoverD ? "steelblue" : colorScale(getVal(d))
        }
        polygonSideColor={() => "rgba(0, 100, 0, 0.15)"}
        polygonStrokeColor={() => "#111"}
        polygonLabel={({ properties: d }) => `
        <b>${d.ADMIN} (${d.ISO_A2}):</b> <br />
        GDP: <i>${d.GDP_MD_EST}</i> M$<br/>
        Population: <i>${d.POP_EST}</i>
      `}
        onPolygonHover={setHoverD}
        polygonsTransitionDuration={300}
      />
    );
  };

  const ChoroplethGlobe1 = () => {
    const [countries, setCountries] = useState({ features: [] });
    const [incomeLevel, setincomeLevel] = useState({ income: [] });

    const [hoverD, setHoverD] = useState();

    useEffect(() => {
      // load data
      fetch("./geo/ne_110m_admin_0_countries.geojson")
        .then((res) => res.json())
        .then(setCountries);
    }, []);

    useEffect(() => {
      // load data
      fetch("./geo/income_level.json")
        .then((res) => res.json())
        .then(setincomeLevel);
    }, []);

    const colorScale = d3.scaleSequentialSqrt(d3.interpolateYlOrRd);

    // GDP per capita (avoiding countries with small pop)
    const getVal = (feat) =>
      feat.properties.GDP_MD_EST / Math.max(1e5, feat.properties.POP_EST);

    const maxVal = useMemo(
      () => Math.max(...countries.features.map(getVal)),
      [countries]
    );
    colorScale.domain([0, maxVal]);

    let match_countries = [];
    let missing_countries = [];

    let colorMap = {
      HIC: "#2adb0b",
      UMC: "#0b69db",
      LMC: "#f7f307",
      LIC: "#f70707",
      "": "#000000",
      INX: "#000000",
    };

    const filterCountries = useMemo(() => {
      _.forEach(incomeLevel, (v) => {
        const val = _.find(countries.features, (o) => {
          // return o.properties.ISO_A3 === v.id;
          return (
            o.properties.NAME.toLowerCase() === v.value.toLowerCase() ||
            o.properties.ISO_A3 === v.id
          );
        });

        if (val === undefined) {
          missing_countries.push(v);
        } else {
          val.incomeLevel = v.incomeLevel;

          if (val.properties.ISO_A3 == "USA") {
            console.log(getVal(val));
            console.log(colorScale(1));
          }
          match_countries.push(val);
        }
      });

      // adding missing locations from mappings

      // _.forEach(mapping, (v) => {
      //   const val = _.find(countries.features, (o) => {
      //     return o.properties.NAME === v.geo;
      //   });
      //   if (val === undefined) {
      //     missing_countries.push(v);
      //   } else {
      //     match_countries.push(val);
      //   }
      // });

      // console.log(match_countries);
      // console.log(missing_countries);

      // console.log(
      //   _.filter(match_countries, (o) => {
      //     return o !== undefined;
      //   })
      // );

      return match_countries.filter((d) => d.properties.ISO_A2 !== "AQ");
      // return countries.features.filter((d) => d.properties.ISO_A2 !== "AQ");
    }, [countries]);

    // console.log(incomeLevel);

    return (
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        lineHoverPrecision={0}
        polygonsData={filterCountries}
        polygonAltitude={(d) => (d === hoverD ? 0.12 : 0.06)}
        // polygonCapColor={(d) =>
        //   d === hoverD ? "steelblue" : colorScale(getVal(d))
        // }
        polygonCapColor={(d) =>
          d === hoverD ? "#ab6d02" : colorMap[d.incomeLevel]
        }
        polygonSideColor={() => "rgba(0, 100, 0, 0.15)"}
        polygonStrokeColor={() => "#111"}
        polygonLabel={(d) => `
        <div style="background:#000; padding:10px; border-radius: 5px; opacity:0.9"><b>${d.properties.ADMIN} (${d.properties.ISO_A2}):</b><br />        
        Income Level: <i>${d.incomeLevel}</i><br/></div>
      `}
        // polygonLabel={({ properties: d }) => `
        // <b>${d.ADMIN} (${d.ISO_A2}):</b> <br />
        // GDP: <i>${d.GDP_MD_EST}</i> M$<br/>
        // Population: <i>${d.POP_EST}</i>
        // `}
        onPolygonHover={setHoverD}
        polygonsTransitionDuration={300}
      />
    );
  };

  const SwitchGlobes = () => {
    switch (selectGlobes) {
      case "regularGlobe":
        return <RegularGlobe />;
      case "choroplethGlobe":
        return <ChoroplethGlobe />;
      case "choroplethGlobe1":
        return <ChoroplethGlobe1 />;

      default:
        return <RegularGlobe />;
    }
  };

  const ChooseIndicators = () => {
    return (
      <>
        <Button
          variant="contained"
          onClick={() => {
            setselectGlobes("regularGlobe");
          }}
        >
          regularGlobe
        </Button>
        &nbsp;
        <Button
          variant="contained"
          onClick={() => {
            setselectGlobes("choroplethGlobe");
          }}
        >
          choroplethGlobe
        </Button>
        &nbsp;
        <Button
          variant="contained"
          onClick={() => {
            setselectGlobes("choroplethGlobe1");
          }}
        >
          incomeLevel
        </Button>
      </>
    );
  };

  return (
    // <>
    // <Fab color="primary" aria-label="add">
    //   <AddIcon />
    // </Fab>
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          zIndex: 1000,
          marginTop: "10em",
          marginLeft: "10em",
        }}
      >
        <ChooseIndicators />
      </div>
      <div style={{ position: "absolute" }}>
        <SwitchGlobes />
      </div>
    </div>
    // </>
  );
}

export default App;
