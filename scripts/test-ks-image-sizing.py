from pathlib import Path
import json,struct,itertools
root=Path(__file__).resolve().parent/'android-image-sizing';patch=json.loads((root/'patch.json').read_text());data=bytes.fromhex(patch['method']['replacementHex']);meta=json.loads((root/'trace.json').read_text());fields={};methods={}
for off,op,args in meta['trace']:
 if op=='field':fields[struct.unpack_from('<H',data,off*2+2)[0]]=args[2]
 if op in ['call','range']:methods[struct.unpack_from('<H',data,off*2+2)[0]]=args[0]
def run(sized,fit,w,h,placeholder,crop=False):
 builder={'size':sized,'fit':fit,'inside':False,'crop':crop};req={'builder':builder,'fit':fit,'placeholderFlag':placeholder,'picasso':'picasso'};image={'w':w,'h':h};r={0:req,3:image,11:'callback',15:req,16:image};pc=0;last=None;calls=[]
 for _ in range(100):
  if pc==len(data):return builder,calls,'continue'
  op=data[pc];a=data[pc+1];nextpc=pc+2
  if op in (0x54,0x55):
   dst=a&15;obj=a>>4;field=fields[struct.unpack_from('<H',data,pc+2)[0]];r[dst]=r[obj][field];nextpc=pc+4
  elif op in (0x6e,0x70,0x71,0x74):
   idx=struct.unpack_from('<H',data,pc+2)[0];key=methods[idx]
   if op==0x74:regs=list(range(struct.unpack_from('<H',data,pc+4)[0],struct.unpack_from('<H',data,pc+4)[0]+a))
   else:
    regs=[data[pc+4]&15,data[pc+4]>>4,data[pc+5]&15,data[pc+5]>>4,a&15][:a>>4]
   vals=[r.get(x) for x in regs];calls.append(key)
   if key=='hasSize':last=builder['size']
   elif key=='inside':assert not builder['crop'];builder['inside']=True
   elif key=='width':last=w
   elif key=='height':last=h
   elif key=='resize':assert vals[1:]==[w,h];builder['size']=True;builder['dimensions']=(w,h)
   elif key=='drawable':last='placeholder'
   elif key=='deferredInit':assert regs==[2,15,3,11]
   elif key=='defer':assert vals[0]=='picasso' and vals[1] is image
   nextpc=pc+6
  elif op in (0x0a,0x0c):r[a]=last
  elif op in (0x38,0x39):
   cond=not r[a] if op==0x38 else bool(r[a]);nextpc=pc+struct.unpack_from('<h',data,pc+2)[0]*2 if cond else pc+4
  elif op==0x28:nextpc=pc+struct.unpack_from('<b',data,pc+1)[0]*2
  elif op==0x22:r[a]={'deferred':True};nextpc=pc+4
  elif op==0x0e:return builder,calls,'defer'
  elif op==0x00:pass
  else:raise AssertionError((pc,op))
  pc=nextpc
 raise AssertionError('loop')
count=0
for sized,fit,w,h,placeholder in itertools.product([False,True],[False,True],[0,300],[0,450],[False,True]):
 b,c,result=run(sized,fit,w,h,placeholder)
 if sized:assert c==['hasSize'] and 'dimensions' not in b and result=='continue'
 else:
  assert b['inside']==(not fit)
  if w and h:assert result=='continue' and b['dimensions']==(w,h)
  else:assert result=='defer' and 'resize' not in c and ('setPlaceholder' in c)==placeholder
 count+=1
b,c,r=run(False,True,300,450,True,True);assert b['crop'] and not b['inside'] and b['dimensions']==(300,450)
print('PASS:',count,'decoded-bytecode scenarios preserve explicit sizes, fit choices, zero-size deferral, placeholders and callback construction; explicit crop+fit remains intact.')
