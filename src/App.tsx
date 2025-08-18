import { MapboxOverlay } from "@deck.gl/mapbox";
import { Drawer, Select, Space, Tabs, Tooltip } from "antd";
import { H3HexagonLayer, type DeckGLProps } from "deck.gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import Map, { useControl, type MapRef } from "react-map-gl/maplibre";
import "./App.css";

import { color } from "d3-color";
import { scaleSequential } from "d3-scale";
import { interpolateViridis } from "d3-scale-chromatic";

import { Legend } from "./Legend";

type LayerProps = {
  id: string;
  name: string;
  domain: number[];
  depths: number[];
};

function toRGB(hexstring: string) {
  const c = color(hexstring)?.rgb();
  return c ? [c.r, c.g, c.b] : [0, 0, 0];
}

function DeckGLOverlay(props: DeckGLProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const availableMonths = [
  {
    value: "202301",
    label: "2023-01",
  },
  {
    value: "202302",
    label: "2023-02",
  },
  {
    value: "202303",
    label: "2023-03",
  },
  {
    value: "202304",
    label: "2023-04",
  },
  {
    value: "202305",
    label: "2023-05",
  },
  {
    value: "202306",
    label: "2023-06",
  },
  {
    value: "202307",
    label: "2023-07",
  },
  {
    value: "202308",
    label: "2023-08",
  },
  {
    value: "202309",
    label: "2023-09",
  },
  {
    value: "202310",
    label: "2023-10",
  },
  {
    value: "202311",
    label: "2023-11",
  },
  {
    value: "202312",
    label: "2023-12",
  },
];

function App() {
  const mapRef = useRef<MapRef>(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [availableLayers, setAvaliableLayers] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState<LayerProps | null>(null);
  const [selectedDepth, setSelectedDepth] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState("202307");
  const [data, setData] = useState(null);

  const getColor = scaleSequential(
    selectedLayer ? selectedLayer.domain : [0, 10],
    interpolateViridis
  );

  const availableDepths = selectedLayer
    ? selectedLayer.depths.map((d) => ({ value: d, label: d.toString() }))
    : [{ value: 0, label: "0" }];

  useEffect(() => {
    fetch("layers.json")
      .then((res) => res.json())
      .then((layers) => {
        setAvaliableLayers(layers);
        setSelectedLayer(layers[0]);
      });
  }, []);

  useEffect(() => {
    fetch("202307-0-traffic_density-h3.json.gz", {
      headers: {
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip",
      },
    })
      .then((res) => res.json())
      .then((data) => setData(data));
  }, [selectedLayer, selectedDepth, selectedMonth]);

  useEffect(() => {
    if (openDrawer) {
      mapRef.current?.easeTo({ padding: { bottom: 378 } });
    } else {
      mapRef.current?.easeTo({ padding: { bottom: 0 } });
    }
  }, [openDrawer]);

  const onClose = () => {
    setOpenDrawer(false);
  };

  const layers = [
    new H3HexagonLayer({
      id: "h3-hexagon-layer",
      data: data,
      getHexagon: (d) => d.h3,
      getFillColor: (d) => toRGB(getColor(d.traffic_density)),
      pickable: true,
      highPrecision: true,
      beforeId: "watername_ocean", // In interleaved mode render the layer under map labels
      onClick: (e) => {
        console.log(e.object.traffic_density);
      },
    }),
  ];

  return (
    <>
      <div style={{ width: "100vw", height: "100vh" }}>
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: 50,
            latitude: 80,
            zoom: 2,
          }}
          mapStyle="style.json"
          onLoad={() => {
            setOpenDrawer(true);
          }}

          // onClick={() => mapRef.current?.easeTo({ padding: { left: 500 } })}
          // onClick={() => {
          //   setOpenDrawer(true);
          //   mapRef.current?.easeTo({ padding: { bottom: 378 } });
          // }}
        >
          <DeckGLOverlay layers={layers} />
        </Map>
      </div>
      <Drawer
        title="Info"
        closable={{ "aria-label": "Close Button" }}
        mask={false}
        placement="bottom"
        onClose={onClose}
        open={openDrawer}
      >
        <Tabs
          defaultActiveKey="1"
          items={[
            { key: "1", label: "Observe" },
            {
              key: "2",
              label: <Tooltip title="Work in progress">Compare</Tooltip>,
              disabled: true,
            },
          ]}
        />
        <Space direction="vertical" style={{ width: "100%" }}>
          <Select
            options={availableLayers}
            onChange={setSelectedLayer}
            style={{ width: "100%" }}
            value={selectedLayer}
          />
          <Space>
            <Select
              options={availableMonths}
              value={selectedMonth}
              onChange={setSelectedMonth}
              prefix="Month: "
            />
            <Select
              options={availableDepths}
              disabled={availableDepths.length === 1}
              value={selectedDepth}
              onChange={setSelectedDepth}
              prefix="Depth: "
            />
          </Space>

          <Legend colorScale={getColor} />
        </Space>
      </Drawer>
    </>
  );
}

export default App;
