// Mapping of device id -> product photo extracted from the Cisco
// Collaboration Device Product Matrix brochure. The brochure is
// publicly distributed by Cisco for buyer reference; the photos are
// used here for the same editorial / product-identification purpose.
// See <https://www.webex.com/content/dam/wbx/us/documents/pdf/Collaboration_Device_Product_Matrix_Brochure.pdf>.
//
// Devices without an entry fall back to the stylized 3D primitive in
// `DeviceModel.tsx`.

const base = `${import.meta.env.BASE_URL ?? '/'}devices/`

function img(hash: string): string {
  return `${base}img-${hash}.webp`
}

export const DEVICE_IMAGES: Record<string, string> = {
  // Boards & integrators (pages 3–5)
  'board-pro-g2-55': img('ec55e6e4e1'),
  'board-pro-g2-75': img('7a4fbdb9f3'),
  'room-kit-eqx': img('e7c7a7391f'),
  'room-bar-byod': img('4519aeafbe'),

  // Room bars & integrators (pages 6–10)
  'room-bar': img('5930e7bad9'),
  'room-bar-pro': img('985d42e216'),
  'room-kit-eq': img('5dffa60f11'),
  'room-kit-pro-g2': img('d451a37ab5'),

  // Desk series (pages 11–12)
  desk: img('6717ba491e'),
  'desk-pro-g2': img('1dc86014d2'),
  'desk-mini': img('6b3e2bab98'),

  // Phones (pages 13–20)
  'wireless-9821': img('31dabe8c8e'),
  'wireless-860': img('cbda5ccce5'),
  'dect-6825': img('afc9a47cad'),
  'conference-8832': img('68cffcece7'),
  'video-phone-8875': img('88ecdadfd5'),
  'desk-phone-9871': img('ed426f8af7'),
  'desk-phone-9841': img('8610de7dca'),

  // Headsets & earbuds (pages 21–22)
  'headset-320': img('25c4f2bbed'),
  'headset-520': img('5ada38fb4a'),
  'headset-560': img('bf6dfa019e'),
  'headset-730': img('8cb7938ed5'),
  'headset-bang-olufsen-900': img('976ab4d643'),
  'headset-950': img('8d6d12dc7d'),

  // Room navigators (page 23)
  'room-navigator-table': img('4b0fa15cf0'),
  'room-navigator-wall': img('2bfc3204c8'),

  // Microphones (page 24)
  'table-mic-pro': img('cbe669d0f2'),
  'ceiling-mic-pro': img('e0e483ccb3'),
  'table-mic': img('76da3a5033'),
  'ceiling-mic': img('3b82ce6285'),

  // Cameras (pages 25–26)
  'desk-camera-1080': img('adb4b47794'),
  'desk-camera-4k': img('d293d11020'),
  'quad-camera': img('12b412d18f'),
  'room-vision-ptz': img('37e1d7469f'),
  'ptz-4k-camera': img('167ce81553'),
}

export function deviceImage(id: string): string | undefined {
  return DEVICE_IMAGES[id]
}
