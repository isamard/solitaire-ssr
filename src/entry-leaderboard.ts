export function render(_url: string) {
  const html = `
    <div class="actions" id="actions">
      <a href="/home">Nazad na igru</a>
      <a id="statistics">Statistike</a>
    </div>
    <div class="leaderboard" id="leaderboard"></div>
  `
  return { html }
}
