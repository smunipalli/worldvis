import "./App.css";
import { useState, useEffect, useMemo } from "react";
import * as d3 from "d3";
import Globe from "react-globe.gl";
import Button from "@mui/material/Button";
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

    let mapping = [
      { income_level: "North America", geo: "United States of America" },
    ];

    const filterCountries = () => {
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
    };

    // console.log(incomeLevel);

    return (
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        lineHoverPrecision={0}
        polygonsData={filterCountries()}
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
    <>
      <ChooseIndicators />
      <SwitchGlobes />
    </>
  );
}

export default App;
