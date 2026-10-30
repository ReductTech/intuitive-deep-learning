// Compatibility entry; business logic lives with the creator skill.
import { main } from '../../creator-skill/scripts/checks/analyze_module_styles.mjs';
process.exitCode = await main();
