import * as d3 from "d3";
import { useEffect, useMemo, useRef } from "react";

// Helper component for the main App
// All Tailwind classes have been removed and replaced with inline styles
// to make it compatible with UI libraries like Ant Design.
export const Legend = ({
  colorScale,
  width = 200,
  height = 50,
  marginTop = 10,
  marginRight = 10,
  marginBottom = 20,
  marginLeft = 10,
}) => {
  const axisRef = useRef(null);

  // Generate a unique ID for the gradient to avoid conflicts
  const gradientId = useMemo(
    () => `legend-gradient-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  useEffect(() => {
    if (!axisRef.current) return;

    // --- 1. Create the Axis Scale ---
    // This scale maps the domain of your color scale (e.g., [0, 10])
    // to the horizontal space of the legend (its width).
    const axisScale = d3
      .scaleLinear()
      .domain(colorScale.domain())
      .range([marginLeft, width - marginRight]);

    // --- 2. Create the Axis Generator ---
    // This function will generate the visual representation of the axis.
    const axisGenerator = d3
      .axisBottom(axisScale)
      .ticks(width / 60) // Adjust number of ticks based on width
      .tickSize(10); // The little lines pointing up from the numbers

    // --- 3. Render the Axis ---
    // We use d3.select to grab the SVG group element and call the generator.
    d3.select(axisRef.current)
      .call(axisGenerator)
      // Style the axis text
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#333");

    // Remove the default domain line for a cleaner look
    d3.select(axisRef.current).select(".domain").remove();
  }, [colorScale, width, marginLeft, marginRight]);

  // --- 4. Create Gradient Stops ---
  // We need to sample the color scale at various points to create the gradient.
  const gradientStops = d3.range(0, 1.01, 0.1).map((t) => ({
    offset: `${t * 100}%`,
    color: colorScale.interpolator()(t),
  }));

  // Basic wrapper styles, similar to a Card component
  const wrapperStyles = {
    padding: "16px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e8e8e8",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.09)",
  };

  return (
    <div style={wrapperStyles}>
      <svg width={width} height={height} style={{ overflow: "visible" }}>
        {/* Define the gradient in the <defs> section */}
        <defs>
          <linearGradient id={gradientId}>
            {gradientStops.map((stop, i) => (
              <stop key={i} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>

        {/* The rectangle that displays the gradient */}
        <rect
          x={marginLeft}
          y={marginTop}
          width={width - marginLeft - marginRight}
          height={height - marginTop - marginBottom}
          fill={`url(#${gradientId})`}
          stroke="#ccc"
          strokeWidth="1"
        />

        {/* The group element where the D3 axis will be rendered */}
        <g ref={axisRef} transform={`translate(0, ${height - marginBottom})`} />
      </svg>
    </div>
  );
};

// --- Main App Component to demonstrate the Legend ---
export default function App() {
  // Define the D3 sequential color scale
  const myColorScale = d3.scaleSequential([0, 10], d3.interpolateViridis);

  // Basic styles for the main container
  const appStyles = {
    backgroundColor: "#f0f2f5",
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    padding: "16px",
  };

  const contentStyles = {
    width: "100%",
    maxWidth: "512px",
  };

  return (
    <div style={appStyles}>
      <div style={contentStyles}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "rgba(0, 0, 0, 0.85)",
            marginBottom: "8px",
            textAlign: "center",
          }}
        >
          D3 Legend in React
        </h1>
        <p
          style={{
            color: "rgba(0, 0, 0, 0.65)",
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          This is a reusable legend component for a D3 sequential color scale.
        </p>

        <Legend colorScale={myColorScale} />

        <div
          style={{
            marginTop: "32px",
            textAlign: "center",
            fontSize: "0.875rem",
            color: "rgba(0, 0, 0, 0.45)",
          }}
        >
          <p>
            The legend above represents a scale from {myColorScale.domain()[0]}{" "}
            to {myColorScale.domain()[1]}.
          </p>
          <p>
            Color Interpolator:
            <span
              style={{
                fontFamily: "monospace",
                backgroundColor: "#f0f0f0",
                padding: "2px 8px",
                borderRadius: "4px",
                margin: "0 4px",
              }}
            >
              d3.interpolateViridis
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
