const tileSize = 32;
// マップ定義（mapA, mapB）
const mapA = [
  [4,4,4,4,4,4,4,4,4,4,4,4,4,11,4],
  [6,7,0,3,3,3,3,3,0,0,6,7,0,1,0],
  [8,9,0,0,0,0,0,0,0,0,8,9,0,1,0],
  [0,0,1,1,1,1,1,1,1,0,0,0,0,1,0],
  [0,0,1,0,0,0,2,0,1,0,3,3,0,1,0],
  [0,0,1,0,3,3,0,0,1,0,3,3,0,1,0],
  [0,0,1,0,3,3,0,0,1,0,3,3,0,1,0],
  [0,0,1,0,3,3,0,0,1,0,3,3,0,1,0],
  [0,0,1,0,3,3,0,0,1,0,3,3,0,1,0],
  [0,0,1,0,0,0,0,0,1,2,3,3,0,1,0],
  [4,4,11,4,4,0,0,0,1,0,0,0,0,1,0],
  [0,0,0,0,10,0,0,0,1,1,1,1,1,1,0],
  [0,0,0,0,10,0,0,0,0,0,0,0,5,1,0],
  [0,0,0,0,10,0,0,0,0,0,0,0,0,1,0],
  [0,0,0,0,10,0,0,0,0,0,0,0,0,1,0],
];

const mapB = [
  [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],
  [0,0,0,0,0,0,0,0,6,7,0,0,0,5,0],
  [0,0,0,0,0,0,0,0,8,9,0,0,0,0,0],
  [2,0,0,0,0,0,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,1,3,3,3,3,0,0,1,0],
  [0,0,0,0,0,0,1,3,3,3,3,0,0,1,0],
  [0,0,0,0,0,0,1,3,3,3,3,0,0,1,0],
  [0,0,0,0,0,0,1,0,0,0,0,0,0,1,0],
  [0,0,0,0,0,0,1,1,1,1,1,1,1,1,0],
  [6,7,0,0,0,0,0,0,0,0,0,0,0,1,0],
  [8,9,0,0,0,0,0,0,0,0,0,0,0,1,0],
  [3,3,3,3,3,3,3,0,0,0,0,0,0,1,0],
  [3,3,3,3,3,3,3,0,6,7,0,0,0,1,0],
  [3,3,3,3,3,3,3,0,8,9,0,0,0,1,0],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,11,4],
];


let currentMap = "A";
let mapData = mapA;
const evolutionStone = {
  x: 2,
  y: 3,
  collected: false,
  img: new Image()
};
evolutionStone.img.src = "assets/img/Evolution_Stone.png";

const enemyA = {
  x: 13,
  y: 1,
  collected: false,
  img: new Image()
};
enemyA.img.src = "assets/img/monster/enemyA.png";

const enemyB = {
  x: 3,
  y: 5,
  collected: false,
  img: new Image()
};
enemyB.img.src = "assets/img/monster/enemyB.png";

// const enemyC = {
//   x: 3,
//   y: 3,
//   collected: false,
//   img: new Image()
// };
// enemyC.img.src = "assets/img/monster/enemyC.png";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const exploreScreen = document.getElementById("explore-screen");
const battleScreen = document.getElementById("battle-screen");

let gameState = "explore";
let previousPosition = { tileX: 0, tileY: 0 };

const player = {
  tileX: 0, tileY: 14,
  screenX: 0, screenY: 14 * 32,
  targetX: 0, targetY: 14 * 32,
  moving: false
};


const tileSources = {
  0: "assets/img/top_left_tile_.png",//草原
  1: "assets/img/Map_A1.png", //道
  2: "assets/img/Map_C1.png", //木
  3: "assets/img/Map_A2.png", //草むら
  4: "assets/img/Map_B1.png", //川
  5: "assets/img/Map_A3.png", //岩
  6: "assets/img/Map_E1_a.png", //左上
  7: "assets/img/Map_E1_b.png", //右上
  8: "assets/img/Map_E1_c.png", //左下
  9: "assets/img/Map_E1_d.png", //右下
  10: "assets/img/Map_B1updown.png", //縦川
  11: "assets/img/Map_E2.png" //橋
};


const tileProperties = {
  0: { name: "草地", passable: true },
  1: { name: "道", passable: true },
  2: { name: "木", passable: false },
  3: { name: "草むら", passable: true },
  4: { name: "川", passable: false },
  5: { name: "岩", passable: false },
  6: { name: "左上", passable: false },
  7: { name: "右上", passable: false },
  8: { name: "左下", passable: false },
  9: { name: "右下", passable: false },
  10:{ name: "縦川", passable: false },
  11:{ name: "橋", passable: true }
};

let BattleTriggerA = false;
let BattleTriggerB = false;
let BattleTriggerC = false;



function checkTransition() {
  if (currentMap === "A" && player.tileX === 13 && player.tileY === 0 ) {
    currentMap = "B";
    mapData = mapB;
    player.tileX = 13;
    player.tileY = 14;
    player.targetX = player.tileX * tileSize;
    player.targetY = player.tileY * tileSize;
    player.screenX = player.targetX;
    player.screenY = player.targetY;
    player.moving = false;
  } else if (currentMap === "B" && player.tileX === 13 && player.tileY === 14 ) {
    currentMap = "A";
    mapData = mapA;
    player.tileX = 13;
    player.tileY = 0;
    player.targetX = player.tileX * tileSize;
    player.targetY = player.tileY * tileSize;
    player.screenX = player.targetX;
    player.screenY = player.targetY;
    player.moving = false;
  }
}



function checkEvent() {
  if (gameState !== "explore") return;
  if (mapData === mapA && !BattleTriggerA && player.tileX === 13 && player.tileY === 1 ) {
    previousPosition = { tileX: player.tileX, tileY: player.tileY };
    startBattle();
    BattleTriggerA = true;
  }
  if (mapData === mapB && !BattleTriggerB && player.tileX === 3 && player.tileY === 5 ) {
    previousPosition = { tileX: player.tileX, tileY: player.tileY };
    startBattle();
    BattleTriggerB = true;
  }
  if (mapData === mapB && player.tileX === 0 && player.tileY === 12 ) {
    showEventImage();
    
  }
}



// 進化の石を取得するイベント
function drawStone() {
  if (!evolutionStone.collected && mapData === mapA) {
    ctx.drawImage(
      evolutionStone.img,
      evolutionStone.x * tileSize,
      evolutionStone.y * tileSize,
      tileSize,
      tileSize
    );
  }
}

// 進化の石を取得する処理
function checkStonePickup() {
  if (!evolutionStone.collected &&
      player.tileX === evolutionStone.x &&
      player.tileY === evolutionStone.y && 
      mapData === mapA) {
    evolutionStone.collected = true;
    const messageBox = document.getElementById("message");
    messageBox.textContent = "進化の石を手に入れた！";
    messageBox.style.display = "inline-block"; // 表示

    setTimeout(() => {
      messageBox.style.display = "none"; // 非表示
      messageBox.textContent = "";
    }, 2000);
  }
}



// 敵モンスターと対戦するイベント
function drawMonsterA() {
  if (!enemyA.collected && mapData === mapA) {
    ctx.drawImage(
      enemyA.img,
      enemyA.x * tileSize,
      enemyA.y * tileSize,
      tileSize,
      tileSize
    );
  }
}

// 敵モンスターと対戦するイベント
function drawMonsterB() {
  if (!enemyB.collected && mapData === mapB) {
    ctx.drawImage(
      enemyB.img,
      enemyB.x * tileSize,
      enemyB.y * tileSize,
      tileSize,
      tileSize
    );
  }
}

// 敵モンスターと対戦するイベント
// function drawMonsterC() {
//   if (!enemyC.collected && mapData === mapB) {
//     ctx.drawImage(
//       enemyC.img,
//       enemyC.x * tileSize,
//       enemyC.y * tileSize,
//       tileSize,
//       tileSize
//     );
//   }
// }

// 敵モンスターと対戦後の処理
function checkMonsterA() {
  if (!enemyA.collected &&
      player.tileX === enemyA.x &&
      player.tileY === enemyA.y &&
      mapData === mapA) {
    enemyA.collected = true;  
  }
}

// 敵モンスターと対戦後の処理
function checkMonsterB() {
  if (!enemyB.collected &&
      player.tileX === enemyB.x &&
      player.tileY === enemyB.y &&
      mapData === mapB) {
    enemyB.collected = true;  
  }
}

// 敵モンスターと対戦後の処理
// function checkMonsterC() {
//   if (!enemyC.collected &&
//       player.tileX === enemyC.x &&
//       player.tileY === enemyC.y &&
//       mapData === mapB) {
//     enemyC.collected = true;  
//   }
// }


// イベント画像を表示する
function showEventImage(duration = 2000) {
  const img = document.getElementById("event-img-1");
  img.style.display = "block";
  img.style.opacity = "1";

  setTimeout(() => {
    img.style.opacity = "0";
    setTimeout(() => {
      img.style.display = "none";
    }, 1000); // フェードアウト後に非表示
  }, duration);
}

function isMoveValid(x, y) {
  if (y < 0 || y >= mapData.length || x < 0 || x >= mapData[0].length) return false;
  const tileID = mapData[y][x];
  return tileProperties[tileID]?.passable === true;
}

const tileImages = {};
let loadedCount = 0;
const totalImages = Object.keys(tileSources).length + 1;

const characterImg = new Image();
characterImg.src = "assets/img/character.png";
characterImg.onload = () => { loadedCount++; checkLoaded(); };

for (const key in tileSources) {
  const img = new Image();
  img.src = tileSources[key];
  img.onload = () => { loadedCount++; checkLoaded(); };
  tileImages[key] = img;
}

function checkLoaded() {
  if (loadedCount === totalImages) {
    requestAnimationFrame(update);
  }
}

function drawMap(mapData) {
  for (let y = 0; y < mapData.length; y++) {
    for (let x = 0; x < mapData[y].length; x++) {
      const tileID = mapData[y][x];
      const img = tileImages[tileID];
      if (img) {
        ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }
}

function drawPlayer() {
  ctx.drawImage(characterImg, player.screenX, player.screenY, tileSize, tileSize);
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap(mapData);
  drawPlayer();
  drawStone(); 
  drawMonsterA();
  drawMonsterB();
  //drawMonsterC();
}

function movePlayer(dx, dy) {
  if (player.moving || gameState !== "explore") return;
  const newTileX = player.tileX + dx;
  const newTileY = player.tileY + dy;
  if (isMoveValid(newTileX, newTileY)) {
    player.tileX = newTileX;
    player.tileY = newTileY;
    player.targetX = player.tileX * tileSize;
    player.targetY = player.tileY * tileSize;
    player.moving = true;

  }
}

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp": movePlayer(0, -1); break;
    case "ArrowDown": movePlayer(0, 1); break;
    case "ArrowLeft": movePlayer(-1, 0); break;
    case "ArrowRight": movePlayer(1, 0); break;
  }
  checkEvent();
  checkTransition();
  checkStonePickup();
  checkMonsterA();
  checkMonsterB();
  //checkMonsterC()
});

function update() {
  const speed = 4;
  if (player.moving) {
    if (player.screenX < player.targetX) player.screenX += speed;
    if (player.screenX > player.targetX) player.screenX -= speed;
    if (player.screenY < player.targetY) player.screenY += speed;
    if (player.screenY > player.targetY) player.screenY -= speed;
    if (Math.abs(player.screenX - player.targetX) < speed &&
        Math.abs(player.screenY - player.targetY) < speed) {
      player.screenX = player.targetX;
      player.screenY = player.targetY;
      player.moving = false;
    }
  }
  if (gameState === "explore") drawGame();
  requestAnimationFrame(update);
}

// 戦闘システム
let playerHp = 20;
let enemyHp = 20;

function startBattle() {
  gameState = "battle";
  exploreScreen.classList.add("hidden");
  battleScreen.classList.remove("hidden");

  // 条件によって画像変更
  const playerImg = document.getElementById("player-monster-img");
  const enemyImg = document.getElementById("enemy-monster-img");

  const sinka_after = "assets/img/monster/playerEvolved.png";
  const sinka_before = "assets/img/monster/playerA.png";
  playerImg.src = "assets/img/monster/playerA.png";  
  
  // プレイヤーが進化の石を持っていたら進化形を使う
  if (evolutionStone.collected) {
    playerImg.src = sinka_after;
  } else {
    playerImg.src = sinka_before;
  }
  

  // 敵の種類はイベントに応じて変更可能
  if (!enemyA.collected) {
    enemyImg.src = "assets/img/monster/enemyA.png";
  } else {
    enemyImg.src = "assets/img/monster/enemyB.png";
  }

  resetBattle();
}

//   gameState = "battle";
//   exploreScreen.classList.add("hidden");
//   battleScreen.classList.remove("hidden");
//   resetBattle();
// }

function resetBattle() {
  playerHp = 20;
  enemyHp = 20;
  if (evolutionStone.collected) {
    playerHp = 100;
  }
  if (enemyA.collected) {
    enemyHp = 100;
  }

  document.getElementById('playerHp').textContent = playerHp;
  document.getElementById('enemyHp').textContent = enemyHp;
  document.getElementById('log').innerHTML = '';
  document.getElementById('command').style.display = 'block';

  const commandDiv = document.getElementById('command');

  // コマンド文言とボタンのセットを決める
  const moves = evolutionStone.collected
    ? ['ふいうち', 'ドリルこうげき', 'みちづれ', 'ツインドリル']  // 進化後
    : ['しっぺがえし', 'ふいうち', 'あくのはどう', 'うらみ'];            // 進化前

  // コマンド再構築
  commandDiv.innerHTML = "";//"<p>技を選んでください：</p>";
  for (const move of moves) {
    const btn = document.createElement("button");
    btn.textContent = move;
    btn.onclick = () => selectMove(move);
    commandDiv.appendChild(btn);
  }
}


// function resetBattle() {
//   playerHp = 20;
//   enemyHp = 20;
//   document.getElementById('playerHp').textContent = playerHp;
//   document.getElementById('enemyHp').textContent = enemyHp;
//   document.getElementById('log').innerHTML = '';
//   document.getElementById('command').style.display = 'block';
// }

function endBattle() {
  gameState = "explore";
  battleScreen.classList.add("hidden");
  exploreScreen.classList.remove("hidden");
  player.tileX = previousPosition.tileX;
  player.tileY = previousPosition.tileY;
  player.targetX = player.tileX * tileSize;
  player.targetY = player.tileY * tileSize;
  player.screenX = player.targetX;
  player.screenY = player.targetY;
}

function endBattleDefeat() {
  gameState = "explore";
  battleScreen.classList.add("hidden");
  exploreScreen.classList.remove("hidden");
  player.tileX = 1;
  player.tileY = 13;
  player.targetX = player.tileX * tileSize;
  player.targetY = player.tileY * tileSize;
  player.screenX = player.targetX;
  player.screenY = player.targetY;
  if(mapData === mapA){
    enemyA.collected = false;  
    BattleTriggerA = false;
  }else if (mapData === mapB){
    enemyB.collected = false;    
    BattleTriggerB = false;
  }
}

function log(msg) {
  const logDiv = document.getElementById('log');
  logDiv.innerHTML += msg + '<br>';
  logDiv.scrollTop = logDiv.scrollHeight;
}

function updateHp() {
  document.getElementById('playerHp').textContent = Math.max(playerHp, 0);
  document.getElementById('enemyHp').textContent = Math.max(enemyHp, 0);
}

function selectMove(move) {
  document.getElementById('command').style.display = 'none';
  const dmg = calculateDamage(move);

  enemyHp -= dmg;
  log(`みかたの「${move}」！ ${dmg} ダメージ！`);
  updateHp();

  if (dmg == 100){
    log("てきをたおしたが、");    
    log("みかたはたおれた…… 敗北！");
    setTimeout(endBattleDefeat, 2000); 
    return;
  }
  
  if (enemyHp <= 0) {
    log("てきをたおした！ 勝利！");
    setTimeout(endBattle, 2000);
    return;
  }
  setTimeout(enemyTurn, 1000);
}

function calculateDamage(move) {
  switch (move) {
    case 'したでなめる': return 0;
    case 'まきつく': return Math.floor(Math.random() * 3) + 8;
    case 'ドリルこうげき': return Math.floor(Math.random() * 10) + 21;
    case 'ツインドリル': return Math.floor(Math.random() * 20) + 30;
    case 'おまえをぜったいころす': return 9999;
    case 'こおりのツノ': return Math.floor(Math.random() * 10) + 15;
    case 'サンダーボルト': return Math.floor(Math.random() * 10) + 20;
    case 'ほのおのしっぽ': return Math.floor(Math.random() * 10) + 10;
    case 'はかいこうせん': return Math.floor(Math.random() * 20) + 40;
    case 'しっぺがえし': return Math.floor(Math.random() * 3) + 2;
    case 'ふいうち': return Math.floor(Math.random() * 5) + 1;
    case 'あくのはどう': return Math.floor(Math.random() * 3) + 3;
    case 'うらみ': return Math.floor(Math.random() * 2) + 2;    
    case 'みちづれ': return 100;
    default: return 0;
  }
}

function enemyTurn() {
  let moves = ['したでなめる', 'まきつく', 'ふいうち', 'みちづれ'];
  if(mapData === mapB){
    moves = ['こおりのツノ', 'サンダーボルト', 'ほのおのしっぽ', 'はかいこうせん'];
  }
  const move = moves[Math.floor(Math.random() * moves.length)];
  const dmg = calculateDamage(move);
  playerHp -= dmg;
  log(`てきの「${move}」！ ${dmg} ダメージ！`);
  updateHp();
  if (playerHp <= 0) {
    log("みかたはたおれた…… 敗北！");
    setTimeout(endBattleDefeat, 2000);    
    return;
  }
  setTimeout(() => {
    document.getElementById('command').style.display = 'block';
    // ここでlogを消す
    document.getElementById('log').innerHTML = '';
  }, 1000);
}



// bug

// No.1
// const tileProperties = {
//   0: { name: "草地", passable: true },
//   1: { name: "道", passable: true },
//   2: { name: "木", passable: false },
//   3: { name: "草むら", passable: true },
//   4: { name: "川", passable: false },
//   5: { name: "岩", passable: false },
//   6: { name: "左上", passable: false },
//   7: { name: "右上", passable: false },
//   8: { name: "左下", passable: false },
//   9: { name: "右下", passable: false },
//   10:{ name: "縦川", passable: false },
//121  //   11:{ name: "橋", passable: false }
// };


// No.2
// プレイヤーが進化の石を持っていたら進化形を使う
//405  // if (evolutionStone.collected) {
//    playerImg.src = sinka_before;
//  } else {
//   playerImg.src = sinka_before;
// }


// No.3
// function checkTransition() {
//131  //   if (currentMap === "A" && player.tileX === 13 && player.tileY === 14 ) {
//     currentMap = "B";
//     mapData = mapB;
//     player.tileX = 13;
//     player.tileY = 14;
//     player.targetX = player.tileX * tileSize;
//     player.targetY = player.tileY * tileSize;
//     player.screenX = player.targetX;
//     player.screenY = player.targetY;
//     player.moving = false;



