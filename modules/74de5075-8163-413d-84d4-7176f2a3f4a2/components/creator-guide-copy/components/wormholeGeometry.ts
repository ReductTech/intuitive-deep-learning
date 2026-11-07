/** Zero-redshift Morris–Thorne example: b(r) = a²/r.
 * ℓ is proper radial distance; z is ONLY the Euclidean embedding coordinate.
 * r² = ℓ² + a² and z = a asinh(ℓ/a) give dr² + dz² = dℓ².
 */
export const wormholeRadius = (ell: number, throat: number) => Math.hypot(ell, throat);
export const embeddingHeight = (ell: number, throat: number) => throat * Math.asinh(ell / throat);
export const radialPathLength = (endpoint: number) => 2 * endpoint;
