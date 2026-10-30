// Compatibility entry; business logic lives with the creator skill.
import { main } from '../../creator-skill/scripts/checks/validate_ppt_bounds.mjs';
process.exitCode = await main();
