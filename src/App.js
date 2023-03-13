import "./App.css";
import Globe from "react-globe.gl";

function App() {
  const N = 300;
  const gData = [...Array(N).keys()].map(() => ({
    lat: (Math.random() - 0.5) * 180,
    lng: (Math.random() - 0.5) * 360,
    size: 2, // Math.random() / 3,
    color: ["red", "white", "blue", "green"][Math.round(Math.random() * 3)],
  }));

  console.log(gData);

  return <Globe globeImageUrl="./img/earth-night.jpg" pointsData={gData} />;
}

export default App;
