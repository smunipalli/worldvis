import "./App.css";
import { useState, useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import Globe from "react-globe.gl";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import PublicIcon from "@mui/icons-material/Public";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Unstable_Grid2";
import Chart from "./Chart";
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

  const WorldPopulation = () => {
    const globeEl = useRef();
    const [popData, setPopData] = useState([]);

    useEffect(() => {
      // load data
      fetch("./geo/worldcities_latlog.csv")
        .then((res) => res.text())
        .then((csv) =>
          d3.csvParse(csv, ({ lat, lng, pop }) => ({
            lat: +lat,
            lng: +lng,
            pop: +pop,
          }))
        )
        .then(setPopData);
    }, []);

    useEffect(() => {
      // Auto-rotate
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.1;
    }, []);

    const weightColor = d3
      .scaleSequentialSqrt(d3.interpolateYlOrRd)
      .domain([0, 1e7]);

    return (
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        hexBinPointsData={popData}
        hexBinPointWeight="pop"
        hexAltitude={(d) => d.sumWeight * 6e-8}
        hexBinResolution={4}
        hexTopColor={(d) => weightColor(d.sumWeight)}
        hexSideColor={(d) => weightColor(d.sumWeight)}
        hexBinMerge={true}
        enablePointerInteraction={false}
      />
    );
  };

  const IncomeLevelGlobe = () => {
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

      return match_countries.filter((d) => d.properties.ISO_A2 !== "AQ");
    }, [countries]);

    // console.log(incomeLevel);

    return (
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        lineHoverPrecision={0}
        polygonsData={filterCountries}
        polygonAltitude={(d) => (d === hoverD ? 0.12 : 0.06)}
        polygonCapColor={(d) =>
          d === hoverD ? "#ab6d02" : colorMap[d.incomeLevel]
        }
        polygonSideColor={() => "rgba(0, 100, 0, 0.15)"}
        polygonStrokeColor={() => "#111"}
        polygonLabel={(d) => `
        <div style="background:#000; padding:10px; border-radius: 5px; opacity:0.9"><b>${d.properties.ADMIN} (${d.properties.ISO_A2}):</b><br />        
        Income Level: <i>${d.incomeLevel}</i><br/></div>
      `}
        onPolygonHover={setHoverD}
        polygonsTransitionDuration={300}
      />
    );
  };

  const EnergyUseGlobe = () => {
    const [countries, setCountries] = useState({ features: [] });
    const [energyAccess, setenergyAccess] = useState({ income: [] });

    const [hoverD, setHoverD] = useState();

    // Option 1: give 2 color names
    const globeColor = d3
      .scaleLinear()
      .domain([1, 100])
      .range(["#ff7d00", "#0077b6"]);
    // .range(["#0077b6", "#03045e"]);

    useEffect(() => {
      // load data
      fetch("./geo/ne_110m_admin_0_countries.geojson")
        .then((res) => res.json())
        .then(setCountries);
    }, []);

    useEffect(() => {
      // load data
      fetch("./geo/electricity_access.json")
        .then((res) => res.json())
        .then(setenergyAccess);
    }, []);

    // GDP per capita (avoiding countries with small pop)
    const getVal = (feat) =>
      feat.properties.GDP_MD_EST / Math.max(1e5, feat.properties.POP_EST);

    const maxVal = useMemo(
      () => Math.max(...countries.features.map(getVal)),
      [countries]
    );

    let match_countries = [];
    let missing_countries = [];

    const filterCountries = useMemo(() => {
      _.forEach(energyAccess, (v) => {
        const val = _.find(countries.features, (o) => {
          return (
            (o.properties.NAME.toLowerCase() === v.Entity.toLowerCase() ||
              o.properties.ISO_A3 === v.Code) &&
            v.Year === 2000 // TODO: modify the year
          );
        });

        if (val === undefined) {
          missing_countries.push(v);
        } else {
          val.Access_to_Electricity_percent = v.Access_to_Electricity_percent;
          match_countries.push(val);
        }
      });

      return match_countries.filter((d) => d.properties.ISO_A2 !== "AQ");
    }, [countries]);

    // console.log(incomeLevel);

    return (
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        lineHoverPrecision={0}
        polygonsData={filterCountries}
        polygonAltitude={(d) => (d === hoverD ? 0.12 : 0.06)}
        polygonCapColor={(d) =>
          d === hoverD ? "#ab6d02" : globeColor(d.Access_to_Electricity_percent)
        }
        polygonSideColor={() => "rgba(0, 100, 0, 0.15)"}
        polygonStrokeColor={() => "#111"}
        polygonLabel={(d) => `
        <div style="background:#000; padding:10px; border-radius: 5px; opacity:0.9"><b>${d.properties.ADMIN} (${d.properties.ISO_A2}):</b><br />        
        % Accessible Electricity: <i>${d.Access_to_Electricity_percent}</i><br/></div>
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
      case "incomeLevel":
        return <IncomeLevelGlobe />;
      case "energyUse":
        return <EnergyUseGlobe />;
      case "worldPopulation":
        return <WorldPopulation />;
      default:
        return <RegularGlobe />;
    }
  };

  const ChooseIndicators = () => {
    const [cardHover, setCardHover] = useState(0.5);

    return (
      <>
        <div
          style={{
            opacity: cardHover,
            transform: "scale(0.8)",
            width: "25vh",
          }}
          onMouseEnter={() => setCardHover(1.0)}
          onMouseLeave={() => setCardHover(0.5)}
        >
          <Card variant="outlined">
            <CardContent>
              <Typography
                sx={{ fontSize: 17, marginBottom: "-30px", fontWeight: "bold" }}
                color="text.secondary"
                gutterBottom
              >
                Choose indicators
              </Typography>
            </CardContent>
            <CardActions>
              <List
                sx={{
                  width: "100%",
                  maxWidth: 360,
                  bgcolor: "background.paper",
                }}
                component="nav"
                // aria-labelledby="nested-list-subheader"
                // subheader={
                //   <ListSubheader component="div" id="nested-list-subheader">
                //     Nested List Items
                //   </ListSubheader>
                // }
              >
                <ListItemButton
                  onClick={() => {
                    setselectGlobes("regularGlobe");
                  }}
                >
                  <ListItemIcon>
                    <PublicIcon
                      color={(() =>
                        selectGlobes === "regularGlobe"
                          ? "primary"
                          : "inherit")()}
                    />
                  </ListItemIcon>
                  <ListItemText primary="Regular Globe" />
                </ListItemButton>

                <ListItemButton
                  onClick={() => {
                    setselectGlobes("choroplethGlobe");
                  }}
                >
                  <ListItemIcon>
                    <PublicIcon
                      color={(() =>
                        selectGlobes === "choroplethGlobe"
                          ? "primary"
                          : "inherit")()}
                    />
                  </ListItemIcon>
                  <ListItemText primary="Choropleth Globe" />
                </ListItemButton>
                <ListItemButton
                  onClick={() => {
                    setselectGlobes("energyUse");
                  }}
                >
                  <ListItemIcon>
                    <PublicIcon
                      color={(() =>
                        selectGlobes === "energyUse" ? "primary" : "inherit")()}
                    />
                  </ListItemIcon>
                  <ListItemText primary="Energy consumption" />
                </ListItemButton>

                <ListItemButton
                  onClick={() => {
                    setselectGlobes("incomeLevel");
                  }}
                >
                  <ListItemIcon>
                    <PublicIcon
                      color={(() =>
                        selectGlobes === "incomeLevel"
                          ? "primary"
                          : "inherit")()}
                    />
                  </ListItemIcon>
                  <ListItemText primary="Income Level" />
                </ListItemButton>
                <ListItemButton
                  onClick={() => {
                    setselectGlobes("worldPopulation");
                  }}
                >
                  <ListItemIcon>
                    <PublicIcon
                      color={(() =>
                        selectGlobes === "worldPopulation"
                          ? "primary"
                          : "inherit")()}
                    />
                  </ListItemIcon>
                  <ListItemText primary="World Population" />
                </ListItemButton>
              </List>
            </CardActions>
          </Card>
        </div>
      </>
    );
  };

  // For world population - list the top 10 populated cities
  // Show graph for literacy rate and young population
  // For income level show the color map
  const MapDetails = () => {
    const [cardHover, setCardHover] = useState(0.5);
    return (
      <>
        <div
          style={{
            opacity: cardHover,
            width: "40vh",
            transform: "scale(0.8)",
          }}
          onMouseEnter={() => setCardHover(1.0)}
          onMouseLeave={() => setCardHover(0.5)}
        >
          <Card variant="outlined">
            <CardContent>
              <Typography
                sx={{ fontSize: 17, marginBottom: "30px", fontWeight: "bold" }}
                color="text.secondary"
                gutterBottom
              >
                Map Details
              </Typography>
              <Chart />
            </CardContent>
            <CardActions></CardActions>
          </Card>
        </div>
      </>
    );
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          zIndex: 1000,
          marginTop: "3em",
          marginLeft: "3em",
        }}
      >
        <Container fixed>
          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={2} sx={{ height: "96vh" }}>
              <Grid xs={12} md={5} lg={4}>
                <ChooseIndicators />
              </Grid>
              <Grid container xs={12} md={7} lg={8} spacing={4}></Grid>
              <Grid
                xs={12}
                md={5}
                lg={4}
                container
                justifyContent="space-between"
                alignItems="center"
                flexDirection={{ xs: "column", sm: "row" }}
              >
                <Grid sx={{ order: { xs: 2, sm: 1 }, positions: "bottom" }}>
                  <MapDetails />
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </div>

      <div style={{ position: "absolute" }}>
        <SwitchGlobes />
      </div>
    </div>
    // </>
  );
}

export default App;
