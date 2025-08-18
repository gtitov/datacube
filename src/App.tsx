//@ts-nocheck
import { MapboxOverlay } from "@deck.gl/mapbox";
import { Drawer, Select, Space, Tabs, Tooltip } from "antd";
import { H3HexagonLayer, type DeckGLProps } from "deck.gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Map, { useControl, type MapRef } from "react-map-gl/maplibre";
import "./App.css";

import { color } from "d3-color";
import { scaleSequential } from "d3-scale";
import { interpolateViridis } from "d3-scale-chromatic";

import { inflate } from "pako";
import { Legend } from "./Legend";

type LayerProps = {
  value: string;
  name: string;
  domain: number[];
  depths: number[];
};

function isGzip(uint8array: Uint8Array) {
  // Ensure the input has at least 2 bytes
  if (uint8array.length < 2) {
    return false;
  }

  // Check the magic number
  return uint8array[0] === 0x1f && uint8array[1] === 0x8b;
}

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
  const [availableLayers, setAvaliableLayers] = useState<LayerProps[]>([]);
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
    if (!selectedLayer?.value) {
      return;
    }
    fetch(
      `./data/${selectedMonth}-${selectedDepth}-${selectedLayer?.value}.json.gz`,
      {
        headers: {
          "Content-Type": "application/json",
          "Content-Encoding": "gzip",
        },
      }
    )
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const uint8view = new Uint8Array(buffer);
        let jsonString;
        if (isGzip(uint8view)) {
          jsonString = inflate(buffer, { to: "string" });
        } else {
          jsonString = new TextDecoder("utf-8").decode(buffer);
        }
        return JSON.parse(jsonString);
      })
      .then((data) => setData(data));
  }, [selectedLayer?.value, selectedDepth, selectedMonth]);

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

  const layers = useMemo(
    () => [
      new H3HexagonLayer({
        id: "h3-hexagon-layer",
        data: data,
        // Попробовать менять не все гексы, а только значения, т. е. getFillColor
        getHexagon: (d) => d.h3,
        getFillColor: (d) => toRGB(getColor(d.value)),
        // pickable: true,
        // highPrecision: true,
        // beforeId: "watername_ocean", // In interleaved mode render the layer under map labels
      }),
    ],
    [data, getColor]
  );

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
          {mapRef.current?.isStyleLoaded() && <DeckGLOverlay layers={layers} />}
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
            onChange={(e) =>
              setSelectedLayer(
                availableLayers.find((l) => e === l.value) || null
              )
            }
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
