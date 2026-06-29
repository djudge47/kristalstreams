const fs = require("fs");
let f = fs.readFileSync("src/pages/Dashboard.tsx", "utf8");

// Add resolvedStreamUrl state
f = f.replace(
  "const [selectedChannel, setSelectedChannel] = useState<any>(null);",
  "const [selectedChannel, setSelectedChannel] = useState<any>(null);\n  const [resolvedStreamUrl, setResolvedStreamUrl] = useState<string | null>(null);"
);

// Add resolve-stream effect before channel fetch
f = f.replace(
  "}, [navigate]);\n\n  useEffect(() => {\n    if (showPlayer",
  "}, [navigate]);\n\n  useEffect(() => {\n    if (selectedChannel?.stream_url) {\n      setResolvedStreamUrl(null);\n      fetch('/api/resolve-stream', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ url: selectedChannel.stream_url }),\n      })\n        .then(r => r.json())\n        .then(data => setResolvedStreamUrl(data.url))\n        .catch(() => setResolvedStreamUrl(selectedChannel.stream_url.replace('http://', 'https://').replace(':80/', '/')));\n    }\n  }, [selectedChannel]);\n\n  useEffect(() => {\n    if (showPlayer"
);

// Replace VideoPlayer src
f = f.replace(
  "src={selectedChannel.stream_url?.replace('http://', 'https://')}",
  "src={resolvedStreamUrl || ''}"
);

fs.writeFileSync("src/pages/Dashboard.tsx", f);
console.log("Dashboard patched successfully");
