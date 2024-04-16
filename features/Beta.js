import settings from "../config";
import { registerWhen, holding, getVec3Pos, getVec3iPos, getRGB1 } from "../utils/functions";
import renderBeaconBeam from "BeaconBeam"
import RenderLib from "RenderLib"
import { EntityArmorStand } from "../utils/constants";
import { getWorld } from "../utils/world";

registerWhen(register("chat", (event) => {
  cancel(event)
}).setCriteria("[BOSS] ${*}"), () => settings.boss);

let dmgIds = []
registerWhen(register("tick", () => {
  const DMGS = World.getAllEntitiesOfType(EntityArmorStand.class).filter(stand => stand.getName().includes(",") && dmgIds.indexOf(stand.getUUID()) == -1 && !stand.getName().includes("Lv") && !stand.getName().includes("❤") && !stand.getName().removeFormatting().match(/[A-Za-z]/g))
  // const DMGS = World.getAllEntitiesOfType(EntityArmorStand.class).filter(e => e.getName().includes("⚔") && dmgIds.indexOf(e.getUUID()) == -1)
  
  DMGS.forEach(dmg => {
    ChatLib.chat(dmg.getName())
    dmgIds.push(dmg.getUUID())
  })
}), () => settings.damageTracker)

registerWhen(register("step", () => {
  dmg = []
  dmgIds = []
}).setDelay(20), () => settings.damageTracker)

// Credit: GriffinOwO on ct for gyro
registerWhen(register("renderWorld", (partialTick) => {
  if (holding("String", "id") != "GYROKINETIC_WAND") return;

  const moveObject = Player.getPlayer().func_174822_a(25, partialTick);

  if (moveObject.field_72313_a.toString() !== "BLOCK") return;

  const topBlockState = World.getWorld().func_180495_p(moveObject.func_178782_a().func_177984_a());
  const topBlock = topBlockState.func_177230_c(); 
  if (topBlock instanceof Java.type("net.minecraft.block.BlockSlab")) return;

  if (topBlock instanceof Java.type("net.minecraft.block.BlockStairs")) {
    const halfValue = topBlockState.func_177229_b(topBlock.field_176308_b);
    if (halfValue.toString() === "bottom") return;
  }

  if (topBlock.func_149730_j()) return;

  // Get the position
  const [x, y, z] = getVec3iPos(moveObject.func_178782_a()); 
  const [sx, sy, sz] = getVec3Pos(moveObject.field_72307_f);
  
  const [rx, ry, rz] = true ? [x + 0.5, y + 1, z + 0.5] : [sx, sy, sz]
  RenderLib.drawCyl(rx, ry, rz, 10, 1, 0.25, 30, 1, 0, 90, 90, ...getRGB1(settings.gyroColor), settings.gyroOpacity, false, false);
}), () => settings.gyro);

registerWhen(register("renderWorld", () => {
  if (!["JINGLE_BELLS", "ENRAGER"].includes(holding("String", "id"))) return;
  RenderLib.drawCyl(Player.getRenderX(), Player.getRenderY(), Player.getRenderZ(), 10, 1, 0.25, 30, 1, 0, 90, 90, ...getRGB1(settings.agroColor), settings.agroOpacity, false, false);
}), () => settings.agro);

registerWhen(register("renderWorld", () => {
  // TODO (TRY): get the banner skin and scan for banner
  const TOTEMS = World.getAllEntitiesOfType(EntityArmorStand.class).filter(totem => totem.getName().includes("Totem of Corruption") || settings.totemOptions != 0)
  TOTEMS.forEach(totem => {
    RenderLib.drawCyl(totem.getRenderX(), totem.getRenderY() - 0.25, totem.getRenderZ(), 18, 1, 0.25, 30, 1, 0, 90, 90, ...getRGB1(settings.totemColor), settings.totemOpacity, false, false);
  })

  const block = Player.lookingAt()
  if (block.toString().includes('minecraft:air') || settings.totemOptions == 1 || holding("String", "id") != "TOTEM_OF_CORRUPTION") return
  RenderLib.drawCyl(block.getRenderX() + 0.5, block.getRenderY() + 1, block.getRenderZ() + 0.5, 18, 1, 0.25, 30, 1, 0, 90, 90, ...getRGB1(settings.totemColor), settings.totemOpacity, false, false);
}), () => settings.totem);


function renderWaypoint(text, coords, hex, rgb) {
  RenderLib.drawEspBox(...coords, 1, 1, ...rgb, 1, true);
  RenderLib.drawInnerEspBox(...coords, 1, 1, ...rgb, 0.25, true);
  Tessellator.drawString(text, ...coords, hex, true);
  renderBeaconBeam(coords[0] - 0.5, coords[1], coords[2] - 0.5, ...rgb, 0.5, false, 75);
}

let exit = false;
let claimed = []
let corpses = []
/**
 * ! Fixed waypoints in the sense that once its rendered it does not move, interpret that as you will
 */
registerWhen(register("playerJoined", (playerMP) => {
  if (playerMP.getName() != Player.getName()) return;
  exit = [(~~playerMP.getX()) - 0.5, ~~playerMP.getY(), (~~playerMP.getZ()) - 0.5] // gets coords on joining shaft
}), () => settings.mineshaft)

registerWhen(register("step", () => {
  if (corpses.length >= 4) return; // 4 corpse cap
  const entities = World.getAllEntitiesOfType(EntityArmorStand.class).filter(a => !a.getEntity().func_95999_t() && !a.isInvisible()) // entities with invisibilty are removed
  if (!entities) return;
    
  let i = entities.length
  while (i--) {
    const entity = entities[i];
    const pos = entity.getPos();
    
    if (corpses.some(e => pos?.compareTo(e.vec) == 0) || claimed.some(e => pos.distance(e) < 7)) continue; // if corpse is already rendered or claimed, skip finding its coords
    try {
      const helm = new EntityLivingBase(entity.getEntity()).getItemInSlot(4).getName().removeFormatting();
      let [text, rgb] = [];
      switch (helm) {
        case "Lapis Armor Helmet":
          [text, rgb] = ["Lapis", [0.333, 0.333, 1]]; break;
        case "Mineral Helmet":
          [text, rgb] = ["Tungsten", [0.667, 0.667, 0.667]]; break;
        case "Yog Helmet":
          [text, rgb] = ["Umber", [1, 0.667, 0]]; break;
        case "Vanguard Helmet":
          [text, rgb] = ["Vanguard", [0.333, 1, 1]]; break;
        default: continue;
      }
      corpses.push(
        {
          "loc": [~~entity.getX(), ~~entity.getY(), ~~entity.getZ()],
          "vec": entity.getPos(),
          "text": text,
          "rgb": rgb
        });
    } catch (e) {}
  }
}).setDelay(1), () => settings.mineshaft && getWorld() == "Mineshaft")

registerWhen(register("renderWorld", () => {
  let x = corpses.length
  while (x--) {
    const corpse = corpses[x];
    if (claimed.some(e => corpse.vec.distance(e) < 7) || (settings.lapis && corpse.text != "Lapis")) continue;
    renderWaypoint(corpse.text, corpse.loc, 0xff5555, corpse.rgb);
  }
  if (exit) renderWaypoint("Exit", exit, 0x55ffff, [1, 0, 0])
}), () => settings.mineshaft && getWorld() == "Mineshaft");

registerWhen(register("chat", () => {
  claimed.push(Player.asPlayerMP().getPos())
}).setCriteria("  FROZEN CORPSE LOOT! "), () => settings.mineshaft && getWorld() == "Mineshaft");

register("worldUnload", () => {
  exit = false
  claimed.length = 0
  corpses.length = 0
});