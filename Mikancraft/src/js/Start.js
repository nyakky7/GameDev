import Minecraft from './net/minecraft/client/Minecraft.js';
import * as aesjs from '../../libraries/aes.js';
import Block from './net/minecraft/client/world/block/Block.js';
import { BlockRegistry } from './net/minecraft/client/world/block/BlockRegistry.js';
BlockRegistry.create();  // ← 必




BlockRegistry.create();
console.log("✅ BlockRegistry.create() 呼び出し完了");

class Start {

    loadTextures(textures) {
        let resources = [];
        let index = 0;

        return textures.reduce((currentPromise, texturePath) => {
            return currentPromise.then(() => {
                return new Promise((resolve, reject) => {
                    // Load texture
                    let image = new Image();
                    image.src = "src/resources/" + texturePath;
                    image.onload = () => resolve();
                    resources[texturePath] = image;

                    index++;
                });
            });
        }, Promise.resolve()).then(() => {
            return resources;
        });
    }

    launch(canvasWrapperId) {
        this.loadTextures([
            "misc/grasscolor.png",
            "gui/font.png",
            "gui/gui.png",
            "gui/background.png",
            "gui/icons.png",
            "terrain/terrain.png",
            "terrain/sun.png",
            "terrain/moon.png",
            "char.png",
            "gui/title/minecraft.png",
            "gui/title/background/panorama_0.png",
            "gui/title/background/panorama_1.png",
            "gui/title/background/panorama_2.png",
            "gui/title/background/panorama_3.png",
            "gui/title/background/panorama_4.png",
            "gui/title/background/panorama_5.png",
            "gui/container/creative.png"
        ]).then((resources) => {
            // Launch actual game on canvas
            window.app = new Minecraft(canvasWrapperId, resources);
        });
    }
}

// Listen on history back
window.addEventListener('pageshow', function (event) {
    if (window.app) {
        // Reload page to restart the game
        if (!window.app.running) {
            window.location.reload();
        }
    } else {
        // Launch game
        new Start().launch("canvas-container");
    }
});

export function require(module) {
    return window[module];
}

function exportSave() {
  if (!window.app || !window.app.player || !window.app.world) {
    alert("ゲームがまだ読み込まれていません！");
    return;
  }

  const saveData = {
    player: {
      x: window.app.player.x,
      y: window.app.player.y,
      z: window.app.player.z,
      inventory: window.app.player.inventory
    },
    blocks: getAllBlockStates(window.app.world)
  };
  console.log("📦 セーブ直前の saveData.blocks 件数:", Object.keys(saveData.blocks).length);
  const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "save.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importSave(event) {
  const player = window.app.player;
player.x = -8;
player.y = 20;
player.z = -8;

  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);  // ✅ dataはここで定義される
      const player = window.app.player;
      const world = window.app.world;

      // ✅ プレイヤー位置
      if (data.player) {
        player.x = data.player.x;
        player.y = data.player.y;
        player.z = data.player.z;

        const inv = player.inventory;
        for (let i in data.player.inventory) {
          inv.setItem?.(i, data.player.inventory[i]);
        }
      }

      // ✅ ブロック配置
      if (data.blocks) {
        console.log("✅ ロードブロック数:", Object.keys(data.blocks).length);
        loadAllBlockStates(world, data.blocks);

        // ✅ 描画再構築
        world.minecraft.worldRenderer.rebuildAll();
      } else {
        console.warn("❗ セーブデータに blocks が見つかりません");
      }

      alert("セーブデータを読み込みました！");
    } catch (err) {
      alert("ロード失敗: " + err.message);
      console.error(err);
    }
  };

  reader.readAsText(file); // ✅ ここが非同期 → reader.onload で data が渡される
}


// 以下はそのまま使ってOK
function getAllBlockStates(world) {
  const result = {};
  const chanker = 5
  // 🔽 範囲を -1〜1 チャンクのみに制限（合計 3×3＝9チャンク）
  for (let cx = -chanker; cx <= chanker; cx++) {
    for (let cz = -chanker; cz <= chanker; cz++) {
      const chunk = world.getChunkAt(cx, cz);
      if (!chunk) continue;

      for (let sy = 0; sy < 8; sy++) {
        const section = chunk.getSection(sy);
        if (!section) continue;

        for (let x = 0; x < 16; x++) {
          for (let y = 0; y < 16; y++) {
            for (let z = 0; z < 16; z++) {
              const id = section.getBlockAt(x, y, z);
              if (id === 0) continue;

              const block = Block.getById(id);
              if (!block) {
                console.warn(`未登録ブロックID: ${id}`);
                continue;
              }

              const wx = (cx << 4) + x;
              const wy = (sy << 4) + y;
              const wz = (cz << 4) + z;
              const name = typeof block.name === "string" ? block.name : (block.constructor?.name || "unknown");
result[`${wx},${wy},${wz}`] = block.id;

            }
          }
        }
      }
    }
  }

  console.log("🟢 セーブ対象ブロック数:", Object.keys(result).length);
  return result;
}
function loadAllBlockStates(world, savedBlocks) {
  // ✅ デバッグ：登録済みブロック一覧を確認
  for (let i = 0; i <= 100; i++) {
    const block = Block.getById(i);
    if (block) {
      console.log(`🧱 Block ID ${i} 登録済み: ${block.constructor.name}`);
    }
  }

  let placed = 0;
  let skipped = 0;

  for (const key in savedBlocks) {
    const [x, y, z] = key.split(",").map(Number);
    const id = savedBlocks[key];
    const block = Block.getById(id);

    if (!block) {
      console.warn(`❗ ブロックID ${id} が見つかりません`);
      continue;
    }

    // ✅ チャンクがロードされているか確認
    const chunk = world.getChunkAt(x >> 4, z >> 4);
    if (!chunk) {
      console.warn(`⚠️ チャンク未ロード: (${x >> 4}, ${z >> 4})`);
      skipped++;
      continue;
    }

    world.setBlockAt(x, y, z, id);
    placed++;
  }

  console.log(`✅ ${placed} ブロックを setBlockAt() しました`);
  console.log(`⚠️ ${skipped} ブロックはチャンクが未ロードでスキップ`);

  if (world.minecraft?.worldRenderer?.rebuildAll) {
    world.minecraft.worldRenderer.rebuildAll();
    console.log("🔄 ワールド描画を更新しました");
  } else {
    console.warn("❗ 描画の rebuildAll() が呼べませんでした");
  }

  // 再描画の強制再構築（すべてのチャンクセクション）
for (let cx = -10; cx <= 10; cx++) {
  for (let cz = -10; cz <= 10; cz++) {
    const chunk = world.getChunkAt(cx, cz);
    if (!chunk) continue;
    for (let sy = 0; sy < 8; sy++) {
      const section = chunk.getSection(sy);
      if (!section) continue;

      section.isModified = true;
      section.rebuild(world.minecraft.worldRenderer); // rebuildを呼ぶ

      // ✅ Three.jsのsceneに追加されているか確認＋強制追加
      if (!world.minecraft.worldRenderer.scene.children.includes(section.group)) {
        world.minecraft.worldRenderer.scene.add(section.group);
        console.log("✅ セクションをシーンに追加:", section);
      }
    }
  }
}

}

window.loadAllBlockStates = loadAllBlockStates;

document.getElementById("loadWorldFile").addEventListener("change", (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      window.selectedSaveData = data;
      alert("セーブデータを読み込みました！『Create World』を押してください");
    } catch (err) {
      alert("ロード失敗：" + err.message);
    }
  };
  reader.readAsText(file);
});


// イベント登録（type=module対応）
document.getElementById("saveBtn").addEventListener("click", exportSave);
document.getElementById("loadFile").addEventListener("change", importSave);
