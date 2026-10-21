"""Generate a bounded, in-place logout patch from the reviewed legacy APK.

No APK, key or customer data is embedded in the resulting Windows updater.
The updater accepts only the reviewed DEX/layout hashes and preserves every
other payload in the user's selected current artwork APK.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import struct
import zipfile
import zlib
from pathlib import Path

PACKAGE = "com.gearzoneiptv.gearzoneiptviptvbox"
DEX_SHA = "23674b1585afee49576a95a189857a6dc4b004a6ebfb4509f8a7bc5b5b884227"
CERT_SHA = "459b8227b6f703202277cbb8aca96c33f968fbfc45b2000cf115d6d1cb6dfe57"
TARGET_VERSION = 2026102002


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def u16(data, pos):
    return struct.unpack_from("<H", data, pos)[0]


def u32(data, pos):
    return struct.unpack_from("<I", data, pos)[0]


def uleb(data, pos):
    out = shift = 0
    for _ in range(5):
        value = data[pos]
        pos += 1
        out |= (value & 127) << shift
        if value < 128:
            return out, pos
        shift += 7
    raise ValueError("Invalid ULEB128")


class Dex:
    def __init__(self, data: bytes):
        if data[:8] != b"dex\n035\0" or u32(data, 32) != len(data):
            raise ValueError("Unexpected DEX format")
        self.data = data
        self.strings = []
        for i in range(u32(data, 56)):
            pos = u32(data, u32(data, 60) + i * 4)
            _, pos = uleb(data, pos)
            self.strings.append(data[pos:data.index(0, pos)].decode("utf-8", "replace"))
        self.types = [self.strings[u32(data, u32(data, 68) + i * 4)]
                      for i in range(u32(data, 64))]
        self.protos = []
        for i in range(u32(data, 72)):
            pos = u32(data, 76) + i * 12
            ret, params = u32(data, pos + 4), u32(data, pos + 8)
            args = [] if not params else [self.types[u16(data, params + 4 + j * 2)]
                                         for j in range(u32(data, params))]
            self.protos.append("(" + "".join(args) + ")" + self.types[ret])
        self.methods = []
        for i in range(u32(data, 88)):
            pos = u32(data, 92) + i * 8
            self.methods.append(self.types[u16(data, pos)] + "->" +
                                self.strings[u32(data, pos + 4)] + self.protos[u16(data, pos + 2)])
        self.fields = []
        for i in range(u32(data, 80)):
            pos = u32(data, 84) + i * 8
            self.fields.append(self.types[u16(data, pos)] + "->" +
                               self.strings[u32(data, pos + 4)] + ":" + self.types[u16(data, pos + 2)])

    def method_code(self, signature):
        index = self.methods.index(signature)
        for i in range(u32(self.data, 96)):
            pos = u32(self.data, 100) + i * 32
            if self.types[u32(self.data, pos)] != signature.split("->")[0]:
                continue
            pos = u32(self.data, pos + 24)
            counts = []
            for _ in range(4):
                count, pos = uleb(self.data, pos)
                counts.append(count)
            for _ in range(counts[0] + counts[1]):
                _, pos = uleb(self.data, pos)
                _, pos = uleb(self.data, pos)
            for count in counts[2:]:
                method_index = 0
                for _ in range(count):
                    diff, pos = uleb(self.data, pos)
                    access, pos = uleb(self.data, pos)
                    offset, pos = uleb(self.data, pos)
                    method_index += diff
                    if method_index == index:
                        return offset, access
        raise ValueError("Method code not found")


class Code:
    def __init__(self, dex):
        self.dex, self.words, self.labels, self.fixups = dex, [], {}, []
        self.data_fixups = []

    def emit(self, *words):
        self.words.extend(words)

    def label(self, name):
        self.labels[name] = len(self.words)

    def branch_zero(self, register, label):
        pos = len(self.words)
        self.emit(0x38 | register << 8, 0)
        self.fixups.append((pos, label))

    def const4(self, register, value):
        assert 0 <= register < 16 and -8 <= value < 8
        self.emit(0x12 | register << 8 | (value & 15) << 12)

    def string(self, register, value):
        self.emit(0x1A | register << 8, self.dex.strings.index(value))

    def invoke(self, kind, signature, registers):
        assert 0 < len(registers) <= 5 and all(0 <= r < 16 for r in registers)
        regs = registers + [0] * (5 - len(registers))
        self.emit(kind | len(registers) << 12 | regs[4] << 8,
                  self.dex.methods.index(signature),
                  regs[0] | regs[1] << 4 | regs[2] << 8 | regs[3] << 12)

    def result(self, register, object_=False):
        self.emit((0x0C if object_ else 0x0A) | register << 8)

    def filled_array(self, type_name, register):
        self.emit(0x1024, self.dex.types.index(type_name), register)

    def fill_chars(self, register, label):
        pos = len(self.words)
        self.emit(0x26 | register << 8, 0, 0)
        self.data_fixups.append((pos, label))

    def finish(self):
        for pos, label in self.fixups:
            self.words[pos + 1] = (self.labels[label] - pos) & 65535
        for pos, label in self.data_fixups:
            offset = self.labels[label] - pos
            self.words[pos + 1:pos + 3] = [offset & 65535, offset >> 16]
        return struct.pack("<" + "H" * len(self.words), *self.words)


LOGOUT_SIGNATURE = "Lf/e/a/h/i/d;->P(Landroid/content/Context;)V"


def logout_code(dex):
    code = Code(dex)
    context, zero = 6, 2
    code.branch_zero(context, "done")
    activity_type = dex.types.index("Landroid/app/Activity;")
    code.emit(0x20 | context << 12, activity_type)  # instance-of v0, v6, Activity
    code.branch_zero(0, "failure")
    code.emit(0x1F | context << 8, activity_type)  # check-cast for finishAffinity
    code.const4(zero, 0)
    code.emit(0x62, dex.fields.index("Ljava/lang/Boolean;->FALSE:Ljava/lang/Boolean;"))
    code.emit(0x69, dex.fields.index("Lf/e/a/h/i/a;->y:Ljava/lang/Boolean;"))
    get_prefs = "Landroid/content/Context;->getSharedPreferences(Ljava/lang/String;I)Landroid/content/SharedPreferences;"
    edit = "Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;"
    clear = "Landroid/content/SharedPreferences$Editor;->clear()Landroid/content/SharedPreferences$Editor;"
    commit = "Landroid/content/SharedPreferences$Editor;->commit()Z"
    # These are active-login stores. Saved account rows live in SQLite and are untouched.
    for store in ["loginPrefs", "loginprefsmultiuser", "sharedprefremberme"]:
        code.string(1, store)
        code.invoke(0x6E, get_prefs, [context, 1, zero])
        code.result(0, True)
        if store == "loginPrefs":
            code.string(1, "selectedEPGShift")
            code.string(4, "")
            code.invoke(0x72, "Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;", [0, 1, 4])
            code.result(5, True)
        code.invoke(0x72, edit, [0])
        code.result(3, True)
        if store != "sharedprefremberme":
            code.invoke(0x72, clear, [3])
        if store == "loginPrefs":
            code.invoke(0x72, "Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;", [3, 1, 5])
        if store == "sharedprefremberme":
            code.string(1, "savelogin")
            code.invoke(0x72, "Landroid/content/SharedPreferences$Editor;->putBoolean(Ljava/lang/String;Z)Landroid/content/SharedPreferences$Editor;", [3, 1, zero])
        code.invoke(0x72, commit, [3])
        code.result(0)
        code.branch_zero(0, "failure")
    code.emit(0x22 | 1 << 8, dex.types.index("Landroid/content/Intent;"))
    code.string(4, "android.intent.action.MAIN")
    code.invoke(0x70, "Landroid/content/Intent;-><init>(Ljava/lang/String;)V", [1, 4])
    # addCategory is a public Android method absent from the existing method IDs.
    # Use existing reflection references rather than reindex unrelated DEX code.
    # HOME is built from a local char-array payload; no old string is overwritten.
    code.emit(0x1C, dex.types.index("Landroid/content/Intent;"))
    code.string(3, "addCategory")
    code.emit(0x1C | 4 << 8, dex.types.index("Ljava/lang/String;"))
    code.filled_array("[Ljava/lang/Class;", 4)
    code.result(4, True)
    code.invoke(0x6E, "Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;", [0, 3, 4])
    code.result(0, True)
    home_category = "android.intent.category.HOME"
    code.emit(0x13 | 4 << 8, len(home_category))  # const/16 v4, length
    code.emit(0x23 | 4 << 8 | 4 << 12, dex.types.index("[C"))
    code.fill_chars(4, "home_chars")
    code.emit(0x22 | 3 << 8, dex.types.index("Ljava/lang/String;"))
    code.invoke(0x70, "Ljava/lang/String;-><init>([C)V", [3, 4])
    code.filled_array("[Ljava/lang/Object;", 3)
    code.result(4, True)
    code.invoke(0x6E, "Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;", [0, 1, 4])
    code.emit(0x14 | zero << 8, 0, 0x1000)  # NEW_TASK; never clear the launcher's task
    code.invoke(0x6E, "Landroid/content/Intent;->setFlags(I)Landroid/content/Intent;", [1, zero])
    code.invoke(0x6E, "Landroid/content/Context;->startActivity(Landroid/content/Intent;)V", [context, 1])
    code.invoke(0x6E, "Landroid/app/Activity;->finishAffinity()V", [context])
    code.emit(0x0E)
    code.label("failure")
    code.string(1, "Error")
    code.const4(zero, 1)
    code.invoke(0x71, "Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;", [context, 1, zero])
    code.result(0, True)
    code.invoke(0x6E, "Landroid/widget/Toast;->show()V", [0])
    code.label("done")
    code.emit(0x0E)
    if len(code.words) % 2:
        code.emit(0)  # array-data payloads require four-byte alignment
    code.label("home_chars")
    code.emit(0x0300, 2, len(home_category), 0, *map(ord, home_category))
    return code.finish()


def patch_dex(data):
    if sha(data) != DEX_SHA:
        raise ValueError("Unreviewed DEX; refusing to substitute older player code")
    dex = Dex(data)
    offset, access = dex.method_code(LOGOUT_SIGNATURE)
    header = struct.unpack_from("<4H2I", data, offset)
    if header[:4] != (7, 1, 3, 0) or header[4] != 0 or not access & 8:
        raise ValueError("Unexpected logout code frame")
    start, capacity = offset + 16, header[5] * 2
    replacement = logout_code(dex)
    if len(replacement) > capacity:
        raise ValueError("Logout implementation exceeds existing method capacity")
    replacement += b"\0" * (capacity - len(replacement))
    out = bytearray(data)
    out[start:start + capacity] = replacement
    out[12:32] = hashlib.sha1(out[32:]).digest()
    struct.pack_into("<I", out, 8, zlib.adler32(out[12:]) & 0xFFFFFFFF)
    return bytes(out), {"offset": start, "originalHex": data[start:start + capacity].hex(),
                        "replacementHex": replacement.hex(), "length": capacity}


def xml_chunks(data):
    if u16(data, 0) != 3 or u32(data, 4) != len(data):
        raise ValueError("Invalid binary XML")
    pos = u16(data, 2)
    while pos < len(data):
        kind, header, size = struct.unpack_from("<HHI", data, pos)
        if size < header or header < 8 or pos + size > len(data):
            raise ValueError("Invalid binary XML chunk")
        yield pos, kind, header, size
        pos += size
    if pos != len(data):
        raise ValueError("XML chunk boundary mismatch")


def string_pool(data):
    pos, _, header, size = next(c for c in xml_chunks(data) if c[1] == 1)
    count, styles, flags, start, style_start = struct.unpack_from("<5I", data, pos + 8)
    if header != 28 or styles:
        raise ValueError("Unexpected layout string pool")
    values = []
    for i in range(count):
        cursor = pos + start + u32(data, pos + header + i * 4)
        if flags & 256:
            for _ in range(2):
                n = data[cursor]
                cursor += 1
                if n & 128:
                    n = (n & 127) << 8 | data[cursor]
                    cursor += 1
            values.append(data[cursor:cursor + n].decode("utf-8"))
        else:
            n = u16(data, cursor)
            cursor += 2
            if n & 32768:
                n = (n & 32767) << 16 | u16(data, cursor)
                cursor += 2
            values.append(data[cursor:cursor + n * 2].decode("utf-16le"))
    return pos, size, count, flags, start, values


def append_xml_string(data, value):
    pos, size, count, flags, start, values = string_pool(data)
    if value in values:
        return bytearray(data), values.index(value)
    encoded = (bytes([len(value), len(value.encode())]) + value.encode() + b"\0"
               if flags & 256 else struct.pack("<H", len(value)) + value.encode("utf-16le") + b"\0\0")
    offsets = data[pos + 28:pos + start]
    payload = data[pos + start:pos + size]
    new_start = start + 4
    pool = bytearray(struct.pack("<HHI5I", 1, 28, 0, count + 1, 0,
                                 flags & ~1, new_start, 0))
    pool += offsets + struct.pack("<I", len(payload)) + payload + encoded
    pool += b"\0" * (-len(pool) % 4)
    struct.pack_into("<I", pool, 4, len(pool))
    out = bytearray(data[:pos] + pool + data[pos + size:])
    struct.pack_into("<I", out, 4, len(out))
    return out, count


def xml_elements(data):
    strings = string_pool(data)[-1]
    stack = []
    for pos, kind, _, _ in xml_chunks(data):
        if kind == 0x102:
            attr_start, attr_size, count = struct.unpack_from("<3H", data, pos + 24)
            attrs = {}
            for i in range(count):
                cursor = pos + 16 + attr_start + i * attr_size
                attrs[strings[u32(data, cursor + 4)]] = (cursor, data[cursor + 15], u32(data, cursor + 16))
            node = {"tag": strings[u32(data, pos + 20)], "attrs": attrs,
                    "parents": stack.copy()}
            yield node
            stack.append(node)
        elif kind == 0x103:
            stack.pop()


def patch_layout(data):
    out, text_index = append_xml_string(data, "Log Out")
    buttons = [n for n in xml_elements(out) if n["attrs"].get("id", (0, 0, 0))[2] == 0x7F0A0401]
    if len(buttons) != 1:
        raise ValueError("Expected exactly one bound logout button")
    button = buttons[0]
    if button["tag"] != "Button" or not button["parents"]:
        raise ValueError("Unexpected logout widget")
    parent = button["parents"][-1]
    vis = parent["attrs"].get("visibility")
    if parent["tag"] != "LinearLayout" or not vis or vis[2] != 2:
        raise ValueError("Expected the reviewed hidden action row")
    struct.pack_into("<I", out, vis[0] + 16, 0)
    text = button["attrs"]["text"][0]
    struct.pack_into("<I", out, text + 8, text_index)
    out[text + 15] = 3
    struct.pack_into("<I", out, text + 16, text_index)
    for node in xml_elements(out):
        if node["attrs"].get("id", (0, 0, 0))[2] == 0x7F0A0401:
            assert all(p["attrs"].get("visibility", (0, 0, 0))[2] == 0 for p in node["parents"])
            assert node["attrs"]["focusable"][2] != 0
    return bytes(out)


def generate(apk: Path, destination: Path):
    with zipfile.ZipFile(apk) as archive:
        dex = archive.read("classes.dex")
        changed, method = patch_dex(dex)
        layouts = []
        for name in archive.namelist():
            if name.startswith("res/layout") and name.rsplit("/", 1)[-1] in (
                    "activity_account_info.xml", "activity_account_info_tv.xml"):
                original = archive.read(name)
                replacement = patch_layout(original)
                layouts.append({"entry": name, "originalSha256": sha(original),
                                "replacementSha256": sha(replacement),
                                "replacementBase64": base64.b64encode(replacement).decode()})
    if len(layouts) != 8:
        raise ValueError(f"Unexpected account-layout count: {len(layouts)}")
    previous = json.loads(Path(__file__).with_name("previous_logout.json").read_text())
    result = {"package": PACKAGE, "certificateSha256": CERT_SHA,
              "targetVersionCode": TARGET_VERSION, "sourceVersions": [2026101902, 2026101903, previous["versionCode"]],
              "sourceDexVariants": [{"sha256": sha(dex), "methodHex": method["originalHex"]},
                                    {"sha256": previous["sha256"], "methodHex": previous["methodHex"]}],
              "dexSha256": sha(dex), "patchedDexSha256": sha(changed),
              "method": {"signature": LOGOUT_SIGNATURE, **method}, "layouts": layouts}
    destination.write_text(json.dumps(result, indent=2) + "\n")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("apk", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    result = generate(args.apk, args.destination)
    print(json.dumps({"layouts": len(result["layouts"]), "methodBytes": result["method"]["length"],
                      "targetVersionCode": result["targetVersionCode"]}))
