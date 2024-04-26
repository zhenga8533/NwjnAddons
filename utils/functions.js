export function fixLength(x) {
  return (x.toString().length === 2 ? x : `0${x}`)
}

// Creidt: Volcaronitee

const Threading = Java.type("gg.essential.api.utils.Multithreading");
export function delay(func, time) {
  if (time) {
    Threading.schedule(() => { func() }, time, java.util.concurrent.TimeUnit.MILLISECONDS);
  } else {
    Threading.runAsync(() => { func() });
  }
}

let registers = [];
export function registerWhen(trigger, dependency) {
  registers.push([trigger.unregister(), dependency, false]);
}

export function setRegisters() {
  registers.forEach(trigger => {
    if (trigger[1]() && !trigger[2]) {
      trigger[0].register();
      trigger[2] = true;
    } else if (!trigger[1]() && trigger[2]) {
      trigger[0].unregister();
      trigger[2] = false;
    }
  });
}

export function getRGB1(setting) {
  return [setting.getRed() / 255, setting.getGreen() / 255, setting.getBlue() / 255]
}

let worldJoin = []
let worldLeave = []
export function onWorldJoin(func) { worldJoin.push(func); }

export function onWorldLeave(func) { worldLeave.push(func); }

import { data } from "./data";

register("worldLoad", () => {
  let i = worldJoin.length;
  while (i--) {
    worldJoin[i]();
  }
  data.save()
}).setPriority(Priority.LOWEST);

register("worldUnload", () => {
  let i = worldLeave.length;
  while (i--) {
    worldLeave[i]()
  }
  data.save()
}).setPriority(Priority.LOWEST);

register("serverDisconnect", () => {
  let i = worldLeave.length;
  while (i--) {
    worldLeave[i]()
  }
  data.save()
}).setPriority(Priority.LOWEST);