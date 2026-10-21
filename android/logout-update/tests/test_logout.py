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
    def __init__(self, dex, code, stores, fail=None, null=False, activity=True):
        self.dex, self.words = dex, struct.unpack('<'+'H'*(len(code)//2), code)
        self.stores, self.fail = copy.deepcopy(stores), fail
        self.events, self.fields = [], {}
        self.reg = [None]*7
        self.reg[6] = None if null else 'context'
        self.activity = activity
        self.task = ['Dashboard', 'AccountInfo']

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
            if args[0]['class'] == 'Ljava/lang/String;':
                args[0]['text'] = ''.join(map(chr, args[1])); return None
            assert args[0]['class'] == 'Landroid/content/Intent;'
            assert args[1] == 'android.intent.action.MAIN'
            args[0]['action'] = args[1]; return None
        if name == 'getMethod':
            assert args == ['Landroid/content/Intent;', 'addCategory', ['Ljava/lang/String;']]
            return ('method', 'addCategory')
        if name == 'invoke':
            assert args[0] == ('method', 'addCategory')
            assert args[2][0]['class'] == 'Ljava/lang/String;'
            args[1]['categories'] = [args[2][0]['text']]
            return args[1]
        if name == 'setFlags':
            args[0]['flags'] = args[1]; return args[0]
        if name == 'startActivity':
            self.events.append(('launch', copy.deepcopy(args[1]))); return None
        if name == 'finishAffinity':
            assert args == ['context'] and self.activity
            self.task.clear()
            self.events.append(('finish-task',)); return None
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
            elif opcode == 0x13:
                self.reg[register] = struct.unpack('<h', struct.pack('<H',self.words[pc+1]))[0]; pc += 2
            elif opcode == 0x20:
                assert self.dex.types[self.words[pc+1]] == 'Landroid/app/Activity;'
                self.reg[register & 15] = bool(self.reg[register >> 4]) and self.activity; pc += 2
            elif opcode == 0x1f:
                assert self.dex.types[self.words[pc+1]] == 'Landroid/app/Activity;' and self.activity
                pc += 2
            elif opcode == 0x23:
                assert self.dex.types[self.words[pc+1]] == '[C'
                self.reg[register & 15] = [0]*self.reg[register >> 4]; pc += 2
            elif opcode == 0x24:
                assert word >> 12 == 1
                assert self.dex.types[self.words[pc+1]] in ['[Ljava/lang/Class;', '[Ljava/lang/Object;']
                result = [self.reg[self.words[pc+2] & 15]]; pc += 3
            elif opcode == 0x26:
                offset = self.words[pc+1] | self.words[pc+2] << 16
                payload = pc+offset
                assert payload % 2 == 0 and self.words[payload:payload+2] == (0x300,2)
                count = self.words[payload+2] | self.words[payload+3] << 16
                assert len(self.reg[register]) == count
                self.reg[register][:] = self.words[payload+4:payload+4+count]
                pc += 3
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
                    'action':'android.intent.action.MAIN', 'categories':['android.intent.category.HOME'], 'flags':0x10000000}))
                self.assertEqual(vm.events[4], ('finish-task',))
                self.assertEqual(vm.task, [])
                self.assertEqual(len(vm.events),5)

    def test_each_failed_commit_prevents_navigation(self):
        for index, store in enumerate(['loginPrefs','loginprefsmultiuser','sharedprefremberme']):
            vm = DalvikBoundaryRunner(self.dex,self.code,self.stores(),fail=store).run()
            self.assertEqual(vm.events[-1],('error',))
            self.assertFalse(any(event[0]=='launch' for event in vm.events))
            self.assertEqual(vm.task,['Dashboard','AccountInfo'])
            self.assertEqual(len(vm.events),index+2)
            self.assertEqual(vm.stores['saved_users_database'],self.stores()['saved_users_database'])

    def test_null_context(self):
        before = self.stores()
        vm = DalvikBoundaryRunner(self.dex,self.code,before,null=True).run()
        self.assertEqual(vm.events,[]); self.assertEqual(vm.stores,before)

    def test_non_activity_context_keeps_login_and_reports_failure(self):
        before = self.stores()
        vm = DalvikBoundaryRunner(self.dex,self.code,before,activity=False).run()
        self.assertEqual(vm.events,[('error',)])
        self.assertEqual(vm.stores,before)
        self.assertEqual(vm.task,['Dashboard','AccountInfo'])

    def test_previous_update_migration_is_bounded(self):
        previous=json.loads((ROOT/'previous_logout.json').read_text())
        old=bytearray(self.original)
        start,length=self.method['offset'],self.method['length']
        old[start:start+length]=bytes.fromhex(previous['methodHex'])
        old[12:32]=hashlib.sha1(old[32:]).digest()
        struct.pack_into('<I',old,8,zlib.adler32(old[12:]))
        self.assertEqual(patcher.sha(old),previous['sha256'])
        self.assertIn(previous['versionCode'],self.config['sourceVersions'])
        self.assertIn(previous['sha256'],[v['sha256'] for v in self.config['sourceDexVariants']])

    def test_independent_dex_decoder_and_real_account_context(self):
        from androguard.core.dex import DEX
        from loguru import logger
        logger.remove()
        decoded=DEX(self.changed)
        utility=decoded.get_class('Lf/e/a/h/i/d;')
        method=next(m for m in utility.get_methods() if m.get_name()=='P' and m.get_descriptor()=='(Landroid/content/Context;)V')
        instructions=list(method.get_instructions())
        calls=[i.get_output() for i in instructions if i.get_name().startswith('invoke-')]
        self.assertTrue(any('finishAffinity' in c for c in calls))
        self.assertTrue(any('Ljava/lang/reflect/Method;->invoke' in c for c in calls))
        self.assertFalse(any('MultiUserActivity' in c for c in calls))
        account=decoded.get_class('Lcom/gearzoneiptv/gearzoneiptviptvbox/view/activity/AccountInfoActivity;')
        create=next(m for m in account.get_methods() if m.get_name()=='onCreate')
        # The existing confirmation passes AccountInfoActivity.r, assigned to this.
        self.assertTrue(any(i.get_name()=='iput-object' and i.get_output().startswith('v1, v1, ') and '->r Landroid/content/Context;' in i.get_output() for i in create.get_instructions()))

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
