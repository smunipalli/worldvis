import { Grid } from "@mui/material";
import Colors from "./Colors";
const MapLegend = (props) => {
  const { data } = props;
  return (
    <Grid container spacing={2}>
      <Grid item xs={2}>
        <svg width="20" height="40" id="svg">
          <Colors data={{ color: data.color }} width={20} />
        </svg>
      </Grid>
      <Grid item xs={8}>
        {/* <div style={{ marginLeft: "0px" }}>{data.label}</div> */}
        {data.label}
      </Grid>
    </Grid>
  );
};
export default MapLegend;
