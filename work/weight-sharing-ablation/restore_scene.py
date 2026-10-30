from pathlib import Path

p = Path('modules/Convolution-Kernel-Intro/pages/WeightSharingPage/WeightSharingScene.tsx')
s = p.read_text(encoding='utf-8')
s = s.replace("import { createContext, useContext, useEffect, useRef, useState } from 'react';", "import { useEffect, useRef, useState } from 'react';")
a = s.index('// Optional controls for synchronized comparisons;')
b = s.index('type Tile =', a)
s = s[:a] + s[b:]
s = s.replace("function Fallback({ kind, active, linkedOutput = true, colorByPosition = false }: { kind: SharingKind; active: number; linkedOutput?:boolean; colorByPosition?:boolean })", "function Fallback({ kind, active }: { kind: SharingKind; active: number })")
s = s.replace(" style={colorByPosition && kind === 'shared' ? {backgroundColor:'#'+KERNEL_COLORS[active].toString(16).padStart(6,'0')} : undefined}", '')
s = s.replace("index === (linkedOutput ? active : 0)", 'index === active')
s = s.replace('  const settings = useContext(WeightSharingSceneSettings);\n  const settingsRef = useRef(settings);\n  settingsRef.current = settings;\n', '')
s = s.replace('    if (settings) { setActive(settings.activeIndex); return; }\n', '')
s = s.replace('  }, [fallback, settings]);', '  }, [fallback]);')
s = s.replace("      const outputIndex = settingsRef.current?.linkedOutput === false ? 0 : index;\n      mount.dataset.windowIndex = String(index);\n      mount.dataset.activeOutput = String(outputIndex);", "      mount.dataset.activeOutput = String(index);")
a = s.index("      if (kind === 'shared' && settingsRef.current?.colorByPosition)")
b = s.index('      const row =', a)
s = s[:a] + s[b:]
s = s.replace('output.tiles.forEach((tile, cellIndex) => {\n        const selected = cellIndex === outputIndex;', 'output.tiles.forEach((tile, outputIndex) => {\n        const selected = outputIndex === index;')
s = s.replace('output.tiles[outputIndex].position.clone()', 'output.tiles[index].position.clone()')
s = s.replace('    let motionTime = performance.now();\n    let previousTick = motionTime;\n', '')
s = s.replace('    let selectedIndex = settingsRef.current?.activeIndex ?? SCAN_ORDER[scanStep];\n    select(selectedIndex);', '    select(SCAN_ORDER[scanStep]);')
s = s.replace('      if (!settingsRef.current?.paused) motionTime += now - previousTick;\n      previousTick = now;\n      const visualTime = settingsRef.current ? motionTime : now;\n', '')
a = s.index('      const controlled = settingsRef.current;')
b = s.index('      if (now - lastRender >= 33)', a)
s = s[:a] + '      if (now >= nextStepAt) { scanStep = (scanStep + 1) % SCAN_ORDER.length; select(SCAN_ORDER[scanStep]); nextStepAt = now + 1500; }\n' + s[b:]
s = s.replace('visualTime *', 'now *')
s = s.replace('output.tiles[settingsRef.current?.linkedOutput === false ? 0 : selectedIndex]', 'output.tiles[SCAN_ORDER[scanStep]]')
s = s.replace('<Fallback kind={kind} active={active} linkedOutput={settings?.linkedOutput} colorByPosition={settings?.colorByPosition} />', '<Fallback kind={kind} active={active} />')
assert 'settingsRef' not in s and 'selectedIndex' not in s and 'createContext' not in s
p.write_text(s, encoding='utf-8')
