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
  const categories = [
    "Restaurants",
    "Groceries",
    "Lodging",
    "Hardware Stores",
    "Electronics Stores",
    "Work Sites",
    "Safety Gear Stores",
    "Marine and Outdoors Stores",
    "Miscellaneous"
  ];

  const [locations, setLocations] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);

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

  const [image, setImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const itemRefs = useRef({});

  useEffect(() => {
    fetch("https://my-map-backend.onrender.com/locations")
      .then(res => res.json())
      .then(data => setLocations(data));
  }, []);

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

  async function addOrUpdateLocation() {
    if (!name.trim() || !pendingPos) return;

    let imageUrl = null;

    try {
      if (image) {
        const formData = new FormData();
        formData.append("image", image);

        const uploadRes = await fetch("https://my-map-backend.onrender.com/upload", {
          method: "POST",
          body: formData
        });

        const text = await uploadRes.text();

        let uploadData;
        try {
          uploadData = JSON.parse(text);
        } catch {
          alert("Image upload failed");
          return;
        }

        imageUrl = uploadData.imageUrl;
      }

      const payload = {
        name,
        category,
        description,
        lat: pendingPos.lat,
        lng: pendingPos.lng,
        image_url: imageUrl
      };

      if (editingId) {
        await fetch(`https://my-map-backend.onrender.com/locations/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        setEditingId(null);
      } else {
        await fetch("https://my-map-backend.onrender.com/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const res = await fetch("https://my-map-backend.onrender.com/locations");
      const data = await res.json();
      setLocations(data);

      setName("");
      setDescription("");
      setImage(null);
      setPendingPos(null);
      setShowDescInput(false);

    } catch (err) {
      console.error(err);
      alert("Something failed");
    }
  }

  async function deleteLocation(id) {
    await fetch(`https://my-map-backend.onrender.com/locations/${id}`, {
      method: "DELETE"
    });
    setLocations(prev => prev.filter(l => l.id !== id));
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
    setPanelOpen(false);
  }

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      
      {/* MENU BUTTON */}
      <button
        onClick={() => setPanelOpen(true)}
        style={{
          position: "absolute",
          top: 10,
          right: 30,
          zIndex: 1000,
          padding: "10px 15px",
          fontSize: 18,
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: 5,
          cursor: "pointer"
        }}
      >
        ☰
      </button>

      {/* MAP */}
      <MapContainer
        center={[61.5996, 5.0328]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
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
                <small>{loc.description}</small><br />

                {loc.image_url && (
                  <img
                    src={loc.image_url}
                    alt=""
                    style={{
                      width: "100px",
                      marginTop: "5px",
                      cursor: "pointer"
                    }}
                    onClick={() => setSelectedImage(loc.image_url)}
                  />
                )}
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* IMAGE MODAL */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000
          }}
        >
          <img
            src={selectedImage}
            alt=""
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: "10px"
            }}
          />
        </div>
      )}

      {/* OVERLAY */}
      {panelOpen && (
        <div
          onClick={() => setPanelOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)",
            zIndex: 999
          }}
        />
      )}

      {/* SLIDE PANEL */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: panelOpen ? "10px" : "-320px",
          width: 300,
          height: "100%",
          background: "#fff",
          padding: 20,
          overflowY: "auto",
          zIndex: 1000,
          transition: "right 0.3s ease",
          boxShadow: "-2px 0 10px rgba(0,0,0,0.2)",
          borderRadius: "10px 0 0 10px"
        }}
      >
        <button onClick={() => setPanelOpen(false)}>Close</button>

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
            placeholder="Describe..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", marginTop: 10 }}
          />
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          style={{ marginTop: 10 }}
        />

        <button onClick={addOrUpdateLocation}>
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
                        cursor: "pointer",
                        color: textColors[color],
                        background:
                          selectedId === l.id ? "#ddd" : "transparent"
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