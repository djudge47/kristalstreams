const fs = require("fs");
let f = fs.readFileSync("src/pages/Dashboard.tsx", "utf8");

f = f.replace(
  'src={resolvedStreamUrl || ""}\n                  title={selectedChannel.name}\n                  autoplay={true}\n                />',
  'src={resolvedStreamUrl}\n                    title={selectedChannel.name}\n                    autoplay={true}\n                  />'
);

f = f.replace(
  "src={resolvedStreamUrl || ''}\n                  title={selectedChannel.name}\n                  autoplay={true}\n                />",
  "src={resolvedStreamUrl}\n                    title={selectedChannel.name}\n                    autoplay={true}\n                  />"
);

// Wrap VideoPlayer in a loading check
var old1 = '<VideoPlayer\n                  src={resolvedStreamUrl}\n                    title={selectedChannel.name}\n                    autoplay={true}\n                  />';
var new1 = '{resolvedStreamUrl ? (\n                  <VideoPlayer\n                    src={resolvedStreamUrl}\n                    title={selectedChannel.name}\n                    autoplay={true}\n                  />\n                ) : (\n                  <div className="aspect-video bg-black rounded-lg flex items-center justify-center">\n                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>\n                  </div>\n                )}';

if (f.includes(old1)) {
  f = f.replace(old1, new1);
  console.log("Replaced with loading guard");
} else {
  // Try alternate format
  var old2 = "src={resolvedStreamUrl || ''}";
  var new2 = "src={resolvedStreamUrl}";
  if (f.includes(old2)) {
    f = f.replace(old2, new2);
    console.log("Fixed src attribute");
  } else {
    console.log("Could not find pattern to replace. Current VideoPlayer src:");
    var match = f.match(/src=\{resolvedStreamUrl[^}]*\}/);
    console.log(match ? match[0] : "NOT FOUND");
  }
}

fs.writeFileSync("src/pages/Dashboard.tsx", f);
console.log("Done");
