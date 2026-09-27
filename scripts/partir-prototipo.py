# Parte fuente/lib.js (el IIFE del prototipo) en módulos ESM sin tocar el cuerpo de las funciones.
# Uso único del paso 2; queda en el repo como registro de cómo se hizo el corte.
import re, sys, pathlib

src = pathlib.Path(sys.argv[1]).read_text().split('\n')
out = pathlib.Path(sys.argv[2])

MODS = {
  'core/format.js': ['pad', 'n1', 'entre', 'esc', 'col', 'tinte', 'conUnidad', 'cuenta', 'tip'],
  'core/muestreo.js': ['muestreo'],
  'core/recursos.js': ['recursos'],
  'core/headline.js': ['headline'],
  'core/color.js': ['mezcla', 'FUERTE', 'SUAVE', 'velo'],
  'charts/legend.js': ['legend'],
  'charts/bullet.js': ['bullet'],
  'charts/rings.js': ['rings'],
  'charts/segmented.js': ['segmented'],
  'charts/ribbon.js': ['redondear', 'contorno', 'ribbon'],
  'charts/line.js': ['line'],
  'charts/columns.js': ['columns'],
  'charts/heatmap.js': ['heatmap'],
  'charts/range.js': ['range'],
  'charts/stackedLine.js': ['stackedLine'],
  'charts/stacked.js': ['stacked'],
  'charts/pie.js': ['pie'],
  'charts/state.js': ['state'],
  'runtime/hatch.js': ['LOOKS', 'DENS', 'OPS', 'rayado', 'setHatch'],
  'runtime/render.js': ['render'],
  'runtime/play.js': ['turno', 'play'],
  'runtime/mount.js': ['montado', 'mount'],
}
PUBLIC = {'bullet','rings','segmented','ribbon','line','stackedLine','columns','stacked','pie','heatmap','range','state','legend','mount','render','play','setHatch'}

# Línea de inicio de cada declaración de primer nivel (2 espacios de sangría dentro del IIFE).
decl = {}
for i, l in enumerate(src):
  m = re.match(r'^  (?:const|let) (\w+) =', l)
  if m: decl[m.group(1)] = i
known = [n for ns in MODS.values() for n in ns]
missing = [n for n in known if n not in decl]
assert not missing, missing
ignorados = set(decl) - set(known) - {'uid', 'api'}
assert not ignorados, ignorados

def comienzo(i):
  # Sube por el comentario pegado a la declaración.
  while i > 0 and re.match(r'^  (/\*\*| \*|//)', src[i - 1]): i -= 1
  return i
starts = sorted(set(comienzo(decl[n]) for n in decl))
fin_iife = next(i for i, l in enumerate(src) if l.startswith('  const api ='))
def bloque(n):
  a = comienzo(decl[n]); b = next((s for s in starts if s > a), fin_iife)
  lines = src[a:b]
  while lines and not lines[-1].strip(): lines.pop()
  return [l[2:] if l.startswith('  ') else l for l in lines]

donde = {n: m for m, ns in MODS.items() for n in ns}

def codigo(t):
  # Sin comentarios ni strings: una palabra dentro de un texto no es una referencia.
  t = re.sub(r'/\*.*?\*/', '', t, flags=re.S)
  t = re.sub(r"'(?:[^'\\\n]|\\.)*'", "''", t)
  t = re.sub(r'//[^\n]*', '', t)
  return t
for mod, names in MODS.items():
  body = []
  for n in sorted(names, key=lambda n: decl[n]):
    b = bloque(n)
    body += b + ['']
  text = '\n'.join(body)
  text = text.replace('const k = ++uid', 'const k = nextId()')
  if mod == 'runtime/mount.js':
    text = text.replace("api[redibujable.getAttribute('data-sc-chart')]", "redibujables[redibujable.getAttribute('data-sc-chart')]")
  imports = {}
  for n, m in donde.items():
    if m != mod and re.search(r'(?<![\w.$])' + n + r'\b', codigo(text)):
      imports.setdefault(m, []).append(n)
  if 'nextId()' in text: imports['core/ids.js'] = ['nextId']
  if mod == 'runtime/mount.js':
    for n in ('pie', 'stacked', 'stackedLine'): imports.setdefault(donde[n], []).append(n)
  head = []
  for m, ns in sorted(imports.items()):
    rel = ('../' + m) if m.split('/')[0] != mod.split('/')[0] else ('./' + m.split('/')[1])
    head.append('import { ' + ', '.join(sorted(ns, key=lambda n: decl.get(n, 0))) + " } from '" + str(rel) + "'")
  if mod == 'runtime/mount.js':
    head += ['', '// Los gráficos que se REDIBUJAN al tocar su leyenda: apagar una serie cambia la forma de las demás.',
             'const redibujables = { pie, stacked, stackedLine }']
  # Exporta lo que otro módulo usa y lo público.
  usados = {n for m2 in MODS if m2 != mod for n in names if re.search(r'(?<![\w.$])' + n + r'\b', codigo('\n'.join(sum((bloque(x) for x in MODS[m2]), []))))}
  exp = [n for n in names if n in PUBLIC or n in usados]
  for n in exp:
    text = re.sub(r'^(const|let) ' + n + ' =', r'export \1 ' + n + ' =', text, count=1, flags=re.M)
  p = out / mod
  p.parent.mkdir(parents=True, exist_ok=True)
  p.write_text(('\n'.join(head) + '\n\n' if head else '') + text.rstrip() + '\n')
  print(mod, 'exporta', exp, '· importa', {k: v for k, v in imports.items()})
