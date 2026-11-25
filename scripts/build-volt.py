import re
src=open(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','src','theme','volt.src.css')).read()
out=re.sub(r'(?<![A-Za-z0-9_\-#])B (?=[.{,:a-z*\[#])', lambda m:'html[data-theme] body:not(.lx-body) ', src)
out=out.replace('html[data-theme] body:not(.lx-body) {','html[data-theme] body:not(.lx-body){').replace('html[data-theme] body:not(.lx-body) ,','html[data-theme] body:not(.lx-body),')
open(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','src','theme','volt.css'),'w').write('/* generated from volt.src.css */\n'+out)
