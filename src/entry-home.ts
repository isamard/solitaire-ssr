export function render(_url: string) {
  const html = `
    <div class="actions" id="actions">
      <a class="noselect" id="reset-game">Nova igra</a>
      <a class="noselect" href="/leaderboard">Pregled tablice</a>
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
