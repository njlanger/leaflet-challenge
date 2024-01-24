// Store our API endpoint as queryUrl.
let queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

// Store the tectonic plates dataset path. OPTIONAL
let tectonicPlatesPath = "static/PB2002_boundaries.json";

// Perform a GET request to the query URL.
d3.json(queryUrl).then(function (data) {
  // Once we get a response, send the data.features object to the createFeatures function.
  createFeatures(data.features);
});

// Function to determine marker color based on earthquake depth.
function getColor(depth) {
  if (depth > 90) return "#FF0000"; // Red for deep earthquakes
  else if (depth > 70) return "#FF4500"; // Orange
  else if (depth > 50) return "#CCCC00"; // Yellow
  else if (depth > 30) return "#FFFF00"; // Yellow
  else if (depth > 10) return "#ADFF2F"; // Green
  else return "#00FF00"; // Light Green for shallow earthquakes
}

function createFeatures(earthquakeData) {

// Log the earthquakeData to the console.
  console.log("Earthquake Data:", earthquakeData);

  let markers = [];

  earthquakeData.forEach(function (feature) {
    let marker = L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
      radius: feature.properties.mag * 5,  // Reflect magnitude in marker size
      fillColor: getColor(feature.geometry.coordinates[2]), // Reflect depth in marker color
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    }).bindPopup(`<h3>${feature.properties.place}</h3><hr>
                  <p>Magnitude: ${feature.properties.mag}</p>
                  <p>Depth: ${feature.geometry.coordinates[2]}</p>
                  <p>${new Date(feature.properties.time)}</p>`);

    markers.push(marker);
  });

  let layerGroup = L.layerGroup(markers);

// OPTIONAL
// Load the tectonic plates dataset using d3.json. 
 d3.json(tectonicPlatesPath).then(function (tectonicData) {
  // Create a GeoJSON layer for the tectonic plates.
  let tectonicPlates = L.geoJSON(tectonicData, {
    style: function (feature) {
      return {
        color: "#FFA500", // Orange color for tectonic plates
        weight: 2
      };
    }
  }); 

// Add both earthquake and tectonic plates layers to the map.
  createMap(layerGroup, tectonicPlates);
});
}

let myMap;

// Define the createMap function.
function createMap(earthquakes,tectonicPlates) {
  let myMap = L.map("map", {
    center: [0, 0],
    zoom: 2
  });

// Add a title to the map
  let title = L.control();

  title.onAdd = function (map) {
    let div = L.DomUtil.create("div", "info title");
    div.innerHTML = "<h1>USGS - All Earthquakes</strong><br>From Previous Day</h1>";
    return div;
  };

  title.addTo(myMap);

  // Create tile layers for different base maps
  let streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  // OPTIONAL
  let satelliteLayer = L.tileLayer("https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
    attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a> contributors'
  });

  // Add the tile layers to the map
  streetLayer.addTo(myMap);

  // Create a layer control, and add the base maps and overlays
  let baseMaps = {
    "Street Map": streetLayer,
    "Satellite Map": satelliteLayer // OPTIONAL
  };

  let overlayMaps = {
    "Earthquakes": earthquakes,
    "Tectonic Plates": tectonicPlates // OPTIONAL
  };

  L.control.layers(baseMaps, overlayMaps).addTo(myMap); //OPTIONAL (overlayMaps)

  // Add the earthquake and tectonic plates layers to the map by default
  earthquakes.addTo(myMap);
  tectonicPlates.addTo(earthquakes); //OPTIONAL

  // Create a simplified legend with only the color scale
  let legend = L.control({ position: "bottomright" });

  legend.onAdd = function (map) {
    let div = L.DomUtil.create("div", "info legend");
    let depths = [0, 10, 30, 50, 70, 90];

    // Add color swatches to represent the depth ranges
    div.innerHTML = '<strong>Depth of Earthquakes</strong><br>Measured in km</strong>';
    for (let i = 0; i < depths.length; i++) {
      div.innerHTML +=
        '<div class="legend-item">' +
        '<i style="background:' + getColor(depths[i] + 1) + '"></i> ' +
        depths[i] + (depths[i + 1] ? '&ndash;' + depths[i + 1] + ' km' : '+ km') +
        '</div>';
    }

  // OPTIONAL
  // Add a legend item for tectonic plates
  div.innerHTML += '<div class="legend-item">' +
  '<i style="background:#FFA500"></i> ' +
  'Tectonic Plates' +
  '</div>';
  
    return div;
  };

  // Add the legend to the map
  legend.addTo(myMap);
}