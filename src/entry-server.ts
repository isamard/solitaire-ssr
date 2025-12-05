export function render(_url: string) {
  const html = `
    <div class="actions" id="actions">
      <button type="button" id="reset-game" class="new-game">Nova igra</button>
      <button type="button" id="leaderboard" class="leaderboard">Pregled tablice</button>
    </div>
    <div class="solitaire" id="solitaire">
      <div id="top" class="top">
        <div class="deck">
          <div id="deck-pile" class="deck-pile"></div>
          <div id="deck-deal" class="deck-deal"></div>
        </div>
        <div id="finish" class="finish"></div>
      </div>
      <div id="board" class="board"></div>
      <div id="timer" class="timer"></div>
      <p id="score" class="score">Bodovi: 0</p>
      <div id="currentplayer" class="currentplayer" display= "none">
        <p id="currentplayertext">Trenutni igrač: / </p>
        <a id="logout">Odjava</a>
      </div>
    </div>
    <img id="cards-png" hidden src="/cards.png">
  `
  return { html }
}
