(function () {
  const { useEffect, useRef, useState } = React;
  const html = htm.bind(React.createElement);

  const STORAGE_KEY = "troski-watch-reports-v1";
  const DRAFT_KEY = "troski-watch-draft-v1";

  const INCIDENT_TYPES = [
    "Overspeeding",
    "Dangerous overtaking",
    "Phone use while driving",
    "Drunk driving",
    "Passenger overloading",
    "Ignoring stop sign",
    "Tyre or brake issue",
    "Driver abuse",
  ];

  const HOTSPOTS = [
    {
      title: "Circle to Achimota",
      tag: "88% passenger match",
      copy: "Heavy night traffic and sharp lane weaving reported after 8pm.",
      tone: "gold",
    },
    {
      title: "Kasoa Highway Rush",
      tag: "New episode",
      copy: "Morning overtaking spikes near the toll zone and bus-stop merge.",
      tone: "green",
    },
    {
      title: "Kaneshie Inner Loop",
      tag: "Live alert",
      copy: "Frequent stop-skipping and hard braking on market approach.",
      tone: "red",
    },
  ];

  const OFFICIAL_CHANNELS = [
    {
      title: "Police Emergency",
      number: "191",
      copy: "Use when the passenger or nearby road users are in immediate danger.",
      href: "tel:191",
      tone: "red",
      icon: "emergency",
    },
    {
      title: "Police WhatsApp",
      number: "020 663 9121",
      copy: "Send the report packet and attach the captured media evidence.",
      href: "https://wa.me/233206639121",
      tone: "gold",
      icon: "chat",
    },
    {
      title: "GIFEC Emergency",
      number: "112",
      copy: "Fast fallback response route when standard lines are busy.",
      href: "tel:112",
      tone: "green",
      icon: "phone_in_talk",
    },
    {
      title: "Government Vehicle Hotline",
      number: "1526",
      copy: "Use for reckless driving involving official vehicles with GV plates.",
      href: "tel:1526",
      tone: "gold",
      icon: "policy",
    },
  ];

  const SAMPLE_HISTORY = [
    {
      reference: "GHA-2941-TP",
      status: "Investigating",
      statusTone: "gold",
      incidentType: "Reckless overtaking",
      plate: "GT-4502-21",
      route: "Madina to Circle",
      location: "Achimota Overhead",
      createdAt: "Today, 09:22",
      evidenceCount: 2,
      notes: "Video and plate photo forwarded to MTTD.",
    },
    {
      reference: "GHA-2880-TP",
      status: "Resolved",
      statusTone: "green",
      incidentType: "Passenger overloading",
      plate: "AS-881-19",
      route: "Kumasi to Accra",
      location: "Suhum Junction",
      createdAt: "Yesterday, 17:48",
      evidenceCount: 1,
      notes: "Police confirmed vehicle interception and counselling.",
    },
  ];

  const DEMO_QR_PROFILES = {
    "DVLA:GT-4451-24": {
      plate: "GT-4451-24",
      route: "Achimota to Circle",
      driver: "Yaw Mensah",
      operator: "Asonaba Union",
      terminal: "Achimota New Station",
      vehicleType: "Toyota Hiace",
      location: "Achimota Main Road",
      verified: true,
    },
    "DVLA:GW-1182-26": {
      plate: "GW-1182-26",
      route: "Kaneshie to Lapaz",
      driver: "Akosua Boadi",
      operator: "Metro Troski Co-op",
      terminal: "Kaneshie Market Terminal",
      vehicleType: "Nissan Urvan",
      location: "Kaneshie First Light",
      verified: true,
    },
  };

  function StarIcon() {
    return html`
      <svg viewBox="0 0 100 100" aria-hidden="true" className="star-mark">
        <path d="M50 6 60 37 93 37 66 56 76 88 50 68 24 88 34 56 7 37 40 37 50 6Z" />
      </svg>
    `;
  }

  function getLocalDateTimeValue(date) {
    const source = date || new Date();
    const shifted = new Date(source.getTime() - source.getTimezoneOffset() * 60000);
    return shifted.toISOString().slice(0, 16);
  }

  function createDefaultForm() {
    return {
      plate: "",
      route: "",
      location: "",
      terminal: "",
      occurredAt: getLocalDateTimeValue(),
      details: "",
      incidentType: INCIDENT_TYPES[0],
      dangerLevel: "High",
      anonymous: true,
    };
  }

  function safeRead(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function safeWrite(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      return;
    }
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 KB";
    const units = ["B", "KB", "MB", "GB"];
    const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, power);
    return `${value.toFixed(value >= 10 || power === 0 ? 0 : 1)} ${units[power]}`;
  }

  function humanTime(isoString) {
    try {
      const date = new Date(isoString);
      return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch (error) {
      return isoString;
    }
  }

  function buildReference() {
    const stamp = Date.now().toString().slice(-6);
    return `GHA-${stamp}-TP`;
  }

  function buildPoliceSummary(report) {
    return [
      "Anonymous Troski passenger report",
      `Reference: ${report.reference}`,
      `Incident: ${report.incidentType}`,
      `Vehicle: ${report.plate || "Not entered"}`,
      `Driver: ${report.driver || "Not verified"}`,
      `Route: ${report.route || "Not entered"}`,
      `Location: ${report.location || "Not entered"}`,
      `Time: ${report.occurredAtLabel || report.occurredAt}`,
      `Severity: ${report.dangerLevel}`,
      `Evidence attached: ${report.evidenceKinds.join(", ") || "None yet"}`,
      `Notes: ${report.details || "No extra notes"}`,
      "Prepared for Ghana Police Service / NRSA review.",
    ].join("\n");
  }

  function parseDvlaPayload(rawValue) {
    if (!rawValue) return null;
    const trimmed = rawValue.trim();

    if (DEMO_QR_PROFILES[trimmed]) {
      return DEMO_QR_PROFILES[trimmed];
    }

    try {
      const json = JSON.parse(trimmed);
      return normalizeProfile(json);
    } catch (error) {
      /* fall through */
    }

    const keyValuePairs = trimmed
      .split(/[;|]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .reduce((accumulator, part) => {
        const [rawKey, ...rawRest] = part.split("=");
        if (!rawKey || !rawRest.length) return accumulator;
        accumulator[rawKey.trim().toLowerCase()] = rawRest.join("=").trim();
        return accumulator;
      }, {});

    if (Object.keys(keyValuePairs).length) {
      return normalizeProfile({
        plate: keyValuePairs.plate || keyValuePairs.registration || keyValuePairs.reg,
        route: keyValuePairs.route,
        driver: keyValuePairs.driver,
        operator: keyValuePairs.operator || keyValuePairs.union,
        terminal: keyValuePairs.terminal,
        vehicleType: keyValuePairs.vehicletype || keyValuePairs.vehicle,
        location: keyValuePairs.location,
        verified: true,
      });
    }

    return null;
  }

  function normalizeProfile(profile) {
    if (!profile || !profile.plate) return null;
    return {
      plate: String(profile.plate).toUpperCase(),
      route: profile.route || "",
      driver: profile.driver || "",
      operator: profile.operator || "",
      terminal: profile.terminal || "",
      vehicleType: profile.vehicleType || "",
      location: profile.location || "",
      verified: Boolean(profile.verified),
    };
  }

  async function detectQrValue(file) {
    if (!window.BarcodeDetector) {
      throw new Error("QR scanning needs a browser with BarcodeDetector support.");
    }
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    const bitmap = await window.createImageBitmap(file);
    const results = await detector.detect(bitmap);
    if (bitmap.close) bitmap.close();
    if (!results.length) {
      throw new Error("No QR code was found in that image.");
    }
    return results[0].rawValue;
  }

  function MediaPreview({ item, onDelete, onSelect }) {
    return html`
      <article className="evidence-card">
        <button type="button" onClick=${() => onSelect(item)}>
          <div className=${item.kind === "audio" ? "audio-thumb" : "evidence-thumb"}>
            ${item.kind === "image" &&
            html`<img src=${item.previewUrl} alt=${item.name} loading="lazy" />`}
            ${item.kind === "video" &&
            html`<video src=${item.previewUrl} muted playsInline preload="metadata"></video>`}
            ${item.kind === "audio" &&
            html`
              <div className="wave-bars" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            `}
          </div>
          <div className="evidence-meta">
            <p className="evidence-title">${item.title}</p>
            <div className="evidence-row">
              <span className="tiny-text">${formatBytes(item.size)}</span>
              <span className=${`badge ${item.kind === "audio"
                ? "red"
                : item.kind === "video"
                ? "gold"
                : "green"}`}>
                ${item.kind}
              </span>
            </div>
          </div>
        </button>
        <button
          type="button"
          className="evidence-remove"
          aria-label=${`Remove ${item.title}`}
          onClick=${() => onDelete(item.id)}
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </article>
    `;
  }

  function MediaStage({ item }) {
    const videoRef = useRef(null);
    const [playing, setPlaying] = useState(true);
    const [progress, setProgress] = useState(32);
    const [timeLabel, setTimeLabel] = useState("Preview");

    useEffect(() => {
      setPlaying(true);
      setProgress(item && item.kind === "video" ? 0 : 32);
      setTimeLabel(item && item.kind === "video" ? "Loading..." : "Ready");
    }, [item]);

    function toggleVideo() {
      if (!videoRef.current) return;
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => null);
        setPlaying(true);
      } else {
        videoRef.current.pause();
        setPlaying(false);
      }
    }

    function handleTimeUpdate() {
      const node = videoRef.current;
      if (!node || !node.duration) return;
      const percent = (node.currentTime / node.duration) * 100;
      setProgress(Math.max(3, Math.min(percent, 100)));
      setTimeLabel(`${Math.floor(node.currentTime)}s / ${Math.ceil(node.duration)}s`);
    }

    function handleLoadedMetadata() {
      const node = videoRef.current;
      if (!node || !node.duration) return;
      setTimeLabel(`0s / ${Math.ceil(node.duration)}s`);
      node.play().catch(() => {
        setPlaying(false);
      });
    }

    if (!item) {
      return html`
        <section className="preview-card">
          <div className="preview-stage">
            <div className="preview-overlay">
              <div>
                <div className="badge gold">Live report composer</div>
                <h3 className="overlay-title">Capture first. Dispatch fast.</h3>
                <p className="player-copy">
                  Use the gold actions below to grab video, photo, or voice evidence without
                  leaving the report flow.
                </p>
              </div>
              <div>
                <div className="progress-track">
                  <div className="progress-fill" style=${{ width: "42%" }}></div>
                </div>
                <div className="player-controls">
                  <span>Police-ready overlay</span>
                  <span>Gold timeline</span>
                </div>
              </div>
            </div>
            <div className="road-lines" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </section>
      `;
    }

    return html`
      <section className="preview-card">
        <div className="preview-head">
          <div>
            <div className="badge ${item.kind === "audio" ? "red" : "gold"}">
              ${item.kind === "audio" ? "Voice evidence" : "Evidence player"}
            </div>
            <h3 className="sheet-title">${item.title}</h3>
          </div>
          <span className="tiny-text">${formatBytes(item.size)}</span>
        </div>
        <div className="preview-stage">
          ${item.kind === "image" && html`<img src=${item.previewUrl} alt=${item.name} />`}
          ${item.kind === "video" &&
          html`
            <video
              ref=${videoRef}
              src=${item.previewUrl}
              playsInline
              muted
              preload="metadata"
              onTimeUpdate=${handleTimeUpdate}
              onLoadedMetadata=${handleLoadedMetadata}
            ></video>
          `}
          <div className="preview-overlay">
            <div>
              <div className="badge-row">
                <div className=${`badge ${item.kind === "audio" ? "red" : "gold"}`}>
                  ${item.kind === "audio" ? "Audio" : item.kind === "video" ? "Video" : "Photo"}
                </div>
                <div className="badge green">Anonymous</div>
              </div>
              <h3 className="overlay-title">${item.kind === "audio"
                ? "Passenger voice note"
                : item.kind === "video"
                ? "Road evidence preview"
                : "Still capture"}</h3>
              <p className="player-copy">
                ${item.kind === "audio"
                  ? "Audio evidence is kept on-device until the report packet is shared."
                  : "Preview the key evidence before packaging it for the police or WhatsApp dispatch."}
              </p>
            </div>
            <div>
              <div className="player-center">
                ${item.kind === "audio"
                  ? html`
                      <div className="audio-thumb" style=${{ width: "100%", height: "110px" }}>
                        <div className="wave-bars" aria-hidden="true">
                          <span></span>
                          <span></span>
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    `
                  : html`
                      <button type="button" className="player-play" onClick=${toggleVideo}>
                        <span className="material-symbols-outlined">
                          ${item.kind === "video" && playing ? "pause" : "play_arrow"}
                        </span>
                      </button>
                    `}
              </div>
              <div className="progress-track">
                <div className="progress-fill" style=${{ width: `${progress}%` }}></div>
              </div>
              <div className="player-controls">
                <span>${timeLabel}</span>
                <span>${item.kind === "audio" ? "Attach on share" : "Tap preview to inspect"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function App() {
    const photoRef = useRef(null);
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const qrRef = useRef(null);

    const [activeTab, setActiveTab] = useState("home");
    const [form, setForm] = useState(() => {
      const saved = safeRead(DRAFT_KEY, null);
      return saved && saved.form ? { ...createDefaultForm(), ...saved.form } : createDefaultForm();
    });
    const [vehicleProfile, setVehicleProfile] = useState(() => {
      const saved = safeRead(DRAFT_KEY, null);
      return saved && saved.vehicleProfile ? saved.vehicleProfile : null;
    });
    const [reports, setReports] = useState(() => safeRead(STORAGE_KEY, []));
    const [evidence, setEvidence] = useState([]);
    const [selectedEvidenceId, setSelectedEvidenceId] = useState(null);
    const [scanInput, setScanInput] = useState("");
    const [scanMessage, setScanMessage] = useState({
      tone: "info",
      text: "Scan the DVLA QR or paste a demo payload to auto-fill the car and driver details.",
    });
    const [toast, setToast] = useState(null);
    const [latestBundle, setLatestBundle] = useState(null);

    useEffect(() => {
      safeWrite(STORAGE_KEY, reports);
    }, [reports]);

    useEffect(() => {
      safeWrite(DRAFT_KEY, { form, vehicleProfile });
    }, [form, vehicleProfile]);

    useEffect(() => {
      if (!toast) return undefined;
      const timer = window.setTimeout(() => setToast(null), 3200);
      return () => window.clearTimeout(timer);
    }, [toast]);

    const allReports = [...reports, ...SAMPLE_HISTORY];

    const selectedEvidence =
      evidence.find((item) => item.id === selectedEvidenceId) || evidence[0] || null;

    const readinessChecks = [
      form.plate.trim().length > 0,
      form.location.trim().length > 0,
      form.details.trim().length > 0,
      Boolean(form.occurredAt),
      evidence.length > 0,
      Boolean(vehicleProfile),
    ];
    const readiness = Math.round(
      (readinessChecks.filter(Boolean).length / readinessChecks.length) * 100
    );

    function showToast(message, tone) {
      setToast({ message, tone });
    }

    function openInput(kind) {
      if (kind === "photo" && photoRef.current) photoRef.current.click();
      if (kind === "video" && videoRef.current) videoRef.current.click();
      if (kind === "audio" && audioRef.current) audioRef.current.click();
      setActiveTab("capture");
    }

    function upsertForm(patch) {
      setForm((current) => ({ ...current, ...patch }));
    }

    function createEvidenceItem(file, kind) {
      const previewUrl = URL.createObjectURL(file);
      const titles = {
        image: "Plate snapshot",
        video: "Road clip",
        audio: "Passenger audio note",
      };
      return {
        id: `${kind}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        kind,
        file,
        name: file.name,
        title: titles[kind] || file.name,
        size: file.size,
        previewUrl,
      };
    }

    function handleEvidenceChange(kind, event) {
      const files = Array.from(event.target.files || []);
      if (!files.length) return;
      const nextItems = files.map((file) => createEvidenceItem(file, kind));
      setEvidence((current) => [...nextItems, ...current]);
      setSelectedEvidenceId(nextItems[0].id);
      showToast(`${nextItems.length} ${kind} evidence item added.`, "success");
      event.target.value = "";
    }

    function removeEvidence(id) {
      setEvidence((current) => {
        const match = current.find((item) => item.id === id);
        if (match && match.previewUrl) URL.revokeObjectURL(match.previewUrl);
        const next = current.filter((item) => item.id !== id);
        if (selectedEvidenceId === id) {
          setSelectedEvidenceId(next[0] ? next[0].id : null);
        }
        return next;
      });
    }

    function applyVehicleProfile(profile) {
      if (!profile) return;
      setVehicleProfile(profile);
      setForm((current) => ({
        ...current,
        plate: profile.plate || current.plate,
        route: profile.route || current.route,
        terminal: profile.terminal || current.terminal,
        location: current.location || profile.location || "",
      }));
      setScanMessage({
        tone: "success",
        text: `DVLA profile loaded for ${profile.plate}. Driver and route details have been auto-filled.`,
      });
      showToast(`Vehicle profile loaded for ${profile.plate}.`, "success");
    }

    async function handleQrFile(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      setScanMessage({ tone: "info", text: "Scanning the uploaded QR code..." });
      try {
        const qrValue = await detectQrValue(file);
        const profile = parseDvlaPayload(qrValue);
        if (!profile) {
          throw new Error("That QR code was detected, but the payload did not match the DVLA demo format.");
        }
        applyVehicleProfile(profile);
      } catch (error) {
        setScanMessage({
          tone: "error",
          text: error.message || "QR scan failed. Use the demo payload or enter the vehicle manually.",
        });
        showToast("QR scan could not auto-fill this browser. Try the demo payload.", "error");
      }
      event.target.value = "";
    }

    function handleDemoScan() {
      const profile = parseDvlaPayload(scanInput);
      if (!profile) {
        setScanMessage({
          tone: "error",
          text: "Paste a valid demo payload such as DVLA:GT-4451-24 or a JSON object with plate, route, and driver.",
        });
        showToast("Demo payload not recognised.", "error");
        return;
      }
      applyVehicleProfile(profile);
    }

    function loadSampleQr(key) {
      setScanInput(key);
      const profile = parseDvlaPayload(key);
      if (profile) {
        applyVehicleProfile(profile);
      }
    }

    function useCurrentLocation() {
      if (!navigator.geolocation) {
        showToast("Geolocation is not supported on this browser.", "error");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
          upsertForm({ location: coords });
          showToast("Current GPS coordinates added.", "success");
        },
        () => {
          showToast("Location permission was denied.", "error");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    function resetDraft() {
      evidence.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setEvidence([]);
      setSelectedEvidenceId(null);
      setVehicleProfile(null);
      setForm(createDefaultForm());
      setScanInput("");
      setLatestBundle(null);
      setActiveTab("home");
      setScanMessage({
        tone: "info",
        text: "Start a new anonymous report or scan a DVLA QR to auto-fill vehicle details.",
      });
      showToast("Draft cleared for a new report.", "info");
    }

    function createReportPacket() {
      if (!form.plate.trim() || !form.location.trim() || !form.details.trim()) {
        showToast("Add the plate, location, and incident details before packaging the report.", "error");
        return;
      }

      const report = {
        reference: buildReference(),
        status: "Packet Ready",
        statusTone: "gold",
        incidentType: form.incidentType,
        plate: form.plate.trim().toUpperCase(),
        route: form.route.trim() || vehicleProfile?.route || "Route not added",
        location: form.location.trim(),
        terminal: form.terminal.trim() || vehicleProfile?.terminal || "Not entered",
        occurredAt: form.occurredAt,
        occurredAtLabel: humanTime(form.occurredAt),
        details: form.details.trim(),
        dangerLevel: form.dangerLevel,
        createdAt: humanTime(new Date().toISOString()),
        evidenceCount: evidence.length,
        evidenceKinds: evidence.map((item) => item.kind),
        driver: vehicleProfile?.driver || "Not verified",
        operator: vehicleProfile?.operator || "Not provided",
        anonymous: form.anonymous,
      };

      setReports((current) => [report, ...current].slice(0, 8));
      setLatestBundle({ report, evidence: [...evidence] });
      setActiveTab("cases");
      showToast("Report packet created. Share it with the police or open WhatsApp.", "success");
    }

    async function shareLatestPacket() {
      const packet = latestBundle;
      if (!packet) {
        showToast("Create the report packet first.", "error");
        return;
      }
      const text = buildPoliceSummary(packet.report);
      const shareData = {
        title: `${packet.report.reference} • Troski Watch`,
        text,
      };
      const files = packet.evidence.map((item) => item.file).filter(Boolean);

      if (files.length && navigator.canShare && navigator.canShare({ files })) {
        shareData.files = files;
      }

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          showToast("Share sheet opened with the report packet.", "success");
          return;
        } catch (error) {
          if (error && error.name === "AbortError") return;
        }
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          showToast("Report summary copied. Attach the media in WhatsApp.", "success");
          return;
        } catch (error) {
          /* fall through */
        }
      }

      showToast("Sharing is not available here. Use the WhatsApp button instead.", "error");
    }

    const whatsappHref = latestBundle
      ? `https://wa.me/233206639121?text=${encodeURIComponent(buildPoliceSummary(latestBundle.report))}`
      : "https://wa.me/233206639121";

    return html`
      <div className="mobile-frame">
        ${toast &&
        html`
          <div className=${`toast ${toast.tone || "info"}`}>
            <span className="material-symbols-outlined">
              ${toast.tone === "error"
                ? "error"
                : toast.tone === "success"
                ? "verified"
                : "info"}
            </span>
            <div>${toast.message}</div>
          </div>
        `}
        <div className="app-shell">
          <section className="stack" data-delay="0">
            <div className="hero">
              <div className="hero-header">
                <div className="brand-mark">
                  <${StarIcon} />
                  <div>
                    <div className="brand-pill">
                      <span className="live-dot"></span>
                      anonymous civic stream
                    </div>
                    <p className="nav-brand">Troski Watch</p>
                  </div>
                </div>
                <div className="icon-badge">
                  <span className="material-symbols-outlined">local_police</span>
                </div>
              </div>

              <h1>Report reckless driving before the next stop.</h1>
              <p className="hero-copy">
                A mobile-only MVP for Troski passengers in Ghana to capture evidence, stay
                anonymous, and package the report for the Ghana Police Service.
              </p>

              <div className="flag-band" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="hero-grid">
                <div className="hero-card">
                  <div className="badge-row">
                    <div className="badge red">Live route</div>
                    <div className="badge green">Police-ready</div>
                  </div>
                  <div className="hero-stage">
                    <div className="preview-overlay">
                      <div>
                        <h3 className="overlay-title">Fast capture lane</h3>
                        <p className="player-copy">
                          Video, photo, voice, and QR scan all stay in one cinematic mobile flow.
                        </p>
                      </div>
                      <div>
                        <div className="progress-track">
                          <div className="progress-fill" style=${{ width: `${readiness}%` }}></div>
                        </div>
                        <div className="player-controls">
                          <span>${readiness}% report ready</span>
                          <span>${evidence.length} evidence item${evidence.length === 1 ? "" : "s"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="road-lines" aria-hidden="true">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>

                <div className="hero-subcard">
                  <div className="metric-tile">
                    <div className="metric-label">today's ready packets</div>
                    <div className="metric-value gold">${String(reports.length).padStart(2, "0")}</div>
                  </div>
                  <div className="metric-tile">
                    <div className="metric-label">active evidence items</div>
                    <div className="metric-value green">${String(evidence.length).padStart(2, "0")}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          ${activeTab === "home" &&
          html`
            <section className="stack" data-delay="1">
              <div className="section-header">
                <h2 className="section-title">Trending in Accra</h2>
                <span className="section-link">
                  live roads
                  <span className="material-symbols-outlined">arrow_forward</span>
                </span>
              </div>
              <div className="row-scroll">
                ${HOTSPOTS.map(
                  (spot) => html`
                    <article key=${spot.title} className="hotspot-card">
                      <div className="badge-row">
                        <span className=${`hotspot-tag ${spot.tone}`}>${spot.tag}</span>
                      </div>
                      <div>
                        <h3 className="card-title">${spot.title}</h3>
                        <p className="card-copy">${spot.copy}</p>
                      </div>
                    </article>
                  `
                )}
              </div>
            </section>

            <section className="stack" data-delay="2">
              <div className="section-header">
                <h2 className="section-title">Vehicle Capture</h2>
                <button type="button" className="section-link" onClick=${() => qrRef.current && qrRef.current.click()}>
                  scan qr
                  <span className="material-symbols-outlined">qr_code_scanner</span>
                </button>
              </div>
              <article className="scan-card">
                <div className="scan-stage">
                  <div className="preview-overlay">
                    <div>
                      <div className=${`badge ${scanMessage.tone === "error"
                        ? "red"
                        : scanMessage.tone === "success"
                        ? "green"
                        : "gold"}`}>
                        ${scanMessage.tone === "error"
                          ? "scan issue"
                          : scanMessage.tone === "success"
                          ? "profile loaded"
                          : "scan ready"}
                      </div>
                      <h3 className="sheet-title">DVLA QR auto-fill</h3>
                      <p className="player-copy">${scanMessage.text}</p>
                    </div>
                    <div className="scan-rail">
                      <span className="badge gold">QR on every troski</span>
                      <span className="badge">No backend needed</span>
                      <span className="badge green">Driver details auto-filled</span>
                    </div>
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field-block">
                    <label className="field-label" htmlFor="demo-qr">Demo QR payload</label>
                    <input
                      id="demo-qr"
                      className="demo-input"
                      type="text"
                      value=${scanInput}
                      onChange=${(event) => setScanInput(event.target.value)}
                      placeholder="DVLA:GT-4451-24"
                    />
                  </div>

                  <div className="button-row">
                    <button type="button" className="cta" onClick=${handleDemoScan}>
                      <span className="material-symbols-outlined">auto_fix_high</span>
                      Auto-fill
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick=${() => loadSampleQr("DVLA:GT-4451-24")}
                    >
                      <span className="material-symbols-outlined">bolt</span>
                      Load sample
                    </button>
                  </div>
                </div>

                ${vehicleProfile &&
                html`
                  <article className="surface-card">
                    <div className="card-header">
                      <div>
                        <div className="badge green">
                          <${StarIcon} />
                          verified vehicle
                        </div>
                        <h3 className="sheet-title">${vehicleProfile.plate}</h3>
                      </div>
                      <span className="tiny-text">${vehicleProfile.vehicleType || "Troski"}</span>
                    </div>
                    <div className="summary-grid">
                      <div className="summary-pill">
                        <span className="mini-label">Driver</span>
                        <strong>${vehicleProfile.driver || "Unknown"}</strong>
                      </div>
                      <div className="summary-pill">
                        <span className="mini-label">Route</span>
                        <strong>${vehicleProfile.route || "Unknown"}</strong>
                      </div>
                      <div className="summary-pill">
                        <span className="mini-label">Union</span>
                        <strong>${vehicleProfile.operator || "Unknown"}</strong>
                      </div>
                    </div>
                  </article>
                `}
              </article>
            </section>

            <section className="stack" data-delay="3">
              <div className="section-header">
                <h2 className="section-title">Incident Details</h2>
                <button type="button" className="section-link" onClick=${useCurrentLocation}>
                  use gps
                  <span className="material-symbols-outlined">near_me</span>
                </button>
              </div>
              <article className="detail-card">
                <div className="chip-grid">
                  ${INCIDENT_TYPES.map(
                    (type) => html`
                      <button
                        key=${type}
                        type="button"
                        className=${`chip ${form.incidentType === type ? "active" : ""}`}
                        onClick=${() => upsertForm({ incidentType: type })}
                      >
                        ${type}
                      </button>
                    `
                  )}
                </div>

                <div className="field-grid two">
                  <div className="field-block">
                    <label className="field-label" htmlFor="plate">Vehicle number</label>
                    <input
                      id="plate"
                      className="field"
                      type="text"
                      value=${form.plate}
                      onChange=${(event) => upsertForm({ plate: event.target.value.toUpperCase() })}
                      placeholder="GT-1234-26"
                    />
                  </div>
                  <div className="field-block">
                    <label className="field-label" htmlFor="when">Date and time</label>
                    <input
                      id="when"
                      className="field"
                      type="datetime-local"
                      value=${form.occurredAt}
                      onChange=${(event) => upsertForm({ occurredAt: event.target.value })}
                    />
                  </div>
                </div>

                <div className="field-grid two">
                  <div className="field-block">
                    <label className="field-label" htmlFor="route">Route</label>
                    <input
                      id="route"
                      className="field"
                      type="text"
                      value=${form.route}
                      onChange=${(event) => upsertForm({ route: event.target.value })}
                      placeholder="Circle to Achimota"
                    />
                  </div>
                  <div className="field-block">
                    <label className="field-label" htmlFor="terminal">Terminal</label>
                    <input
                      id="terminal"
                      className="field"
                      type="text"
                      value=${form.terminal}
                      onChange=${(event) => upsertForm({ terminal: event.target.value })}
                      placeholder="Achimota New Station"
                    />
                  </div>
                </div>

                <div className="field-block">
                  <label className="field-label" htmlFor="location">Location</label>
                  <input
                    id="location"
                    className="field"
                    type="text"
                    value=${form.location}
                    onChange=${(event) => upsertForm({ location: event.target.value })}
                    placeholder="Circle-Achimota Road or GPS coordinates"
                  />
                </div>

                <div className="field-grid two">
                  <div className="field-block">
                    <label className="field-label" htmlFor="danger">Danger level</label>
                    <div className="select-wrap">
                      <select
                        id="danger"
                        className="select-field"
                        value=${form.dangerLevel}
                        onChange=${(event) => upsertForm({ dangerLevel: event.target.value })}
                      >
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical</option>
                      </select>
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="field-block">
                  <label className="field-label" htmlFor="details">What happened?</label>
                  <textarea
                    id="details"
                    className="textarea"
                    value=${form.details}
                    onChange=${(event) => upsertForm({ details: event.target.value })}
                    placeholder="Describe the overspeeding, dangerous lane change, abuse, or any immediate risk to passengers."
                  ></textarea>
                </div>

                <div className="toggle-row">
                  <div className="toggle-copy">
                    <strong>Anonymous mode stays on</strong>
                    <span className="tiny-text">
                      This MVP does not ask for passenger identity before packaging the report.
                    </span>
                  </div>
                  <button
                    type="button"
                    className=${`toggle ${form.anonymous ? "active" : ""}`}
                    onClick=${() => upsertForm({ anonymous: !form.anonymous })}
                    aria-label="Toggle anonymous mode"
                  ></button>
                </div>
              </article>
            </section>
          `}

          ${activeTab === "capture" &&
          html`
            <section className="stack" data-delay="1">
              <div className="section-header">
                <h2 className="section-title">Evidence Lane</h2>
                <span className="section-link">
                  streaming-style preview
                  <span className="material-symbols-outlined">play_circle</span>
                </span>
              </div>
              <${MediaStage} item=${selectedEvidence} />
            </section>

            <section className="stack" data-delay="2">
              <div className="section-header">
                <h2 className="section-title">Capture Actions</h2>
                <button type="button" className="section-link" onClick=${useCurrentLocation}>
                  add gps
                  <span className="material-symbols-outlined">location_on</span>
                </button>
              </div>
              <div className="row-scroll">
                <article className="quick-card">
                  <div className="card-header">
                    <div className="icon-badge">
                      <span className="material-symbols-outlined">videocam</span>
                    </div>
                    <span className="badge gold">record motion</span>
                  </div>
                  <div>
                    <h3 className="card-title">Record video</h3>
                    <p className="card-copy">
                      Use the back camera to capture overspeeding, swerving, or dangerous
                      overtaking.
                    </p>
                  </div>
                  <button type="button" className="cta" onClick=${() => openInput("video")}>
                    <span className="material-symbols-outlined">play_arrow</span>
                    Open camera
                  </button>
                </article>

                <article className="quick-card">
                  <div className="card-header">
                    <div className="icon-badge">
                      <span className="material-symbols-outlined">photo_camera</span>
                    </div>
                    <span className="badge green">plate focus</span>
                  </div>
                  <div>
                    <h3 className="card-title">Take photo</h3>
                    <p className="card-copy">
                      Snap the plate, station code, or cabin situation for clear still evidence.
                    </p>
                  </div>
                  <button type="button" className="cta" onClick=${() => openInput("photo")}>
                    <span className="material-symbols-outlined">camera</span>
                    Capture
                  </button>
                </article>

                <article className="quick-card">
                  <div className="card-header">
                    <div className="icon-badge">
                      <span className="material-symbols-outlined">mic</span>
                    </div>
                    <span className="badge red">voice memo</span>
                  </div>
                  <div>
                    <h3 className="card-title">Record audio</h3>
                    <p className="card-copy">
                      Leave a short anonymous narration while the incident is still fresh.
                    </p>
                  </div>
                  <button type="button" className="cta" onClick=${() => openInput("audio")}>
                    <span className="material-symbols-outlined">radio_button_checked</span>
                    Start note
                  </button>
                </article>
              </div>
            </section>

            <section className="stack" data-delay="3">
              <div className="section-header">
                <h2 className="section-title">Captured Evidence</h2>
                <span className="section-link">${evidence.length} item${evidence.length === 1 ? "" : "s"}</span>
              </div>
              ${evidence.length
                ? html`
                    <div className="evidence-grid">
                      ${evidence.map(
                        (item) => html`
                          <${MediaPreview}
                            key=${item.id}
                            item=${item}
                            onDelete=${removeEvidence}
                            onSelect=${(match) => setSelectedEvidenceId(match.id)}
                          />
                        `
                      )}
                    </div>
                  `
                : html`
                    <div className="empty-state">
                      Evidence has not been added yet. Use the gold capture buttons to grab video,
                      photo, or audio directly from a phone camera or microphone.
                    </div>
                  `}
            </section>
          `}

          ${activeTab === "cases" &&
          html`
            <section className="stack" data-delay="1">
              <div className="section-header">
                <h2 className="section-title">Police Packet</h2>
                <button type="button" className="section-link" onClick=${resetDraft}>
                  new report
                  <span className="material-symbols-outlined">add_circle</span>
                </button>
              </div>
              <article className="summary-card">
                ${latestBundle
                  ? html`
                      <div className="card-header">
                        <div>
                          <div className="badge gold">packet ready</div>
                          <h3 className="sheet-title">${latestBundle.report.reference}</h3>
                        </div>
                        <span className="status-pill gold">${latestBundle.report.status}</span>
                      </div>
                      <p className="detail-copy">
                        ${latestBundle.report.plate} • ${latestBundle.report.incidentType} •
                        ${latestBundle.report.location}
                      </p>
                      <div className="summary-grid">
                        <div className="summary-pill">
                          <span className="mini-label">Evidence</span>
                          <strong>${latestBundle.report.evidenceCount}</strong>
                        </div>
                        <div className="summary-pill">
                          <span className="mini-label">Driver</span>
                          <strong>${latestBundle.report.driver}</strong>
                        </div>
                        <div className="summary-pill">
                          <span className="mini-label">Danger</span>
                          <strong>${latestBundle.report.dangerLevel}</strong>
                        </div>
                      </div>
                      <div className="button-row">
                        <button type="button" className="cta" onClick=${shareLatestPacket}>
                          <span className="material-symbols-outlined">share</span>
                          Share packet
                        </button>
                        <a className="ghost-btn" href=${whatsappHref} target="_blank" rel="noreferrer">
                          <span className="material-symbols-outlined">chat</span>
                          WhatsApp police
                        </a>
                      </div>
                    `
                  : html`
                      <div className="empty-state">
                        Create the report packet from the Home or Capture tab. Once ready, this
                        screen becomes the police handoff dashboard.
                      </div>
                    `}
              </article>
            </section>

            <section className="stack" data-delay="2">
              <div className="section-header">
                <h2 className="section-title">Dispatch Timeline</h2>
                <a className="section-link" href="tel:191">
                  call 191
                  <span className="material-symbols-outlined">phone</span>
                </a>
              </div>
              <article className="status-card">
                <div className="timeline-list">
                  <div className="timeline-item">
                    <div className="timeline-track">
                      <span className="status-dot gold"></span>
                    </div>
                    <div>
                      <p className="timeline-title">1. Evidence captured locally</p>
                      <p className="timeline-copy">
                        Video, photo, and audio stay on-device until the user decides to share.
                      </p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-track">
                      <span className="status-dot green"></span>
                    </div>
                    <div>
                      <p className="timeline-title">2. Report packet created</p>
                      <p className="timeline-copy">
                        Summary text is packaged with plate, time, route, and location.
                      </p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-track">
                      <span className="status-dot red"></span>
                    </div>
                    <div>
                      <p className="timeline-title">3. Ghana Police / NRSA handoff</p>
                      <p className="timeline-copy">
                        Use the share sheet, WhatsApp, or a direct emergency call depending on the
                        severity.
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </section>

            <section className="stack" data-delay="3">
              <div className="section-header">
                <h2 className="section-title">Recent Packets</h2>
                <span className="section-link">${allReports.length} total cards</span>
              </div>
              <div className="stack" data-delay="0">
                ${allReports.map(
                  (report) => html`
                    <article key=${report.reference} className="history-card">
                      <div className="history-row">
                        <div>
                          <div className="history-tag">${report.reference}</div>
                          <h3 className="history-title">${report.incidentType}</h3>
                        </div>
                        <span className=${`status-pill ${report.statusTone || "gold"}`}>
                          ${report.status}
                        </span>
                      </div>
                      <p className="history-copy">
                        ${report.plate} • ${report.route} • ${report.location}
                      </p>
                      <div className="history-meta">
                        <span className="badge">${report.createdAt}</span>
                        <span className="badge gold">${report.evidenceCount} evidence</span>
                        <span className="badge green">${report.notes || report.driver}</span>
                      </div>
                    </article>
                  `
                )}
              </div>
            </section>
          `}

          ${activeTab === "help" &&
          html`
            <section className="stack" data-delay="1">
              <div className="section-header">
                <h2 className="section-title">Official Channels</h2>
                <span className="section-link">
                  Ghana response
                  <span className="material-symbols-outlined">verified_user</span>
                </span>
              </div>
              <div className="stack" data-delay="0">
                ${OFFICIAL_CHANNELS.map(
                  (channel) => html`
                    <article key=${channel.number} className="hotline-card">
                      <div className="hotline-header">
                        <div>
                          <span className=${`badge ${channel.tone}`}>${channel.title}</span>
                          <h3 className="hotline-number">${channel.number}</h3>
                        </div>
                        <div className="icon-badge">
                          <span className="material-symbols-outlined">${channel.icon}</span>
                        </div>
                      </div>
                      <p className="hotline-copy">${channel.copy}</p>
                      <a className="cta" href=${channel.href} target="_blank" rel="noreferrer">
                        <span className="material-symbols-outlined">call</span>
                        Open channel
                      </a>
                    </article>
                  `
                )}
              </div>
            </section>

            <section className="stack" data-delay="2">
              <div className="section-header">
                <h2 className="section-title">What to include</h2>
              </div>
              <article className="tip-card">
                <div className="timeline-list">
                  <div className="timeline-item">
                    <div className="timeline-track">
                      <span className="status-dot gold"></span>
                    </div>
                    <div>
                      <p className="timeline-title">Vehicle registration number</p>
                      <p className="timeline-copy">
                        Type it manually or scan the DVLA QR to populate the bus, driver, and route.
                      </p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-track">
                      <span className="status-dot green"></span>
                    </div>
                    <div>
                      <p className="timeline-title">Date, time, and exact location</p>
                      <p className="timeline-copy">
                        Use the GPS shortcut if you cannot type the exact road or station name.
                      </p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-track">
                      <span className="status-dot red"></span>
                    </div>
                    <div>
                      <p className="timeline-title">Evidence and short notes</p>
                      <p className="timeline-copy">
                        Add a photo, short video, or passenger voice note to help investigators.
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </section>

            <section className="stack" data-delay="3">
              <div className="section-header">
                <h2 className="section-title">Legal context</h2>
              </div>
              <article className="status-card">
                <p className="legal-copy">
                  Ghana passengers are encouraged to report overspeeding and reckless driving. For
                  immediate danger call 191. Government vehicles can also be reported on 1526. This
                  MVP keeps the passenger anonymous and prepares a shareable packet instead of
                  sending directly to a backend.
                </p>
                <div className="summary-grid">
                  <div className="summary-pill">
                    <span className="mini-label">Police</span>
                    <strong>191</strong>
                  </div>
                  <div className="summary-pill">
                    <span className="mini-label">Ambulance</span>
                    <strong>193</strong>
                  </div>
                  <div className="summary-pill">
                    <span className="mini-label">Fire</span>
                    <strong>192</strong>
                  </div>
                </div>
              </article>
            </section>
          `}

          <div className="sticky-composer">
            <div className="composer-head">
              <div className="composer-copy">
                <span className="mini-label">report readiness</span>
                <strong>${readiness}% complete</strong>
              </div>
              <div className="ring" style=${{ "--value": readiness }}>
                ${readiness}%
              </div>
            </div>
            <div className="composer-actions">
              <button type="button" className="ghost-btn" onClick=${() => setActiveTab("capture")}>
                <span className="material-symbols-outlined">add_a_photo</span>
                ${evidence.length ? `${evidence.length} evidence` : "Add evidence"}
              </button>
              <button type="button" className="cta" onClick=${createReportPacket}>
                <span className="material-symbols-outlined">send</span>
                Prepare packet
              </button>
            </div>
          </div>

          <input
            ref=${photoRef}
            className="hidden-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange=${(event) => handleEvidenceChange("image", event)}
          />
          <input
            ref=${videoRef}
            className="hidden-input"
            type="file"
            accept="video/*"
            capture="environment"
            onChange=${(event) => handleEvidenceChange("video", event)}
          />
          <input
            ref=${audioRef}
            className="hidden-input"
            type="file"
            accept="audio/*"
            capture
            onChange=${(event) => handleEvidenceChange("audio", event)}
          />
          <input
            ref=${qrRef}
            className="hidden-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange=${handleQrFile}
          />
        </div>

        <nav className="bottom-nav" aria-label="Primary navigation">
          <div className="nav-panel">
            <button
              type="button"
              className=${`nav-item ${activeTab === "home" ? "active" : ""}`}
              onClick=${() => setActiveTab("home")}
            >
              <div className="nav-icon"><${StarIcon} /></div>
              <span className="nav-text">Home</span>
            </button>
            <button
              type="button"
              className=${`nav-item ${activeTab === "capture" ? "active" : ""}`}
              onClick=${() => setActiveTab("capture")}
            >
              <div className="nav-icon">
                <span className="material-symbols-outlined">videocam</span>
              </div>
              <span className="nav-text">Capture</span>
            </button>
            <button
              type="button"
              className=${`nav-item ${activeTab === "cases" ? "active" : ""}`}
              onClick=${() => setActiveTab("cases")}
            >
              <div className="nav-icon">
                <span className="material-symbols-outlined">folder_shared</span>
              </div>
              <span className="nav-text">Packets</span>
            </button>
            <button
              type="button"
              className=${`nav-item ${activeTab === "help" ? "active" : ""}`}
              onClick=${() => setActiveTab("help")}
            >
              <div className="nav-icon">
                <span className="material-symbols-outlined">call</span>
              </div>
              <span className="nav-text">Help</span>
            </button>
          </div>
        </nav>

        <aside className="desktop-note">
          <strong>Mobile MVP</strong>
          This prototype is optimized for phone width. On a real device the camera, microphone,
          file capture, share sheet, phone calls, and WhatsApp handoff are the core demo moments.
        </aside>
      </div>
    `;
  }

  const root = ReactDOM.createRoot(document.getElementById("app"));
  root.render(html`<${App} />`);
})();
