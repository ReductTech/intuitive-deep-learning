from pathlib import Path
p=Path('modules/Creator-Guide/pages/UIKitPage.tsx');s=p.read_text(encoding='utf-8');s=s.replace("from '../../shared/react'", "from '../../../shared/react'").replace("import './UIKitPage.css';", "import '../../pages/UIKitPage.css';")
Path('modules/Creator-Guide/components/assembly/UIKitCatalog.tsx').write_text(s,encoding='utf-8')
p.write_text("export { AssemblyShowcase as UIKitPage } from '../components/assembly/AssemblyShowcase';\n",encoding='utf-8')
