export function githubProfileUrl(githubId: string) {
  return `https://github.com/${encodeURIComponent(githubId)}`;
}

export function githubAvatarUrl(githubId: string) {
  return `${githubProfileUrl(githubId)}.png?size=160`;
}
