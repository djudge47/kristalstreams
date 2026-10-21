"""Execute the emitted method with Android boundary doubles; check real AXML/DEX."""
import base64
import copy
import hashlib
import json
from pathlib import Path
import struct
import sys
import unittest
import zipfile
import zlib

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import make_patch as patcher
import package_update

APK = ROOT.parents[1] / 'public/downloads/KristalStreams.apk'


class DalvikBoundaryRunner:
    """Decode and execute actual patch words; unknown opcodes/calls fail closed."""
    def __init__(self, dex, code, stores, fail=None, null=False):
        self.dex, self.words = dex, struct.unpack('<'+'H'*(len(code)//2), code)
        self.stores, self.fail = copy.deepcopy(stores), fail
        self.events, self.fields = [], {}
        self.reg = [None]*7
        self.reg[6] = None if null else 'context'

    def invoke(self, signature, args):
        name = signature.split('->')[1].split('(')[0]
        if name == 'getSharedPreferences':
            assert args[0] == 'context' and args[2] == 0
            assert args[1] in {'loginPrefs', 'loginprefsmultiuser', 'sharedprefremberme'}
            return ('prefs', args[1])
        if name == 'getString':
            return self.stores[args[0][1]].get(args[1], args[2])
        if name == 'edit':
            return {'store':args[0][1], 'values':copy.deepcopy(self.stores[args[0][1]])}
        if name == 'clear':
            args[0]['values'].clear(); return args[0]
        if name in {'putString', 'putBoolean'}:
            args[0]['values'][args[1]] = bool(args[2]) if name == 'putBoolean' else args[2]
            return args[0]
        if name == 'commit':
            store = args[0]['store']
            self.events.append(('commit', store))
            if store == self.fail: return False
            self.stores[store] = copy.deepcopy(args[0]['values']); return True
        if name == '<init>':
            assert args[1] == 'context'
            args[0]['target'] = args[2]; return None
        if name == 'setFlags':
            args[0]['flags'] = args[1]; return args[0]
        if name == 'startActivity':
            self.events.append(('launch', copy.deepcopy(args[1]))); return None
        if name == 'makeText':
            assert args == ['context', 'Error', 1]
            return 'error-toast'
        if name == 'show':
            assert args == ['error-toast']; self.events.append(('error',)); return None
        raise AssertionError('Unexpected call '+signature)

    def run(self):
        pc = steps = 0
        result = None
        while steps < 500:
            steps += 1
            word = self.words[pc]; opcode = word & 255; register = word >> 8
            if opcode == 0x38:
                displacement = struct.unpack('<h', struct.pack('<H',self.words[pc+1]))[0]
                pc += displacement if not self.reg[register] else 2
            elif opcode == 0x12:
                value = word >> 12; value = value-16 if value > 7 else value
                self.reg[register & 15] = value; pc += 1
            elif opcode in {0x1a, 0x1c, 0x22}:
                index = self.words[pc+1]
                self.reg[register] = (self.dex.strings[index] if opcode == 0x1a else
                                      self.dex.types[index] if opcode == 0x1c else {'class':self.dex.types[index]})
                pc += 2
            elif opcode == 0x14:
                self.reg[register] = self.words[pc+1] | self.words[pc+2] << 16; pc += 3
            elif opcode == 0x62:
                assert self.dex.fields[self.words[pc+1]] == 'Ljava/lang/Boolean;->FALSE:Ljava/lang/Boolean;'
                self.reg[register] = False; pc += 2
            elif opcode == 0x69:
                self.fields[self.dex.fields[self.words[pc+1]]] = self.reg[register]; pc += 2
            elif opcode in {0x6e,0x70,0x71,0x72}:
                count = word >> 12; packed = self.words[pc+2]
                registers = [(packed >> (i*4)) & 15 for i in range(4)] + [(word >> 8)&15]
                result = self.invoke(self.dex.methods[self.words[pc+1]], [self.reg[r] for r in registers[:count]])
                pc += 3
            elif opcode in {0x0a,0x0c}:
                self.reg[register] = result; pc += 1
            elif opcode == 0x0e: return self
            else: raise AssertionError(f'Unexpected opcode {opcode:02x} at {pc}')
        raise AssertionError('Method failed to return')


class LogoutTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.archive = zipfile.ZipFile(APK)
        cls.original = cls.archive.read('classes.dex')
        cls.changed, cls.method = patcher.patch_dex(cls.original)
        cls.dex = patcher.Dex(cls.changed)
        cls.config = json.loads((ROOT/'patch.json').read_text())
        cls.code = bytes.fromhex(cls.method['replacementHex'])

    @classmethod
    def tearDownClass(cls): cls.archive.close()

    def stores(self, mode='xtream'):
        return {'loginPrefs':{'username':'u','password':'secret','serverUrl':'https://example.invalid/list' if mode=='m3u' else '', 'selectedEPGShift':'2'},
                'loginprefsmultiuser':{'username':'u','password':'secret','user_id':42,'login_type':mode},
                'sharedprefremberme':{'savelogin':True,'other':'kept'},
                'player':{'decoder':'hardware','opensles':False},
                'saved_users_database':[{'id':42,'name':'saved','password':'saved-secret'}]}

    def test_logout_xtream_and_m3u(self):
        for mode in ['xtream','m3u']:
            with self.subTest(mode=mode):
                before = self.stores(mode)
                vm = DalvikBoundaryRunner(self.dex,self.code,before).run()
                self.assertEqual(vm.stores['loginPrefs'], {'selectedEPGShift':'2'})
                self.assertEqual(vm.stores['loginprefsmultiuser'], {})
                self.assertEqual(vm.stores['sharedprefremberme'], {'savelogin':False,'other':'kept'})
                for name in ['player','saved_users_database']: self.assertEqual(vm.stores[name],before[name])
                self.assertEqual(vm.events[:3],[('commit',n) for n in ['loginPrefs','loginprefsmultiuser','sharedprefremberme']])
                self.assertEqual(vm.events[3], ('launch', {'class':'Landroid/content/Intent;',
                    'target':'Lcom/gearzoneiptv/gearzoneiptviptvbox/view/activity/MultiUserActivity;', 'flags':0x10008000}))
                self.assertEqual(len(vm.events),4)

    def test_each_failed_commit_prevents_navigation(self):
        for index, store in enumerate(['loginPrefs','loginprefsmultiuser','sharedprefremberme']):
            vm = DalvikBoundaryRunner(self.dex,self.code,self.stores(),fail=store).run()
            self.assertEqual(vm.events[-1],('error',))
            self.assertFalse(any(event[0]=='launch' for event in vm.events))
            self.assertEqual(len(vm.events),index+2)
            self.assertEqual(vm.stores['saved_users_database'],self.stores()['saved_users_database'])

    def test_null_context(self):
        before = self.stores()
        vm = DalvikBoundaryRunner(self.dex,self.code,before,null=True).run()
        self.assertEqual(vm.events,[]); self.assertEqual(vm.stores,before)

    def test_bounded_dex_change_and_headers(self):
        start, length = self.method['offset'], self.method['length']
        self.assertEqual(len(self.original),len(self.changed))
        self.assertEqual(self.original[:8],self.changed[:8])
        self.assertEqual(self.original[32:start],self.changed[32:start])
        self.assertEqual(self.original[start+length:],self.changed[start+length:])
        self.assertEqual(self.changed[12:32],hashlib.sha1(self.changed[32:]).digest())
        self.assertEqual(patcher.u32(self.changed,8),zlib.adler32(self.changed[12:]))
        self.assertEqual(patcher.sha(self.changed),self.config['patchedDexSha256'])
        self.assertEqual(self.dex.method_code(patcher.LOGOUT_SIGNATURE)[0]+16,start)

    def test_unreviewed_dex_rejected(self):
        bad=bytearray(self.original); bad[-1]^=1
        with self.assertRaisesRegex(ValueError,'Unreviewed'): patcher.patch_dex(bad)

    def test_all_eight_layouts_visible_and_independently_parseable(self):
        from androguard.core.axml import AXMLPrinter
        from loguru import logger
        logger.remove()
        self.assertEqual(len(self.config['layouts']),8)
        for layout in self.config['layouts']:
            original = self.archive.read(layout['entry'])
            changed = patcher.patch_layout(original)
            self.assertEqual(changed,base64.b64decode(layout['replacementBase64']))
            self.assertEqual(patcher.sha(original),layout['originalSha256'])
            doc = AXMLPrinter(changed).get_xml_obj()
            ns='{http://schemas.android.com/apk/res/android}'
            button=doc.xpath('//*[@android:id="@7F0A0401"]',namespaces={'android':ns[1:-1]})
            self.assertEqual(len(button),1)
            self.assertEqual(button[0].get(ns+'text'),'Log Out')
            self.assertEqual(button[0].get(ns+'focusable'),'true')
            for node in [button[0],*button[0].iterancestors()]:
                self.assertIn(node.get(ns+'visibility'),[None,'0','visible'])

    def test_self_contained_launcher_round_trip(self):
        import re
        launcher=package_update.launcher_bytes().decode('ascii')
        # Same regex used by the real Windows command; no companion script needed.
        payload=re.split(':KS_LOGOUT_PAYLOAD\\r?\\n',launcher,maxsplit=1)[1]
        script=base64.b64decode(payload).decode('utf-8')
        self.assertEqual(script,package_update.embedded_script())
        self.assertNotIn('$PSScriptRoot',script)
        self.assertIn('$env:KS_LOGOUT_BUNDLE',launcher)
        self.assertIn('Update-LogoutDex',script)


if __name__=='__main__': unittest.main(verbosity=2)
