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
import Slider from "@mui/material/Slider";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import AreaChart from "./AreaChart";
import _ from "lodash";

function App() {
  const [selectGlobes, setselectGlobes] = useState("worldPopulation");

  // global Sliders
  const [energyYear, setEnergyYear] = useState(1990);
  const [incomeYear, setIncomeYear] = useState(1987);
  const [male2529Year, setMale2529Year] = useState(1960);
  const [female2529Year, setFemale2529Year] = useState(1960);

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

  const Male2529Globe = () => {
    const [countries, setCountries] = useState({ features: [] });
    const [malePercentage, setmalePercentage] = useState({
      malepercentage: [],
    });

    const [hoverD, setHoverD] = useState();

    useEffect(() => {
      // load data
      fetch("./geo/ne_110m_admin_0_countries.geojson")
        .then((res) => res.json())
        .then(setCountries);
    }, []);

    useEffect(() => {
      // load data
      fetch("./geo/percent_male_population_25-29.json")
        .then((res) => res.json())
        .then(setmalePercentage);
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

    // Option 1: give 2 color names
    const globeColor = d3
      .scaleLinear()
      .domain([1, 10])
      .range(["#ff7d00", "#0077b6"]);

    const filterCountries = useMemo(() => {
      _.forEach(malePercentage.Codes, (v, k) => {
        const val = _.find(countries.features, (o) => {
          return o.properties.ISO_A3 === v;
        });

        if (val === undefined) {
          missing_countries.push(v);
        } else {
          val.malePercentage = malePercentage[male2529Year.toString()][k];

          // console.log(malePercentage[male2529Year.toString()][k]);

          // if (val.properties.ISO_A3 == "USA") {
          //   console.log(getVal(val));
          //   console.log(colorScale(1));
          // }
          match_countries.push(val);
        }
      });

      return match_countries.filter((d) => d.properties.ISO_A2 !== "AQ");
    }, [countries]);

    return (
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        lineHoverPrecision={0}
        polygonsData={filterCountries}
        polygonAltitude={(d) => (d === hoverD ? 0.12 : 0.06)}
        polygonCapColor={(d) =>
          d === hoverD ? "#ab6d02" : globeColor(parseFloat(d.malePercentage))
        }
        polygonSideColor={() => "rgba(0, 100, 0, 0.15)"}
        polygonStrokeColor={() => "#111"}
        polygonLabel={(d) => `
        <div style="background:#000; padding:10px; border-radius: 5px; opacity:0.9"><b>${d.properties.ADMIN} (${d.properties.ISO_A2}):</b><br />
        Male 25-29 %: <i>${d.malePercentage}</i><br/></div>
      `}
        onPolygonHover={setHoverD}
        polygonsTransitionDuration={300}
      />
    );
  };

  const Female2529Globe = () => {
    const [countries, setCountries] = useState({ features: [] });
    const [femalePercentage, setfemalePercentage] = useState({
      femalepercentage: [],
    });

    const [hoverD, setHoverD] = useState();

    useEffect(() => {
      // load data
      fetch("./geo/ne_110m_admin_0_countries.geojson")
        .then((res) => res.json())
        .then(setCountries);
    }, []);

    useEffect(() => {
      // load data
      fetch("./geo/percent_female_population_25-29.json")
        .then((res) => res.json())
        .then(setfemalePercentage);
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

    // Option 1: give 2 color names
    const globeColor = d3
      .scaleLinear()
      .domain([1, 10])
      .range(["#ff7d00", "#0077b6"]);

    const filterCountries = useMemo(() => {
      _.forEach(femalePercentage.Codes, (v, k) => {
        const val = _.find(countries.features, (o) => {
          return o.properties.ISO_A3 === v;
        });

        if (val === undefined) {
          missing_countries.push(v);
        } else {
          val.femalePercentage = femalePercentage[female2529Year.toString()][k];

          // console.log(femalePercentage[female2529Year.toString()][k]);

          // if (val.properties.ISO_A3 == "USA") {
          //   console.log(getVal(val));
          //   console.log(colorScale(1));
          // }
          match_countries.push(val);
        }
      });

      return match_countries.filter((d) => d.properties.ISO_A2 !== "AQ");
    }, [countries]);

    return (
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        lineHoverPrecision={0}
        polygonsData={filterCountries}
        polygonAltitude={(d) => (d === hoverD ? 0.12 : 0.06)}
        polygonCapColor={(d) =>
          d === hoverD ? "#ab6d02" : globeColor(parseFloat(d.femalePercentage))
        }
        polygonSideColor={() => "rgba(0, 100, 0, 0.15)"}
        polygonStrokeColor={() => "#111"}
        polygonLabel={(d) => `
        <div style="background:#000; padding:10px; border-radius: 5px; opacity:0.9"><b>${d.properties.ADMIN} (${d.properties.ISO_A2}):</b><br />
        Female 25-29 %: <i>${d.femalePercentage}</i><br/></div>
      `}
        onPolygonHover={setHoverD}
        polygonsTransitionDuration={300}
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
      fetch("./geo/Income_groups_history.json")
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
      HIC: "#208b3a",
      UMC: "#1a759f",
      LMC: "#ffca3a",
      LIC: "#c1121f",
      "": "#000000",
      INX: "#000000",
    };

    const filterCountries = useMemo(() => {
      _.forEach(incomeLevel.Codes, (v, k) => {
        const val = _.find(countries.features, (o) => {
          return o.properties.ISO_A3 === v;
        });

        if (val === undefined) {
          missing_countries.push(v);
        } else {
          val.incomeLevel = incomeLevel[incomeYear.toString()][k];

          // console.log(incomeLevel[incomeYear.toString()][k]);

          // if (val.properties.ISO_A3 == "USA") {
          //   console.log(getVal(val));
          //   console.log(colorScale(1));
          // }
          match_countries.push(val);
        }
      });

      return match_countries.filter((d) => d.properties.ISO_A2 !== "AQ");
    }, [countries]);

    return (
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        lineHoverPrecision={0}
        polygonsData={filterCountries}
        polygonAltitude={(d) => (d === hoverD ? 0.12 : 0.06)}
        polygonCapColor={(d) =>
          d === hoverD ? "#979dac" : colorMap[d.incomeLevel]
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
          // if (v.Entity === undefined || v.Entity === null) return false;
          return (
            // (o.properties.NAME.toLowerCase() === v.Entity.toLowerCase() ||
            o.properties.ISO_A3 === v.Code && v.Year === energyYear // TODO: modify the year
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
          d === hoverD ? "#80ed99" : globeColor(d.Access_to_Electricity_percent)
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
      case "incomeLevel":
        return <IncomeLevelGlobe />;
      case "energyUse":
        return <EnergyUseGlobe />;
      case "worldPopulation":
        return <WorldPopulation />;
      case "male_2529":
        return <Male2529Globe />;
      case "female_2529":
        return <Female2529Globe />;

      default:
        return <WorldPopulation />;
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
            width: "27vh",
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
              >
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
                    setselectGlobes("energyUse");
                  }}
                >
                  <ListItemIcon>
                    <PublicIcon
                      color={(() =>
                        selectGlobes === "energyUse" ? "primary" : "inherit")()}
                    />
                  </ListItemIcon>
                  <ListItemText primary="Electricity access" />
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
                  <ListItemText primary="World Population (Cities)" />
                </ListItemButton>

                <ListItemButton
                  onClick={() => {
                    setselectGlobes("female_2529");
                  }}
                >
                  <ListItemIcon>
                    <PublicIcon
                      color={(() =>
                        selectGlobes === "female_2529"
                          ? "primary"
                          : "inherit")()}
                    />
                  </ListItemIcon>
                  <ListItemText primary="% Female popluation 25 - 29" />
                </ListItemButton>

                <ListItemButton
                  onClick={() => {
                    setselectGlobes("male_2529");
                  }}
                >
                  <ListItemIcon>
                    <PublicIcon
                      color={(() =>
                        selectGlobes === "male_2529" ? "primary" : "inherit")()}
                    />
                  </ListItemIcon>
                  <ListItemText primary="% Male popluation 25 - 29" />
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
    const [sEnergyYear, setSEnergyYear] = useState(1990);
    const [sIncomeYear, setSIncomeYear] = useState(1987);
    const [sMale2529Year, setSMale2529Year] = useState(1960);
    const [sFemale2529Year, setSFemale2529Year] = useState(1960);

    // Prevent race condition between the slider rendering and the canvas
    // use 2 levels of states and then a button to render the map
    const sliderChangeEnergyYear = (e, value) => {
      setSEnergyYear(value);
    };

    const sliderChangeIncomeYear = (e, value) => {
      setSIncomeYear(value);
    };

    const sliderChangeMale2529 = (e, value) => {
      setSMale2529Year(value);
    };

    const sliderChangeFemale2529 = (e, value) => {
      setSFemale2529Year(value);
    };

    const sliders = () => {
      switch (selectGlobes) {
        case "incomeLevel":
          return (
            <>
              <Typography
                sx={{ fontSize: 17, marginBottom: "30px", fontWeight: "bold" }}
                color="text.secondary"
                gutterBottom
              >
                Income Level
              </Typography>
              <br />
              <br />
              <Grid container spacing={2} alignItems="center">
                <Grid item>Select Year</Grid>
                <Grid item xs>
                  <Slider
                    aria-label="Year"
                    defaultValue={incomeYear}
                    getAriaValueText={() => sIncomeYear}
                    onChange={sliderChangeIncomeYear}
                    valueLabelDisplay="on"
                    step={1}
                    marks
                    min={1987}
                    max={2021}
                  />
                </Grid>
              </Grid>

              <br />
              <Button
                variant="contained"
                endIcon={<AutoGraphIcon />}
                onClick={() => {
                  setIncomeYear(sIncomeYear);
                }}
              >
                Render
              </Button>
              <br />
              <br />
            </>
          );
        case "energyUse":
          return (
            <>
              <Typography
                sx={{ fontSize: 17, marginBottom: "30px", fontWeight: "bold" }}
                color="text.secondary"
                gutterBottom
              >
                % Electricity Access to the population for {energyYear}
              </Typography>
              <br />
              <Grid container spacing={2} alignItems="center">
                <Grid item>Select Year</Grid>
                <Grid item xs>
                  <Slider
                    aria-label="Year"
                    defaultValue={energyYear}
                    getAriaValueText={() => sEnergyYear}
                    onChange={sliderChangeEnergyYear}
                    valueLabelDisplay="on"
                    step={1}
                    marks
                    min={1990}
                    max={2020}
                  />
                </Grid>
              </Grid>

              <br />
              <Button
                variant="contained"
                endIcon={<AutoGraphIcon />}
                onClick={() => {
                  setEnergyYear(sEnergyYear);
                }}
              >
                Render
              </Button>
              <br />
              <br />
            </>
          );

        case "male_2529":
          return (
            <>
              <Typography
                sx={{ fontSize: 17, marginBottom: "30px", fontWeight: "bold" }}
                color="text.secondary"
                gutterBottom
              >
                % of Male population 25 - 29
              </Typography>
              <br />
              <br />
              <Grid container spacing={2} alignItems="center">
                <Grid item>Select Year</Grid>
                <Grid item xs>
                  <Slider
                    aria-label="Year"
                    defaultValue={male2529Year}
                    getAriaValueText={() => sMale2529Year}
                    onChange={sliderChangeMale2529}
                    valueLabelDisplay="on"
                    step={1}
                    marks
                    min={1960}
                    max={2021}
                  />
                </Grid>
              </Grid>

              <br />
              <Button
                variant="contained"
                endIcon={<AutoGraphIcon />}
                onClick={() => {
                  setMale2529Year(sMale2529Year);
                }}
              >
                Render
              </Button>
              <br />
              <br />
            </>
          );

        case "female_2529":
          return (
            <>
              <Typography
                sx={{ fontSize: 17, marginBottom: "30px", fontWeight: "bold" }}
                color="text.secondary"
                gutterBottom
              >
                % of Female population 25 - 29
              </Typography>
              <br />
              <br />
              <Grid container spacing={2} alignItems="center">
                <Grid item>Select Year</Grid>
                <Grid item xs>
                  <Slider
                    aria-label="Year"
                    defaultValue={female2529Year}
                    getAriaValueText={() => sFemale2529Year}
                    onChange={sliderChangeFemale2529}
                    valueLabelDisplay="on"
                    step={1}
                    marks
                    min={1960}
                    max={2021}
                  />
                </Grid>
              </Grid>

              <br />
              <Button
                variant="contained"
                endIcon={<AutoGraphIcon />}
                onClick={() => {
                  setFemale2529Year(sFemale2529Year);
                }}
              >
                Render
              </Button>
              <br />
              <br />
            </>
          );

        case "worldPopulation":
          return (
            <Typography
              sx={{ fontSize: 17, marginBottom: "30px", fontWeight: "bold" }}
              color="text.secondary"
              gutterBottom
            >
              World Population
            </Typography>
          );
        default:
          return (
            <Typography
              sx={{ fontSize: 17, marginBottom: "30px", fontWeight: "bold" }}
              color="text.secondary"
              gutterBottom
            >
              World Population
            </Typography>
          );
      }
    };

    const displayChart = () => {
      if (selectGlobes == "energyUse") {
        return (
          <>
            <div
              style={{
                opacity: cardHover,
                width: "64vh",
                marginLeft: "-4vh",
                transform: "scale(0.8)",
              }}
              onMouseEnter={() => setCardHover(1.0)}
              onMouseLeave={() => setCardHover(0.5)}
            >
              <Card variant="outlined">
                <CardContent>
                  <Typography
                    sx={{
                      fontSize: 17,
                      marginBottom: "30px",
                      fontWeight: "bold",
                    }}
                    color="text.secondary"
                    gutterBottom
                  >
                    Map Details
                  </Typography>
                  <br />
                  {sliders()}
                  {(() => {
                    if (selectGlobes == "energyUse") return <AreaChart />;
                    else return <></>;
                  })()}
                </CardContent>
                <CardActions></CardActions>
              </Card>
            </div>
          </>
        );
      } else {
        return (
          <>
            <div
              style={{
                opacity: cardHover,
                width: "28vh",
                transform: "scale(0.8)",
              }}
              onMouseEnter={() => setCardHover(1.0)}
              onMouseLeave={() => setCardHover(0.5)}
            >
              <Card variant="outlined">
                <CardContent>
                  <Typography
                    sx={{
                      fontSize: 17,
                      marginBottom: "30px",
                      fontWeight: "bold",
                    }}
                    color="text.secondary"
                    gutterBottom
                  >
                    Map Details
                  </Typography>
                  <br />
                  {sliders()}
                  {(() => {
                    if (selectGlobes === "worldPopulation")
                      return <>As of March 2022</>;
                    return <></>;
                  })()}
                </CardContent>
                <CardActions></CardActions>
              </Card>
            </div>
          </>
        );
      }
    };

    return displayChart();
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
