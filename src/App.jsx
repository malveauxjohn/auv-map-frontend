import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 🔗 BACKEND API
const API = "https://my-map-backend.onrender.com";

// 🎨 Colors
const iconColors = {
  Restaurants: "red",
  Groceries: "green",
  Lodging: "violet",
  "Hardware Stores": "orange",
  "Electronics Stores": "blue",
  "Safety Gear Stores": "black",
  "Marine and Outdoors Stores": "blue",
  "Work Sites": "yellow",
  Miscellaneous: "grey"
};

const textColors = {
  red: "#d11",
  green: "#2e7d32",
  violet: "#7b1fa2",
  orange: "#ef6c00",
  blue: "#1565c0",
  black: "#000",
  blue: "#1565c0",
  yellow: "#f9a825",
  grey: "#555"
};

function createIcon(color) {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });
}

// seed fallback
const seedLocations = [];

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

function MapController({ setMap }) {
  const map = useMapEvents({});
  useEffect(() => setMap(map), [map]);
  return null;
}

export default function App() {
  const [categories] = useState([
    "Restaurants",
    "Groceries",
    "Lodging",
    "Hardware Stores",
    "Electronics Stores",
    "Work Sites",
    "Safety Gear Stores",
    "Marine and Outdoors Stores",
    "Miscellaneous"
  ]);

  const [locations, setLocations] = useState(seedLocations);

  const [activeCategories, setActiveCategories] = useState(
    Object.fromEntries(categories.map(c => [c, true]))
  );

  const [collapsed, setCollapsed] = useState({});
  const [pendingPos, setPendingPos] = useState(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Restaurants");
  const [description, setDescription] = useState("");
  const [showDescInput, setShowDescInput] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [map, setMap] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const itemRefs = useRef({});

  // 🔥 LOAD FROM BACKEND
  useEffect(() => {
    fetch(`${API}/locations`)
      .then(res => res.json())
      .then(data => {
        if (data.length === 0) {
          setLocations(seedLocations);
        } else {
          setLocations(data);
        }
      })
      .catch(err => console.error(err));
  }, []);

  // 🔥 scroll into view
  useEffect(() => {
    if (selectedId && itemRefs.current[selectedId]) {
      itemRefs.current[selectedId].scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, [selectedId]);

  function handleMapClick(latlng) {
    setPendingPos(latlng);
  }

  // 🔥 ADD / UPDATE (BACKEND)
  function addOrUpdateLocation() {
    if (!name.trim() || !pendingPos) return;

    if (editingId) {
      fetch(`${API}/locations/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          description,
          lat: pendingPos.lat,
          lng: pendingPos.lng
        })
      }).then(() => {
        setLocations(prev =>
          prev.map(l =>
            l.id === editingId
              ? { ...l, name, category, description, lat: pendingPos.lat, lng: pendingPos.lng }
              : l
          )
        );
      });

      setEditingId(null);
    } else {
      fetch(`${API}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          description,
          lat: pendingPos.lat,
          lng: pendingPos.lng
        })
      })
        .then(res => res.json())
        .then(newLoc => {
          setLocations(prev => [...prev, { ...newLoc, name, category, description, lat: pendingPos.lat, lng: pendingPos.lng }]);
        });
    }

    setName("");
    setDescription("");
    setPendingPos(null);
    setShowDescInput(false);
  }

  // 🔥 DELETE (BACKEND)
  function deleteLocation(id) {
    fetch(`${API}/locations/${id}`, {
      method: "DELETE"
    }).then(() => {
      setLocations(prev => prev.filter(l => l.id !== id));
    });
  }

  function startEdit(loc) {
    setEditingId(loc.id);
    setName(loc.name);
    setCategory(loc.category);
    setDescription(loc.description || "");
    setPendingPos({ lat: loc.lat, lng: loc.lng });
    setShowDescInput(true);
    if (map) map.flyTo([loc.lat, loc.lng], 16);
  }

  function toggleCategory(cat) {
    setActiveCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  }

  function toggleCollapse(cat) {
    setCollapsed(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  }

  function zoomToLocation(loc) {
    if (!map) return;
    setSelectedId(loc.id);
    map.flyTo([loc.lat, loc.lng], 16);
  }

  return (
    <div style={{ display: "flex" }}>
      {/* MAP */}
      <div style={{ height: "100vh", width: "70%" }}>
        <MapContainer center={[61.5996, 5.0328]} zoom={13} style={{ height: "100%" }}>
          <TileLayer
            attribution="© OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickHandler onMapClick={handleMapClick} />
          <MapController setMap={setMap} />

          {pendingPos && (
            <Marker position={[pendingPos.lat, pendingPos.lng]}>
              <Popup>Selected</Popup>
            </Marker>
          )}

          {locations
            .filter(loc => activeCategories[loc.category])
            .map(loc => (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={createIcon(iconColors[loc.category] || "grey")}
                eventHandlers={{
                  click: () => zoomToLocation(loc)
                }}
              >
                <Popup>
                  <b>{loc.name}</b><br />
                  {loc.category}<br />
                  <small>{loc.description}</small>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {/* SIDE PANEL */}
      <div style={{ width: "30%", padding: 20, overflowY: "auto", maxHeight: "100vh" }}>
        <h2>{editingId ? "Edit Location" : "Add Location"}</h2>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        >
          {categories.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <button onClick={() => setShowDescInput(prev => !prev)}>
          {showDescInput ? "Hide Description" : "Add Description"}
        </button>

        {showDescInput && (
          <textarea
            placeholder="Describe items/services..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", marginTop: 10 }}
          />
        )}

        <button onClick={addOrUpdateLocation} disabled={!pendingPos || !name.trim()}>
          {editingId ? "Update" : "Save"}
        </button>

        <hr />

        <h2>Categories</h2>

        {categories.map(cat => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: "bold", fontSize: 18 }}>
              <input
                type="checkbox"
                checked={activeCategories[cat]}
                onChange={() => toggleCategory(cat)}
              />
              <span
                onClick={() => toggleCollapse(cat)}
                style={{ cursor: "pointer", marginLeft: 5 }}
              >
                {collapsed[cat] ? "▶" : "▼"} {cat}
              </span>
            </div>

            {!collapsed[cat] &&
              locations
                .filter(l => l.category === cat)
                .map(l => {
                  const color = iconColors[l.category] || "grey";
                  return (
                    <div
                      key={l.id}
                      ref={el => (itemRefs.current[l.id] = el)}
                      onClick={() => zoomToLocation(l)}
                      style={{
                        paddingLeft: 20,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        color: textColors[color],
                        background: selectedId === l.id ? "#ddd" : "transparent",
                        borderRadius: 5
                      }}
                    >
                      <span>• {l.name}</span>

                      <span>
                        <button onClick={() => startEdit(l)}>✏️</button>
                        <button onClick={() => deleteLocation(l.id)}>🗑</button>
                      </span>
                    </div>
                  );
                })}
          </div>
        ))}
      </div>
    </div>
  );
}